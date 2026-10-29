// Pruebas unitarias de middlewares/authMiddleware.js y de los casos de borde
// pendientes en los controladores modificados.
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

jest.mock('../src/models/Usuario');
jest.mock('../src/models/DependenciaArea');
jest.mock('../src/models/Contrato');
jest.mock('../src/models/TrazabilidadFirma');
jest.mock('../src/services/auditoriaService', () => ({ registrar: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/utils/password', () => ({ hashPassword: jest.fn().mockResolvedValue('hash_fake') }));
jest.mock('../src/services/plantillaService', () => {
  const { TEMPLATAS } = require('../src/constants/plantillas');
  return {
    TEMPLATAS,
    construirFilas: jest.fn(() => []),
    obtenerDependenciasConResponsables: jest.fn(async () => []),
    obtenerPlantillaContrato: jest.fn(async () => ({
      tipo: 'COMPLETA',
      filas: [{ id_fila: 1, aplica: true, dependencia_id: 'dep-1', responsables: [] }],
    })),
  };
});

const jwt = require('jsonwebtoken');
const Usuario = require('../src/models/Usuario');
const DependenciaArea = require('../src/models/DependenciaArea');
const Contrato = require('../src/models/Contrato');
const TrazabilidadFirma = require('../src/models/TrazabilidadFirma');
const { verificarToken, verificarRol, verificarJerarquia } = require('../src/middlewares/authMiddleware');
const usuarioController = require('../src/controllers/usuarioController');
const plantillaController = require('../src/controllers/plantillaController');
const firmasController = require('../src/controllers/firmasController');
const supervisionController = require('../src/controllers/supervisionController');
const { ejecutar, ejecutarEsperandoError, crearRes, usuarioSimulado } = require('./helpers/mocks');

const ID_USUARIO = '507f1f77bcf86cd799439011';
const ID_CONTRATO = '507f1f77bcf86cd799439033';
const ID_AREA = '507f1f77bcf86cd799439022';

beforeEach(() => {
  jest.clearAllMocks();
  DependenciaArea.find.mockReturnValue({
    select: jest.fn().mockResolvedValue([]),
  });
});

describe('authMiddleware.verificarToken', () => {
  test('rechaza la petición sin cabecera de autorización', async () => {
    const res = crearRes();
    const next = jest.fn();

    verificarToken({ headers: {}, header: () => undefined }, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.cuerpo.mensaje).toMatch(/No se proporcionó un token/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('rechaza un token inválido', async () => {
    const res = crearRes();
    const next = jest.fn();

    verificarToken({ headers: { authorization: 'Bearer token.invalido' }, header: () => undefined }, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.cuerpo.mensaje).toMatch(/Token no válido/i);
  });

  test('rechaza un token con algoritmo manipulado', async () => {
    const token = jwt.sign({ id: ID_USUARIO }, 'otro-secreto', { algorithm: 'HS256' });
    const res = crearRes();

    verificarToken({ headers: { authorization: `Bearer ${token}` }, header: () => undefined }, res, jest.fn());

    expect(res.statusCode).toBe(401);
  });

  test('expulsa de inmediato a un usuario deshabilitado', async () => {
    const token = jwt.sign({ id: ID_USUARIO }, process.env.JWT_SECRET, { algorithm: 'HS256' });
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: ID_USUARIO, activo: false }));
    const res = crearRes();

    verificarToken({ headers: { authorization: `Bearer ${token}` }, header: () => undefined }, res, jest.fn());
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.statusCode).toBe(401);
    expect(res.cuerpo.mensaje).toMatch(/deshabilitado/i);
  });

  test('invalida los tokens emitidos antes del último cambio de contraseña', async () => {
    // Token emitido en el pasado (iat antiguo) y cambio de contraseña posterior
    const token = jwt.sign({ id: ID_USUARIO, iat: 1000 }, process.env.JWT_SECRET, { algorithm: 'HS256' });
    Usuario.findById.mockResolvedValue(
      usuarioSimulado({ _id: ID_USUARIO, password_changed_at: new Date(Date.now() - 1000) })
    );
    const res = crearRes();

    verificarToken({ headers: { authorization: `Bearer ${token}` }, header: () => undefined }, res, jest.fn());
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.statusCode).toBe(401);
    expect(res.cuerpo.mensaje).toMatch(/contraseña fue modificada/i);
  });

  test('carga el usuario de la base de datos y deja avanzar la petición', async () => {
    const token = jwt.sign({ id: ID_USUARIO }, process.env.JWT_SECRET, { algorithm: 'HS256' });
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor' }));
    const res = crearRes();
    const next = jest.fn();
    const req = { headers: { authorization: `Bearer ${token}` }, header: () => undefined };

    verificarToken(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalled();
    expect(req.usuario.rol).toBe('Supervisor');
  });
});

describe('authMiddleware.verificarRol', () => {
  test('rechaza cuando no hay usuario autenticado', () => {
    const res = crearRes();
    verificarRol('Administrador')({ usuario: null }, res, jest.fn());
    expect(res.statusCode).toBe(401);
  });

  test('rechaza cuando el rol no está permitido', () => {
    const res = crearRes();
    verificarRol('Administrador')({ usuario: { rol: 'Contratista' } }, res, jest.fn());
    expect(res.statusCode).toBe(403);
  });

  test('deja pasar cuando el rol está permitido', () => {
    const res = crearRes();
    const next = jest.fn();
    verificarRol('Administrador', 'Supervisor')({ usuario: { rol: 'Supervisor' } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();
  });
});

describe('authMiddleware.verificarJerarquia', () => {
  test('exige indicar el rol del usuario a crear', () => {
    const res = crearRes();
    verificarJerarquia({ usuario: { rol: 'Administrador' }, body: {} }, res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  test('impide crear roles fuera de la jerarquía', () => {
    const res = crearRes();
    verificarJerarquia({ usuario: { rol: 'Administrador' }, body: { rol: 'Contratista' } }, res, jest.fn());
    expect(res.statusCode).toBe(403);
  });

  test('permite crear un Supervisor al Administrador', () => {
    const res = crearRes();
    const next = jest.fn();
    verificarJerarquia({ usuario: { rol: 'Administrador' }, body: { rol: 'Supervisor' } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();
  });
});

describe('casos de borde de usuarioController', () => {
  test('crearUsuario no duplica al responsable si ya estaba en la dependencia', async () => {
    Usuario.findOne.mockResolvedValue(null);
    const usuarioNuevo = {
      _id: ID_USUARIO,
      nombre_completo: 'Nuevo',
      correo_institucional: 'nuevo@x.co',
      rol: 'ResponsableArea',
      save: jest.fn().mockResolvedValue(undefined),
    };
    Usuario.mockImplementation(() => usuarioNuevo);
    // La dependencia ya tiene responsables: se conserva la lista
    DependenciaArea.findById.mockResolvedValue({
      _id: ID_AREA,
      responsables_ids: ['otro-1', 'otro-2'],
      responsable_id: 'otro-1',
      save: jest.fn().mockResolvedValue(undefined),
    });

    const { res } = await ejecutar(
      usuarioController.crearUsuario,
      {
        usuario: { id: 'admin-1', rol: 'Administrador' },
        body: {
          nombre_completo: 'Nuevo',
          correo_institucional: 'nuevo@x.co',
          password: 'ClaveSegura123!',
          rol: 'ResponsableArea',
          dependencia_id: ID_AREA,
        },
        params: {},
        query: {},
      }
    );

    expect(res.statusCode).toBe(201);
  });

  test('actualizarUsuario no duplica al responsable si ya estaba en la dependencia', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: ID_USUARIO, rol: 'ResponsableArea' }));
    DependenciaArea.findById.mockResolvedValue({
      _id: ID_AREA,
      responsables_ids: ['otro-1'],
      responsable_id: 'otro-1',
      save: jest.fn().mockResolvedValue(undefined),
    });

    const { res } = await ejecutar(
      usuarioController.actualizarUsuario,
      {
        usuario: { id: 'admin-1', rol: 'Administrador' },
        body: { dependencia_id: ID_AREA },
        params: { id: ID_USUARIO },
        query: {},
      }
    );

    expect(res.statusCode).toBe(200);
  });

  test('eliminarUsuario devuelve 404 si el usuario no existe', async () => {
    Usuario.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      usuarioController.eliminarUsuario,
      { usuario: { id: 'admin-1', rol: 'Administrador' }, body: {}, params: { id: 'x' }, query: {} }
    );

    expect(error.statusCode).toBe(404);
  });

  test('actualizarUsuario permite un cambio de rol dentro de la jerarquía', async () => {
    const usuario = usuarioSimulado({ _id: 'contratista-1', rol: 'Contratista', supervisor_id: 'sup-1' });
    Usuario.findById.mockResolvedValue(usuario);

    const { res } = await ejecutar(
      usuarioController.actualizarUsuario,
      {
        usuario: { id: 'sup-1', rol: 'Supervisor' },
        body: { rol: 'ResponsableArea' },
        params: { id: 'contratista-1' },
        query: {},
      }
    );

    expect(res.statusCode).toBe(200);
    expect(usuario.rol).toBe('ResponsableArea');
  });

  test('actualizarUsuario devuelve 404 si la dependencia asignada no existe', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: 'otro', rol: 'ResponsableArea' }));
    DependenciaArea.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      usuarioController.actualizarUsuario,
      {
        usuario: { id: 'admin-1', rol: 'Administrador' },
        body: { dependencia_id: ID_AREA },
        params: { id: 'otro' },
        query: {},
      }
    );

    expect(error.statusCode).toBe(404);
  });
});

