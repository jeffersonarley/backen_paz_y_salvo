// Pruebas unitarias de controllers/supervisionController.js
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

jest.mock('../src/models/Contrato');
jest.mock('../src/models/DependenciaArea');
jest.mock('../src/models/TrazabilidadFirma');
jest.mock('../src/services/emailService', () => ({
  enviarCorreo: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('../src/services/auditoriaService', () => ({ registrar: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/services/plantillaService', () => ({
  obtenerPlantillaContrato: jest.fn(),
}));

const Contrato = require('../src/models/Contrato');
const DependenciaArea = require('../src/models/DependenciaArea');
const TrazabilidadFirma = require('../src/models/TrazabilidadFirma');
const { enviarCorreo } = require('../src/services/emailService');
const { registrar } = require('../src/services/auditoriaService');
const { obtenerPlantillaContrato } = require('../src/services/plantillaService');
const controlador = require('../src/controllers/supervisionController');
const { ejecutar, ejecutarEsperandoError } = require('./helpers/mocks');

const ID_CONTRATO = '507f1f77bcf86cd799439033';
const ID_AREA = '507f1f77bcf86cd799439022';
const ID_SUPERVISOR = '507f1f77bcf86cd799439011';

const reqDe = (usuario = { id: ID_SUPERVISOR, rol: 'Supervisor' }, body = {}) => ({
  usuario,
  body,
  params: { id: ID_CONTRATO },
  query: {},
});

const contratoBorrador = () => ({
  _id: ID_CONTRATO,
  numero_contrato: 'CNT-1',
  estado: 'Borrador',
  supervisor: ID_SUPERVISOR,
  correo_contratista: 'contratista@x.co',
  nombre_contratista: 'Contratista Prueba',
});

beforeEach(() => {
  jest.clearAllMocks();
  obtenerPlantillaContrato.mockResolvedValue({
    tipo: 'COMPLETA',
    filas: [
      { id_fila: 1, aplica: true, dependencia_id: ID_AREA, responsables: [] },
      { id_fila: 2, aplica: false, dependencia_id: null, responsables: [] },
    ],
  });
  DependenciaArea.find.mockResolvedValue([
    { _id: ID_AREA, nombre_dependencia: 'TIC', activo: true, responsable_id: 'resp-1', responsables_ids: ['resp-1'] },
  ]);
  TrazabilidadFirma.insertMany.mockResolvedValue([]);
  TrazabilidadFirma.deleteMany.mockResolvedValue({ deletedCount: 0 });
  enviarCorreo.mockResolvedValue({ ok: true });
});

describe('supervisionController.evaluarContrato - validaciones', () => {
  test('exige rol Supervisor o Administrador', async () => {
    const error = await ejecutarEsperandoError(
      controlador.evaluarContrato,
      reqDe({ id: 'resp-1', rol: 'ResponsableArea' }, { aprobado: true })
    );
    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/Se requiere rol de Supervisor o Administrador/i);
  });

  test('exige que "aprobado" sea booleano', async () => {
    const error = await ejecutarEsperandoError(
      controlador.evaluarContrato,
      reqDe(undefined, { aprobado: 'sí' })
    );
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/true o false/i);
  });

  test('devuelve 404 si el contrato no existe', async () => {
    Contrato.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(error.statusCode).toBe(404);
  });

  test('el Supervisor no puede evaluar un contrato que no supervisa', async () => {
    Contrato.findById.mockResolvedValue({ ...contratoBorrador(), supervisor: 'otro-sup' });

    const error = await ejecutarEsperandoError(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/No estás asignado como supervisor/i);
  });

  test('no permite evaluar un contrato que ya está en firma', async () => {
    Contrato.findById.mockResolvedValue({ ...contratoBorrador(), estado: 'Pendiente de Firmas' });

    const error = await ejecutarEsperandoError(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(error.statusCode).toBe(409);
    expect(error.message).toMatch(/no se puede evaluar en estado/i);
  });

  test('el Administrador puede evaluar aunque no sea el supervisor', async () => {
    Contrato.findById.mockResolvedValue({ ...contratoBorrador(), supervisor: 'otro-sup' });
    Contrato.findOneAndUpdate.mockResolvedValue({ ...contratoBorrador(), estado: 'Pendiente de Firmas' });

    const { res } = await ejecutar(
      controlador.evaluarContrato,
      reqDe({ id: 'admin-1', rol: 'Administrador' }, { aprobado: true })
    );

    expect(res.statusCode).toBe(200);
  });
});

describe('supervisionController.evaluarContrato - aprobación', () => {
  test('abre los casilleros de firma con los firmantes autorizados', async () => {
    Contrato.findById.mockResolvedValue(contratoBorrador());
    Contrato.findOneAndUpdate.mockResolvedValue({ ...contratoBorrador(), estado: 'Pendiente de Firmas' });

    const { res } = await ejecutar(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.mensaje).toMatch(/aprobado por el supervisor/i);
    expect(Contrato.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: ID_CONTRATO, estado: { $in: ['Borrador', 'EnProceso', 'Rechazado'] } },
      { $set: { estado: 'Pendiente de Firmas' } },
      { returnDocument: 'after' }
    );
    expect(TrazabilidadFirma.deleteMany).toHaveBeenCalledWith({ contrato_id: ID_CONTRATO });
    expect(TrazabilidadFirma.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        contrato_id: ID_CONTRATO,
        area_id: ID_AREA,
        estado: 'Pendiente',
        firmantes_autorizados: ['resp-1'],
      }),
    ]);
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'APROBAR_CONTRATO' }));
  });

  test('une los firmantes asignados por el coordinator en la plantilla', async () => {
    obtenerPlantillaContrato.mockResolvedValue({
      tipo: 'PERSONALIZADA',
      filas: [
        { id_fila: 1, aplica: true, dependencia_id: ID_AREA, responsables: [{ id: 'firmante-extra' }] },
      ],
    });
    Contrato.findById.mockResolvedValue(contratoBorrador());
    Contrato.findOneAndUpdate.mockResolvedValue({ ...contratoBorrador(), estado: 'Pendiente de Firmas' });

    await ejecutar(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(TrazabilidadFirma.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        firmantes_autorizados: expect.arrayContaining(['resp-1', 'firmante-extra']),
      }),
    ]);
  });

  test('falla si la plantilla no tiene dependencias aplicables', async () => {
    obtenerPlantillaContrato.mockResolvedValue({ tipo: 'COMPLETA', filas: [{ id_fila: 1, aplica: false, dependencia_id: null, responsables: [] }] });
    Contrato.findById.mockResolvedValue(contratoBorrador());

    const error = await ejecutarEsperandoError(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(error.statusCode).toBe(409);
    expect(error.message).toMatch(/no tiene dependencias aplicables/i);
  });

  test('falla si no hay dependencias activas', async () => {
    Contrato.findById.mockResolvedValue(contratoBorrador());
    DependenciaArea.find.mockResolvedValue([]);

    const error = await ejecutarEsperandoError(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(error.statusCode).toBe(409);
    expect(error.message).toMatch(/No hay dependencias activas/i);
  });

  test('revierte el estado del contrato si no se pueden abrir los casilleros', async () => {
    Contrato.findById.mockResolvedValue(contratoBorrador());
    Contrato.findOneAndUpdate.mockResolvedValue({ ...contratoBorrador(), estado: 'Pendiente de Firmas' });
    TrazabilidadFirma.insertMany.mockRejectedValue(new Error('fallo de base de datos'));
    Contrato.updateOne.mockResolvedValue({ acknowledged: true });

    const error = await ejecutarEsperandoError(controlador.evaluarContrato, reqDe(undefined, { aprobado: true }));

    expect(error).toBeDefined();
    expect(Contrato.updateOne).toHaveBeenCalledWith(
      { _id: ID_CONTRATO },
      { $set: { estado: 'Borrador' } }
    );
  });
});

