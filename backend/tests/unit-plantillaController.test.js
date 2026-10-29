// Pruebas unitarias de controllers/plantillaController.js
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

jest.mock('../src/models/Contrato');
jest.mock('../src/models/DependenciaArea');
jest.mock('../src/models/Usuario');
jest.mock('../src/services/auditoriaService', () => ({ registrar: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/services/plantillaService', () => {
  const { TEMPLATAS } = require('../src/constants/plantillas');
  return {
    TEMPLATAS,
    construirFilas: jest.fn(),
    obtenerDependenciasConResponsables: jest.fn(),
    obtenerPlantillaContrato: jest.fn(),
  };
});

const Contrato = require('../src/models/Contrato');
const DependenciaArea = require('../src/models/DependenciaArea');
const Usuario = require('../src/models/Usuario');
const { registrar } = require('../src/services/auditoriaService');
const servicio = require('../src/services/plantillaService');
const controlador = require('../src/controllers/plantillaController');
const { ejecutar, ejecutarEsperandoError, usuarioSimulado, cadenaConsulta } = require('./helpers/mocks');

const ID_USUARIO = '507f1f77bcf86cd799439011';
const ID_RESPONSABLE = '507f1f77bcf86cd799439022';
const ID_CONTRATO = '507f1f77bcf86cd799439033';

const reqDe = (usuario = { id: ID_USUARIO, rol: 'Supervisor' }, body = {}, params = {}) => ({
  usuario,
  body,
  params,
  query: {},
});

beforeEach(() => {
  jest.clearAllMocks();
  servicio.construirFilas.mockReturnValue([{ id_fila: 1, aplica: true }]);
  servicio.obtenerDependenciasConResponsables.mockResolvedValue([]);
  servicio.obtenerPlantillaContrato.mockResolvedValue({ tipo: 'COMPLETA', filas: [] });
});

describe('plantillaController.obtenerFilasDisponibles', () => {
  test('devuelve las plantillas, las filas y las dependencias', async () => {
    servicio.obtenerDependenciasConResponsables.mockResolvedValue([
      {
        _id: 'dep-1',
        nombre_dependencia: 'Gestión Tecnológica (TIC)',
        activo: true,
        responsables_ids: [{ _id: ID_RESPONSABLE, nombre_completo: 'Franklin', correo_institucional: 'tic@x.co', rol: 'ResponsableArea' }],
      },
    ]);

    const { res } = await ejecutar(controlador.obtenerFilasDisponibles, reqDe());

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.plantillas).toHaveLength(4);
    expect(res.cuerpo.filas).toEqual([{ id_fila: 1, aplica: true }]);
    expect(res.cuerpo.dependencias[0]).toEqual(
      expect.objectContaining({
        id: 'dep-1',
        nombre: 'Gestión Tecnológica (TIC)',
        activo: true,
        responsables: [
          expect.objectContaining({ id: ID_RESPONSABLE, nombre: 'Franklin' }),
        ],
      })
    );
  });

  test('para el Supervisor carga su apoyo de supervisión', async () => {
    Usuario.findById
      .mockResolvedValueOnce(usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor', apoyo_supervision_id: 'apo-1' }))
      .mockResolvedValueOnce(usuarioSimulado({ _id: 'apo-1', nombre_completo: 'Nelson' }));

    await ejecutar(controlador.obtenerFilasDisponibles, reqDe());

    expect(Usuario.findById).toHaveBeenCalledWith('apo-1');
    expect(servicio.construirFilas).toHaveBeenCalledWith(
      expect.objectContaining({ supervisor: expect.objectContaining({ _id: ID_USUARIO }), apoyoSupervision: expect.objectContaining({ _id: 'apo-1' }) })
    );
  });

  test('para el Administrador no busca supervisor ni apoyo', async () => {
    await ejecutar(controlador.obtenerFilasDisponibles, reqDe({ id: 'admin-1', rol: 'Administrador' }));

    expect(Usuario.findById).not.toHaveBeenCalled();
  });
});

describe('plantillaController.obtenerPlantilla', () => {
  test('devuelve 404 si el contrato no existe', async () => {
    Contrato.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.obtenerPlantilla,
      reqDe(undefined, {}, { id: ID_CONTRATO })
    );

    expect(error.statusCode).toBe(404);
    expect(error.message).toMatch(/no encontrado/i);
  });

  test('el contratista no puede ver la plantilla de otro contrato', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, usuario: 'otro-1' });

    const error = await ejecutarEsperandoError(
      controlador.obtenerPlantilla,
      reqDe({ id: 'contratista-1', rol: 'Contratista' }, {}, { id: ID_CONTRATO })
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/no te pertenece/i);
  });

  test('el Supervisor no puede ver la plantilla de un contrato que no supervisa', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, supervisor: 'otro-sup' });

    const error = await ejecutarEsperandoError(
      controlador.obtenerPlantilla,
      reqDe(undefined, {}, { id: ID_CONTRATO })
    );

    expect(error.statusCode).toBe(403);
  });

  test('un rol no autorizado no puede consultar la plantilla', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO });

    const error = await ejecutarEsperandoError(
      controlador.obtenerPlantilla,
      reqDe({ id: 'resp-1', rol: 'ResponsableArea' }, {}, { id: ID_CONTRATO })
    );

    expect(error.statusCode).toBe(403);
  });

  test('el contratista propietario recibe la plantilla del contrato', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, usuario: 'contratista-1' });
    servicio.obtenerPlantillaContrato.mockResolvedValue({ tipo: 'INSTRUCTORES', filas: [{ id_fila: 1 }] });

    const { res } = await ejecutar(
      controlador.obtenerPlantilla,
      reqDe({ id: 'contratista-1', rol: 'Contratista' }, {}, { id: ID_CONTRATO })
    );

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo.tipo).toBe('INSTRUCTORES');
  });
});