describe('casos de borde de plantillaController', () => {
  test('actualizarPlantilla enlaza la dependencia existente con la fila', async () => {
    const contrato = { _id: ID_CONTRATO, supervisor: ID_USUARIO, save: jest.fn().mockResolvedValue(undefined) };
    Contrato.findById.mockResolvedValue(contrato);
    const plantillaService = require('../src/services/plantillaService');
    plantillaService.obtenerDependenciasConResponsables.mockResolvedValue([
      { _id: 'dep-1', nombre_dependencia: 'Gestión Tecnológica (TIC)', activo: true, responsables_ids: [] },
    ]);

    const { res } = await ejecutar(
      plantillaController.actualizarPlantilla,
      {
        usuario: { id: ID_USUARIO, rol: 'Supervisor' },
        body: { filas: [{ id_fila: 1, dependencia_id: 'dep-1', aplica: true }] },
        params: { id: ID_CONTRATO },
        query: {},
      }
    );

    expect(res.statusCode).toBe(200);
    expect(contrato.plantilla_firmantes[0].dependencia_id).toBe('dep-1');
    expect(contrato.plantilla_firmantes[0].dependencia_nombre).toBe('Gestión Tecnológica (TIC)');
  });

  test('actualizarPlantilla ignora una dependencia que no existe en la base', async () => {
    const contrato = { _id: ID_CONTRATO, supervisor: ID_USUARIO, save: jest.fn().mockResolvedValue(undefined) };
    Contrato.findById.mockResolvedValue(contrato);

    const { res } = await ejecutar(
      plantillaController.actualizarPlantilla,
      {
        usuario: { id: ID_USUARIO, rol: 'Supervisor' },
        body: { filas: [{ id_fila: 1, dependencia_id: 'no-existe-en-base', aplica: true }] },
        params: { id: ID_CONTRATO },
        query: {},
      }
    );

    expect(res.statusCode).toBe(200);
    expect(contrato.plantilla_firmantes[0].dependencia_id).toBeNull();
  });
});

