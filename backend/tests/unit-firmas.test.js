// Pruebas unitarias de controllers/firmasController.js
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

jest.mock('../src/models/Contrato');
jest.mock('../src/models/DependenciaArea');
jest.mock('../src/models/TrazabilidadFirma');
jest.mock('../src/models/Usuario');
jest.mock('../src/models/BienEntregado');
jest.mock('../src/services/emailService', () => ({
  enviarCorreo: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('../src/services/pdfService', () => ({
  generarPdf: jest.fn().mockResolvedValue(Buffer.from('PDF')),
}));
jest.mock('../src/services/auditoriaService', () => ({ registrar: jest.fn().mockResolvedValue(undefined) }));

const Contrato = require('../src/models/Contrato');
const DependenciaArea = require('../src/models/DependenciaArea');
const TrazabilidadFirma = require('../src/models/TrazabilidadFirma');
const Usuario = require('../src/models/Usuario');
const BienEntregado = require('../src/models/BienEntregado');
const { enviarCorreo } = require('../src/services/emailService');
const { generarPdf } = require('../src/services/pdfService');
const { registrar } = require('../src/services/auditoriaService');
const controlador = require('../src/controllers/firmasController');
const { ejecutar, ejecutarEsperandoError, usuarioSimulado, cadenaConsulta } = require('./helpers/mocks');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const ID_CONTRATO = '507f1f77bcf86cd799439033';
const ID_AREA = '507f1f77bcf86cd799439022';
const ID_USUARIO = '507f1f77bcf86cd799439011';

const reqDe = (usuario = { id: ID_USUARIO, rol: 'ResponsableArea', dependencia_id: ID_AREA }, body = {}) => ({
  usuario,
  body,
  params: {},
  query: {},
});

const contratoPendiente = () => ({
  _id: ID_CONTRATO,
  numero_contrato: 'CNT-1',
  estado: 'Pendiente de Firmas',
  correo_contratista: 'contratista@x.co',
  nombre_contratista: 'Contratista Prueba',
});

beforeEach(() => {
  jest.clearAllMocks();
  DependenciaArea.find.mockReturnValue(cadenaConsulta([]));
  Usuario.find.mockReturnValue(cadenaConsulta([]));
  BienEntregado.find.mockResolvedValue([]);
  TrazabilidadFirma.countDocuments.mockResolvedValue(0);
  TrazabilidadFirma.find.mockReturnValue(cadenaConsulta([]));
  enviarCorreo.mockResolvedValue({ ok: true });
  generarPdf.mockResolvedValue(Buffer.from('PDF'));
});

describe('firmasController.procesarFirma - validaciones', () => {
  test('exige contratoId y accion', async () => {
    const error = await ejecutarEsperandoError(controlador.procesarFirma, reqDe(undefined, {}));
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/Faltan campos obligatorios/i);
  });

  test('rechaza una acción desconocida', async () => {
    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Borrar' })
    );
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/Acción no reconocida/i);
  });

  test('solo permite ResponsibleArea y Administrador', async () => {
    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, { contratoId: ID_CONTRATO, accion: 'Aprobar' })
    );
    expect(error.statusCode).toBe(403);
  });

  test('devuelve 404 si el contrato no existe', async () => {
    Contrato.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar' })
    );

    expect(error.statusCode).toBe(404);
  });

  test('no permite firmar un contrato que no está pendiente de firmas', async () => {
    Contrato.findById.mockResolvedValue({ ...contratoPendiente(), estado: 'Finalizado' });

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar' })
    );

    expect(error.statusCode).toBe(409);
    expect(error.message).toMatch(/no está pendiente de firmas/i);
  });
});