describe('plantillaController.actualizarPlantilla', () => {
  test('rechaza a un contratista', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, usuario: 'contratista-1' });

    const error = await ejecutarEsperandoError(
      controlador.actualizarPlantilla,
      reqDe({ id: 'contratista-1', rol: 'Contratista' }, {}, { id: ID_CONTRATO })
    );

    expect(error.statusCode).toBe(403);
  });

  test('rechaza una plantilla inexistente', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, supervisor: ID_USUARIO });

    const error = await ejecutarEsperandoError(
      controlador.actualizarPlantilla,
      reqDe(undefined, { plantilla_tipo: 'INVENTADA' }, { id: ID_CONTRATO })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/plantilla indicada no existe/i);
  });

  test('normaliza y guarda la plantilla con sus firmantes', async () => {
    const contrato = { _id: ID_CONTRATO, supervisor: ID_USUARIO, plantilla_tipo: 'COMPLETA', save: jest.fn().mockResolvedValue(undefined) };
    Contrato.findById.mockResolvedValue(contrato);
    Usuario.find.mockResolvedValue([usuarioSimulado({ _id: ID_RESPONSABLE, nombre_completo: 'Franklin' })]);

    const { res } = await ejecutar(
      controlador.actualizarPlantilla,
      reqDe(
        undefined,
        {
          plantilla_tipo: '  instructores ',
          filas: [
            { id_fila: 1, dependencia_id: 'dep-tic', responsables: [ID_RESPONSABLE], aplica: true },
            { id_fila: 'x', responsables: [] },
          ],
        },
        { id: ID_CONTRATO }
      )
    );

    expect(res.statusCode).toBe(200);
    expect(contrato.plantilla_tipo).toBe('INSTRUCTORES');
    expect(contrato.plantilla_firmantes).toHaveLength(1);
    expect(contrato.plantilla_firmantes[0]).toEqual(
      expect.objectContaining({
        id_fila: 1,
        responsables: [ID_RESPONSABLE],
        nombres: ['Franklin'],
        aplica: true,
        marca: 'X',
      })
    );
    expect(contrato.save).toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'ACTUALIZAR_PLANTILLA_CONTRATO' })
    );
  });

  test('descarta los identificadores de firmante que no son válidos', async () => {
    const contrato = { _id: ID_CONTRATO, supervisor: ID_USUARIO, save: jest.fn().mockResolvedValue(undefined) };
    Contrato.findById.mockResolvedValue(contrato);
    Usuario.find.mockResolvedValue([]);

    await ejecutar(
      controlador.actualizarPlantilla,
      reqDe(undefined, { filas: [{ id_fila: 1, responsables: ['no-valido'] }] }, { id: ID_CONTRATO })
    );

    expect(Usuario.find).not.toHaveBeenCalled();
    expect(contrato.plantilla_firmantes[0].responsables).toEqual([]);
  });
});

describe('plantillaController.actualizarPlantillaPredeterminada', () => {
  test('devuelve 404 si el usuario no existe', async () => {
    Usuario.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.actualizarPlantillaPredeterminada,
      reqDe(undefined, { plantilla_tipo: 'INSTRUCTORES' })
    );

    expect(error.statusCode).toBe(404);
  });

  test('rechaza una plantilla inexistente', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado());

    const error = await ejecutarEsperandoError(
      controlador.actualizarPlantillaPredeterminada,
      reqDe(undefined, { plantilla_tipo: 'OTRA' })
    );

    expect(error.statusCode).toBe(400);
  });

  test('guarda la plantilla predeterminada del coordinador', async () => {
    const usuario = usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor' });
    Usuario.findById.mockResolvedValue(usuario);

    const { res } = await ejecutar(
      controlador.actualizarPlantillaPredeterminada,
      reqDe(undefined, { plantilla_tipo: 'instructores' })
    );

    expect(res.statusCode).toBe(200);
    expect(usuario.plantilla_predeterminada).toBe('INSTRUCTORES');
    expect(usuario.save).toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'ACTUALIZAR_PLANTILLA_PREDETERMINADA' })
    );
  });
});

describe('plantillaController.listarDependenciasConResponsables', () => {
  test('mapea las dependencias con su responsable principal y la lista de responsables', async () => {
    const dependencias = [
      {
        _id: 'dep-1',
        nombre_dependencia: 'TIC',
        activo: true,
        responsable_id: { _id: ID_RESPONSABLE, nombre_completo: 'Franklin', correo_institucional: 'tic@x.co', rol: 'ResponsableArea' },
        responsables_ids: [
          { _id: ID_RESPONSABLE, nombre_completo: 'Franklin', correo_institucional: 'tic@x.co', rol: 'ResponsableArea' },
          { _id: 'otro', nombre_completo: 'Martha', correo_institucional: 'alm@x.co', rol: 'ResponsableArea' },
        ],
      },
    ];
    const cadena = { populate: jest.fn(() => cadena), sort: jest.fn(() => Promise.resolve(dependencias)) };
    DependenciaArea.find.mockReturnValue(cadena);

    const { res } = await ejecutar(controlador.listarDependenciasConResponsables, reqDe());

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo[0].responsable.nombre).toBe('Franklin');
    expect(res.cuerpo[0].responsables).toHaveLength(2);
  });
});