describe('casos de borde de firmasController', () => {
  test('procesarFirma avisa cuando el casillero tiene autorizados sin nombres', async () => {

    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, estado: 'Pendiente de Firmas' });
    TrazabilidadFirma.findOne.mockResolvedValue({
      _id: 't1',
      area_id: ID_AREA,
      estado: 'Pendiente',
      firmantes_autorizados: ['otro-1'],
    });
    Usuario.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });
    DependenciaArea.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: ID_AREA }]),
    });

    const error = await ejecutarEsperandoError(
      firmasController.procesarFirma,
      {
        usuario: { id: ID_USUARIO, rol: 'ResponsableArea', dependencia_id: ID_AREA },
        body: { contratoId: ID_CONTRATO, accion: 'Aprobar' },
        params: {},
        query: {},
      }
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/firmantes autorizados/i);
  });

  test('listarHistorial avisa cuando el responsable no tiene dependencias', async () => {
    DependenciaArea.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

    const error = await ejecutarEsperandoError(
      firmasController.listarHistorial,
      { usuario: { id: 'sin-dep', rol: 'ResponsableArea', dependencia_id: null }, body: {}, params: {}, query: {} }
    );

    expect(error.statusCode).toBe(403);
  });
});

describe('casos de borde de supervisionController', () => {
  test('rechaza evaluar un contrato sin supervisor cuando no es Administrador', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, estado: 'Borrador', supervisor: null });
    DependenciaArea.find.mockResolvedValue([]);

    const error = await ejecutarEsperandoError(
      supervisionController.evaluarContrato,
      { usuario: { id: 'sup-1', rol: 'Supervisor' }, body: { aprobado: true }, params: { id: ID_CONTRATO }, query: {} }
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/no tiene un supervisor asignado/i);
  });

  test('revierte el contrato aunque la restauración también falle', async () => {
    const Contrato = require('../src/models/Contrato');
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, estado: 'Borrador', supervisor: 'sup-1' });
    Contrato.findOneAndUpdate.mockResolvedValue({ _id: ID_CONTRATO, estado: 'Pendiente de Firmas' });
    Contrato.updateOne.mockRejectedValue(new Error('base de datos no disponible'));
    DependenciaArea.find.mockResolvedValue([
      { _id: 'dep-1', nombre_dependencia: 'TIC', activo: true, responsable_id: 'r1', responsables_ids: ['r1'] },
    ]);
    TrazabilidadFirma.insertMany.mockRejectedValue(new Error('fallo al abrir casilleros'));

    const error = await ejecutarEsperandoError(
      supervisionController.evaluarContrato,
      { usuario: { id: 'sup-1', rol: 'Supervisor' }, body: { aprobado: true }, params: { id: ID_CONTRATO }, query: {} }
    );

    expect(error).toBeDefined();
  });

  test('avisa cuando el contrato cambió de estado durante la evaluación', async () => {
    Contrato.findById.mockResolvedValue({ _id: ID_CONTRATO, estado: 'Borrador', supervisor: 'sup-1' });
    Contrato.findOneAndUpdate.mockResolvedValue(null);
    DependenciaArea.find.mockResolvedValue([
      { _id: 'dep-1', nombre_dependencia: 'TIC', activo: true, responsable_id: 'r1', responsables_ids: ['r1'] },
    ]);

    const error = await ejecutarEsperandoError(
      supervisionController.evaluarContrato,
      { usuario: { id: 'sup-1', rol: 'Supervisor' }, body: { aprobado: true }, params: { id: ID_CONTRATO }, query: {} }
    );

    expect(error.statusCode).toBe(409);
    expect(error.message).toMatch(/cambió de estado/i);
  });
});