describe('firmasController.procesarFirma - autorización del casillero', () => {
  test('informa a quién le corresponde firmar cuando el usuario no tiene casilla', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue(null);
    TrazabilidadFirma.find.mockReturnValue(
      cadenaConsulta([{ firmantes_autorizados: ['u-1', 'u-2'] }])
    );
    Usuario.find.mockReturnValue(
      cadenaConsulta([
        { nombre_completo: 'Responsable TIC' },
        { nombre_completo: 'Responsable Almacén' },
      ])
    );

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe({ id: 'sin-dep', rol: 'ResponsableArea', dependencia_id: null }, { contratoId: ID_CONTRATO, accion: 'Aprobar' })
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/No tienes una casilla asignada/i);
    expect(error.message).toMatch(/Responsable TIC/);
  });

  test('rechaza a quien no está entre los firmantes autorizados de la casilla', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: ['otro-1'],
    });
    Usuario.find.mockReturnValue(cadenaConsulta([{ nombre_completo: 'Otro Responsable' }]));

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar' })
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/Esta casilla solo puede firmarla: Otro Responsable/i);
  });

  test('no permite firmar dos veces la misma casilla', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Aprobado',
      firmantes_autorizados: [],
    });

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar' })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/ya realizó su acción/i);
  });

  test('busca el casillero exacto cuando se indica la dependencia', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue(null);

    await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar', dependencia_id: ID_AREA })
    );

    expect(TrazabilidadFirma.findOne).toHaveBeenCalledWith({
      contrato_id: ID_CONTRATO,
      area_id: ID_AREA,
    });
  });

  test('devuelve 400 si no existe registro de firma para el área', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar' })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/No existe un registro de firma/i);
  });
});

describe('firmasController.procesarFirma - aprobación', () => {
  test('aprueba la casilla y avisa que faltan firmas', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: [],
    });
    TrazabilidadFirma.findOneAndUpdate.mockResolvedValue({ _id: 't1', estado: 'Aprobado' });
    TrazabilidadFirma.countDocuments
      .mockResolvedValueOnce(2) // no aprobadas
      .mockResolvedValueOnce(2); // pendientes

    const { res } = await ejecutar(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar', firma_base64: PNG })
    );

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.mensaje).toMatch(/Aún quedan firmas pendientes/i);
    expect(res.cuerpo.pendientes).toBe(2);
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'APROBAR_FIRMA' })
    );
    expect(generarPdf).not.toHaveBeenCalled();
  });

  test('finaliza el contrato, genera el PDF y notifica cuando todas las casillas están aprobadas', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: [],
    });
    TrazabilidadFirma.findOneAndUpdate.mockResolvedValue({ _id: 't1', estado: 'Aprobado' });
    TrazabilidadFirma.countDocuments.mockResolvedValue(0);
    Contrato.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: ID_CONTRATO,
        numero_contrato: 'CNT-1',
        correo_contratista: 'contratista@x.co',
        estado: 'Finalizado',
      }),
    });

    const { res } = await ejecutar(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar', firma_base64: PNG })
    );

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.mensaje).toMatch(/finalizado/i);
    expect(generarPdf).toHaveBeenCalled();
    expect(enviarCorreo).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('Finalizado') })
    );
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'FINALIZAR_CONTRATO' })
    );
  });

  test('rechaza una firma que no es una imagen válida', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: [],
    });

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Aprobar', firma_base64: 'no-es-una-imagen' })
    );

    expect(error).toBeDefined();
    expect(TrazabilidadFirma.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe('firmasController.procesarFirma - rechazo', () => {
  test('exige observación al rechazar', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: [],
    });

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Rechazar' })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/observación/i);
  });

  test('limita la observación a 1000 caracteres', async () => {
    Contrato.findById.mockResolvedValue(contratoPendiente());
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: [],
    });

    const error = await ejecutarEsperandoError(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Rechazar', observacion_rechazo: 'x'.repeat(1001) })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/1000 caracteres/i);
  });

  test('rechaza el trámite completo, notifica y audita', async () => {
    Contrato.findById
      .mockResolvedValueOnce(contratoPendiente())
      .mockResolvedValueOnce({ ...contratoPendiente(), estado: 'Rechazado' });
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: [],
    });
    TrazabilidadFirma.findOneAndUpdate.mockResolvedValue({ _id: 't1', estado: 'Rechazado' });
    Contrato.updateOne.mockResolvedValue({ acknowledged: true });

    const { res } = await ejecutar(
      controlador.procesarFirma,
      reqDe(undefined, { contratoId: ID_CONTRATO, accion: 'Rechazar', observacion_rechazo: 'Falta inventario' })
    );

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.mensaje).toMatch(/Rechazado/i);
    expect(Contrato.updateOne).toHaveBeenCalledWith(
      { _id: ID_CONTRATO, estado: 'Pendiente de Firmas' },
      { $set: { estado: 'Rechazado' } }
    );
    expect(enviarCorreo).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('Rechazado') })
    );
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'RECHAZAR_FIRMA' })
    );
  });
});