describe('supervisionController.evaluarContrato - rechazo', () => {
  test('devuelve el contrato a Borrador, cancela casilleros y notifica', async () => {
    Contrato.findById.mockResolvedValue({ ...contratoBorrador(), estado: 'Pendiente de Firmas' });
    Contrato.findOneAndUpdate.mockResolvedValue({
      ...contratoBorrador(),
      estado: 'Borrador',
      observaciones_supervisor: 'Falta la certificación',
    });

    const { res } = await ejecutar(
      controlador.evaluarContrato,
      reqDe(undefined, { aprobado: false, observaciones_supervisor: '  Falta la certificación  ' })
    );

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.mensaje).toMatch(/rechazado exitosamente/i);
    expect(Contrato.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: ID_CONTRATO, estado: { $in: ['Borrador', 'EnProceso', 'Rechazado', 'Pendiente de Firmas'] } },
      { $set: { estado: 'Borrador', observaciones_supervisor: 'Falta la certificación' } },
      { returnDocument: 'after' }
    );
    expect(TrazabilidadFirma.updateMany).toHaveBeenCalledWith(
      { contrato_id: ID_CONTRATO, estado: 'Pendiente' },
      { $set: { estado: 'Cancelado' } }
    );
    expect(enviarCorreo).toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'RECHAZAR_CONTRATO' }));
  });

  test('usa un texto por defecto cuando no hay observaciones', async () => {
    Contrato.findById.mockResolvedValue(contratoBorrador());
    Contrato.findOneAndUpdate.mockResolvedValue({ ...contratoBorrador(), estado: 'Borrador' });

    await ejecutar(controlador.evaluarContrato, reqDe(undefined, { aprobado: false }));

    expect(Contrato.findOneAndUpdate.mock.calls[0][1].$set.observaciones_supervisor).toMatch(/Rechazado por el supervisor/i);
  });

  test('no cancela casilleros si el contrato no estaba en firma', async () => {
    Contrato.findById.mockResolvedValue(contratoBorrador());
    Contrato.findOneAndUpdate.mockResolvedValue({ ...contratoBorrador(), estado: 'Borrador' });

    await ejecutar(controlador.evaluarContrato, reqDe(undefined, { aprobado: false }));

    expect(TrazabilidadFirma.updateMany).not.toHaveBeenCalled();
  });
});