describe('firmasController.verificarFirma', () => {
  test('devuelve 404 si el hash no existe', async () => {
    TrazabilidadFirma.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const { res } = await ejecutar(controlador.verificarFirma, { params: { hash: 'abc' } });

    expect(res.statusCode).toBe(404);
    expect(res.cuerpo.valido).toBe(false);
  });

  test('devuelve 404 si el contrato asociado ya no existe', async () => {
    TrazabilidadFirma.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ hash_verificacion: 'abc', contrato_id: ID_CONTRATO }),
    });
    Contrato.findById.mockResolvedValue(null);

    const { res } = await ejecutar(controlador.verificarFirma, { params: { hash: 'abc' } });

    expect(res.statusCode).toBe(404);
    expect(res.cuerpo.mensaje).toMatch(/contrato asociado/i);
  });

  test('valida la firma cuando el contenido no ha cambiado', async () => {
    const traz = {
      hash_verificacion: 'abc',
      contrato_id: ID_CONTRATO,
      area_id: { _id: ID_AREA, nombre_dependencia: 'TIC' },
      usuario_id: ID_USUARIO,
      fecha_firma: new Date('2026-01-01T00:00:00.000Z'),
    };
    TrazabilidadFirma.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(traz),
    });
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, numero_contrato: 'CNT-1', estado: 'Finalizado' });
    BienEntregado.find.mockResolvedValue([]);

    const { res } = await ejecutar(controlador.verificarFirma, { params: { hash: 'abc' } });

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.valido).toBe(false);
    expect(res.cuerpo.numero_contrato).toBe('CNT-1');
    expect(res.cuerpo.area).toBe('TIC');
  });
});

describe('firmasController.listarPendientes', () => {
  test('el Administrador ve todos los casilleros pendientes', async () => {
    TrazabilidadFirma.find.mockReturnValue(cadenaConsulta([{ _id: 't1' }]));

    const { res } = await ejecutar(
      controlador.listarPendientes,
      reqDe({ id: 'admin-1', rol: 'Administrador' })
    );

    expect(res.statusCode).toBe(200);
    expect(TrazabilidadFirma.find).toHaveBeenCalledWith({ estado: 'Pendiente' });
  });

  test('el responsable solo ve los casilleros de sus dependencias', async () => {
    DependenciaArea.find.mockReturnValue(cadenaConsulta([{ _id: 'dep-2' }]));
    TrazabilidadFirma.find.mockReturnValue(cadenaConsulta([]));

    const { res } = await ejecutar(controlador.listarPendientes, reqDe());

    expect(res.statusCode).toBe(200);
    expect(TrazabilidadFirma.find).toHaveBeenCalledWith({
      estado: 'Pendiente',
      area_id: { $in: [ID_AREA, 'dep-2'] },
    });
  });

  test('un responsable sin dependencia recibe un mensaje claro', async () => {
    DependenciaArea.find.mockReturnValue(cadenaConsulta([]));

    const error = await ejecutarEsperandoError(
      controlador.listarPendientes,
      reqDe({ id: 'sin-dep', rol: 'ResponsableArea', dependencia_id: null })
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/No tienes ninguna dependencia asignada/i);
  });
});

describe('firmasController.listarHistorial', () => {
  test('devuelve las casillas ya gestionadas del responsable', async () => {
    DependenciaArea.find.mockReturnValue(cadenaConsulta([]));
    TrazabilidadFirma.find.mockReturnValue(cadenaConsulta([{ _id: 't1', estado: 'Aprobado' }]));

    const { res } = await ejecutar(controlador.listarHistorial, reqDe());

    expect(res.statusCode).toBe(200);
    expect(TrazabilidadFirma.find).toHaveBeenCalledWith({
      estado: { $ne: 'Pendiente' },
      area_id: { $in: [ID_AREA] },
    });
  });

  test('el Administrador ve todo el historial', async () => {
    TrazabilidadFirma.find.mockReturnValue(cadenaConsulta([]));

    await ejecutar(controlador.listarHistorial, reqDe({ id: 'admin-1', rol: 'Administrador' }));

    expect(TrazabilidadFirma.find).toHaveBeenCalledWith({ estado: { $ne: 'Pendiente' } });
  });
});
