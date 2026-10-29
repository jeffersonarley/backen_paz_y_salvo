// Pruebas unitarias de controllers/usuarioController.js
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

jest.mock('../src/models/Usuario');
jest.mock('../src/models/DependenciaArea');
jest.mock('../src/services/auditoriaService', () => ({ registrar: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hash_fake'),
}));

const Usuario = require('../src/models/Usuario');
const DependenciaArea = require('../src/models/DependenciaArea');
const { registrar } = require('../src/services/auditoriaService');
const { hashPassword } = require('../src/utils/password');
const controlador = require('../src/controllers/usuarioController');
const { ejecutar, ejecutarEsperandoError, usuarioSimulado, dependenciaSimulada } = require('./helpers/mocks');

const ID_USUARIO = '507f1f77bcf86cd799439011';
const ID_APOYO = '507f1f77bcf86cd799439022';
const ID_DEPENDENCIA = '507f1f77bcf86cd799439033';

const reqDe = (usuario = { id: 'admin-1', rol: 'Administrador' }, body = {}, params = {}, query = {}) => ({
  usuario,
  body,
  params,
  query,
});

beforeEach(() => {
  jest.clearAllMocks();
  hashPassword.mockResolvedValue('hash_fake');
});

describe('usuarioController.crearUsuario', () => {
  test('exige los campos obligatorios', async () => {
    const error = await ejecutarEsperandoError(controlador.crearUsuario, reqDe(undefined, {}));
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/Faltan campos obligatorios/i);
  });

  test('rechaza contraseñas que no cumplen la política', async () => {
    const error = await ejecutarEsperandoError(
      controlador.crearUsuario,
      reqDe(undefined, { nombre_completo: 'X', correo_institucional: 'x@x.co', password: 'corta', rol: 'Contratista' })
    );
    expect(error.statusCode).toBe(400);
  });

  test('rechaza un correo ya registrado', async () => {
    Usuario.findOne.mockResolvedValue({ _id: 'existente' });

    const error = await ejecutarEsperandoError(
      controlador.crearUsuario,
      reqDe(undefined, { nombre_completo: 'X', correo_institucional: 'x@x.co', password: 'ClaveSegura123!', rol: 'Contratista' })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/correo institucional ya está registrado/i);
  });

  test('rechaza un apoyo de supervisión con id inválido', async () => {
    Usuario.findOne.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.crearUsuario,
      reqDe(undefined, {
        nombre_completo: 'X',
        correo_institucional: 'x@x.co',
        password: 'ClaveSegura123!',
        rol: 'Supervisor',
        apoyo_supervision_id: 'no-valido',
      })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/apoyo de supervisión indicado no es válido/i);
  });

  test('el Supervisor queda como creador (supervisor_id) del usuario', async () => {
    Usuario.findOne.mockResolvedValue(null);
    const save = jest.fn().mockResolvedValue(undefined);
    Usuario.mockImplementation(() => ({
      _id: ID_USUARIO,
      nombre_completo: 'Nuevo',
      correo_institucional: 'nuevo@x.co',
      rol: 'Contratista',
      save,
    }));

    const { res } = await ejecutar(
      controlador.crearUsuario,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, {
        nombre_completo: 'Nuevo',
        correo_institucional: 'nuevo@x.co',
        password: 'ClaveSegura123!',
        rol: 'Contratista',
      })
    );

    expect(res.statusCode).toBe(201);
    expect(save).toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'CREAR_USUARIO' }));
  });

  test('al asignar una dependencia, el usuario queda entre sus responsables', async () => {
    Usuario.findOne.mockResolvedValue(null);
    const usuarioNuevo = {
      _id: ID_USUARIO,
      nombre_completo: 'Nuevo',
      correo_institucional: 'nuevo@x.co',
      rol: 'ResponsableArea',
      save: jest.fn().mockResolvedValue(undefined),
    };
    Usuario.mockImplementation(() => usuarioNuevo);
    const dependencia = dependenciaSimulada({ _id: ID_DEPENDENCIA, responsables_ids: [] });
    DependenciaArea.findById.mockResolvedValue(dependencia);

    const { res } = await ejecutar(
      controlador.crearUsuario,
      reqDe(undefined, {
        nombre_completo: 'Nuevo',
        correo_institucional: 'nuevo@x.co',
        password: 'ClaveSegura123!',
        rol: 'ResponsableArea',
        dependencia_id: ID_DEPENDENCIA,
      })
    );

    expect(res.statusCode).toBe(201);
    expect(dependencia.responsables_ids).toEqual([ID_USUARIO]);
    expect(dependencia.responsable_id).toBe(ID_USUARIO);
    expect(dependencia.save).toHaveBeenCalled();
  });

  test('devuelve 404 si la dependencia asignada no existe', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.mockImplementation(() => ({
      _id: ID_USUARIO,
      nombre_completo: 'Nuevo',
      correo_institucional: 'nuevo@x.co',
      rol: 'ResponsableArea',
      save: jest.fn().mockResolvedValue(undefined),
    }));
    DependenciaArea.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.crearUsuario,
      reqDe(undefined, {
        nombre_completo: 'Nuevo',
        correo_institucional: 'nuevo@x.co',
        password: 'ClaveSegura123!',
        rol: 'ResponsableArea',
        dependencia_id: ID_DEPENDENCIA,
      })
    );

    expect(error.statusCode).toBe(404);
  });
});

describe('usuarioController.obtenerUsuarios', () => {
  test('el Administrador obtiene todos los usuarios', async () => {
    Usuario.find.mockReturnValue({ populate: jest.fn().mockReturnThis() });

    await ejecutar(controlador.obtenerUsuarios, reqDe());

    expect(Usuario.find).toHaveBeenCalledWith(
      {},
      '-password_hash -token_recuperacion -token_expiracion'
    );
  });

  test('el Supervisor solo ve sus contratistas cuando filtra por ese rol', async () => {
    Usuario.find.mockReturnValue({ populate: jest.fn().mockReturnThis() });

    await ejecutar(controlador.obtenerUsuarios, reqDe({ id: 'sup-1', rol: 'Supervisor' }, {}, {}, { rol: 'Contratista' }));

    expect(Usuario.find).toHaveBeenCalledWith(
      { rol: 'Contratista', supervisor_id: 'sup-1' },
      '-password_hash -token_recuperacion -token_expiracion'
    );
  });

  test('el Supervisor ve el personal de la institución (Supervisores y Responsables)', async () => {
    Usuario.find.mockReturnValue({ populate: jest.fn().mockReturnThis() });

    await ejecutar(controlador.obtenerUsuarios, reqDe({ id: 'sup-1', rol: 'Supervisor' }, {}, {}, { rol: 'ResponsableArea' }));

    expect(Usuario.find).toHaveBeenCalledWith(
      { rol: 'ResponsableArea' },
      '-password_hash -token_recuperacion -token_expiracion'
    );
  });

  test('sin filtro de rol, el Supervisor ve al personal y a sus propios contratistas', async () => {
    Usuario.find.mockReturnValue({ populate: jest.fn().mockReturnThis() });

    await ejecutar(controlador.obtenerUsuarios, reqDe({ id: 'sup-1', rol: 'Supervisor' }));

    expect(Usuario.find).toHaveBeenCalledWith(
      {
        $or: [
          { rol: { $in: ['Supervisor', 'ResponsableArea'] } },
          { supervisor_id: 'sup-1' },
        ],
      },
      '-password_hash -token_recuperacion -token_expiracion'
    );
  });

  test('normaliza el rol recibido en la consulta', async () => {
    Usuario.find.mockReturnValue({ populate: jest.fn().mockReturnThis() });

    await ejecutar(controlador.obtenerUsuarios, reqDe({ id: 'admin-1', rol: 'Administrador' }, {}, {}, { rol: 'responsable-area' }));

    expect(Usuario.find.mock.calls[0][0].rol).toBe('ResponsableArea');
  });
});

describe('usuarioController.obtenerUsuario', () => {
  test('devuelve 404 si el usuario no existe', async () => {
    Usuario.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(controlador.obtenerUsuario, reqDe(undefined, {}, { id: ID_USUARIO }));

    expect(error.statusCode).toBe(404);
  });

  test('un usuario puede ver su propio perfil', async () => {
    const usuario = usuarioSimulado({ _id: ID_USUARIO });
    Usuario.findById.mockResolvedValue(usuario);

    const { res } = await ejecutar(
      controlador.obtenerUsuario,
      reqDe({ id: ID_USUARIO, rol: 'ResponsableArea' }, {}, { id: ID_USUARIO })
    );

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo).toBe(usuario);
  });

  test('un rol sin permisos no puede ver el perfil de otro', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: 'otro' }));

    const error = await ejecutarEsperandoError(
      controlador.obtenerUsuario,
      reqDe({ id: ID_USUARIO, rol: 'ResponsableArea' }, {}, { id: 'otro' })
    );

    expect(error.statusCode).toBe(403);
  });

  test('el Supervisor no puede ver un contratista de otra jerarquía', async () => {
    Usuario.findById.mockResolvedValue(
      usuarioSimulado({ _id: 'otro', rol: 'Contratista', supervisor_id: 'sup-2' })
    );

    const error = await ejecutarEsperandoError(
      controlador.obtenerUsuario,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, {}, { id: 'otro' })
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/no te pertenece/i);
  });

  test('el Supervisor sí puede ver el perfil de un responsable de área', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: 'resp-1', rol: 'ResponsableArea' }));

    const { res } = await ejecutar(
      controlador.obtenerUsuario,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, {}, { id: 'resp-1' })
    );

    expect(res.statusCode).toBe(200);
  });
});

describe('usuarioController.eliminarUsuario', () => {
  test('no permite eliminar la propia cuenta', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: ID_USUARIO }));

    const error = await ejecutarEsperandoError(
      controlador.eliminarUsuario,
      reqDe({ id: ID_USUARIO, rol: 'Administrador' }, {}, { id: ID_USUARIO })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/su propia cuenta/i);
  });

  test('elimina el usuario y lo audita', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: 'otro' }));
    Usuario.findByIdAndDelete.mockResolvedValue({ acknowledged: true });

    const { res } = await ejecutar(
      controlador.eliminarUsuario,
      reqDe({ id: 'admin-1', rol: 'Administrador' }, {}, { id: 'otro' })
    );

    expect(res.statusCode).toBe(200);
    expect(Usuario.findByIdAndDelete).toHaveBeenCalledWith('otro');
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ELIMINAR_USUARIO' }));
  });
});

describe('usuarioController.actualizarUsuario', () => {
  test('devuelve 404 si el usuario no existe', async () => {
    Usuario.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.actualizarUsuario,
      reqDe(undefined, {}, { id: ID_USUARIO })
    );

    expect(error.statusCode).toBe(404);
  });

  test('el Supervisor no puede editar usuarios de otra jerarquía', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: 'otro', supervisor_id: 'sup-2' }));

    const error = await ejecutarEsperandoError(
      controlador.actualizarUsuario,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, { nombre_completo: 'X' }, { id: 'otro' })
    );

    expect(error.statusCode).toBe(403);
  });

  test('el Supervisor sí puede editar su propio perfil', async () => {
    const usuario = usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor' });
    Usuario.findById.mockResolvedValue(usuario);
    // Ya tiene dependencia propia: no se crea ninguna adicional
    usuario.dependencia_id = ID_DEPENDENCIA;

    const { res } = await ejecutar(
      controlador.actualizarUsuario,
      reqDe({ id: ID_USUARIO, rol: 'Supervisor' }, { plantilla_predeterminada: 'INSTRUCTORES' }, { id: ID_USUARIO })
    );

    expect(res.statusCode).toBe(200);
    expect(usuario.plantilla_predeterminada).toBe('INSTRUCTORES');
    expect(usuario.save).toHaveBeenCalled();
  });

  test('no permite cambiar el propio rol', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor' }));

    const error = await ejecutarEsperandoError(
      controlador.actualizarUsuario,
      reqDe({ id: ID_USUARIO, rol: 'Supervisor' }, { rol: 'Contratista' }, { id: ID_USUARIO })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/tu propio rol/i);
  });

  test('no permite asignar un rol fuera de la jerarquía', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: 'otro', rol: 'Contratista', supervisor_id: 'sup-1' }));

    const error = await ejecutarEsperandoError(
      controlador.actualizarUsuario,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, { rol: 'Administrador' }, { id: 'otro' })
    );

    expect(error.statusCode).toBe(403);
    expect(error.message).toMatch(/no puede asignar el rol/i);
  });

  test('asigna la dependencia y agrega al usuario entre los responsables', async () => {
    const usuario = usuarioSimulado({ _id: ID_USUARIO, rol: 'ResponsableArea' });
    Usuario.findById.mockResolvedValue(usuario);
    const dependencia = dependenciaSimulada({ _id: ID_DEPENDENCIA, responsables_ids: [] });
    DependenciaArea.findById.mockResolvedValue(dependencia);

    const { res } = await ejecutar(
      controlador.actualizarUsuario,
      reqDe({ id: 'admin-1', rol: 'Administrador' }, { dependencia_id: ID_DEPENDENCIA }, { id: ID_USUARIO })
    );

    expect(res.statusCode).toBe(200);
    expect(usuario.dependencia_id).toBe(ID_DEPENDENCIA);
    expect(dependencia.responsables_ids).toEqual([ID_USUARIO]);
  });

  test('rechaza un apoyo de supervisión inválido o inexistente', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: ID_USUARIO }));

    const errorId = await ejecutarEsperandoError(
      controlador.actualizarUsuario,
      reqDe(undefined, { apoyo_supervision_id: 'no-valido' }, { id: ID_USUARIO })
    );
    expect(errorId.statusCode).toBe(400);

    const errorMismo = await ejecutarEsperandoError(
      controlador.actualizarUsuario,
      reqDe(undefined, { apoyo_supervision_id: ID_USUARIO }, { id: ID_USUARIO })
    );
    expect(errorMismo.statusCode).toBe(400);
    expect(errorMismo.message).toMatch(/mismo coordinador/i);

    Usuario.findById.mockResolvedValueOnce(usuarioSimulado({ _id: ID_USUARIO })).mockResolvedValueOnce(null);
    const errorNoExiste = await ejecutarEsperandoError(
      controlador.actualizarUsuario,
      reqDe(undefined, { apoyo_supervision_id: ID_APOYO }, { id: ID_USUARIO })
    );
    expect(errorNoExiste.statusCode).toBe(404);
    expect(errorNoExiste.message).toMatch(/no existe/i);
  });

  test('asigna el apoyo de supervisión y la plantilla predeterminada', async () => {
    const usuario = usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor', dependencia_id: ID_DEPENDENCIA });
    Usuario.findById
      .mockResolvedValueOnce(usuario)
      .mockResolvedValueOnce(usuarioSimulado({ _id: ID_APOYO, nombre_completo: 'Nelson' }));

    const { res } = await ejecutar(
      controlador.actualizarUsuario,
      reqDe(
        { id: 'admin-1', rol: 'Administrador' },
        { apoyo_supervision_id: ID_APOYO, plantilla_predeterminada: 'SERVICIOS_PROFESIONALES' },
        { id: ID_USUARIO }
      )
    );

    expect(res.statusCode).toBe(200);
    expect(usuario.apoyo_supervision_id).toBe(ID_APOYO);
    expect(usuario.plantilla_predeterminada).toBe('SERVICIOS_PROFESIONALES');
  });
});

describe('usuarioController - dependencia propia del Supervisor', () => {
  test('asigna automáticamente una dependencia propia si el Supervisor no tiene ninguna', async () => {
    const usuario = usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor', dependencia_id: null });
    Usuario.findById.mockResolvedValue(usuario);
    const dependencia = dependenciaSimulada({ _id: ID_DEPENDENCIA, responsables_ids: [] });
    DependenciaArea.findOne.mockResolvedValue(null);
    DependenciaArea.create.mockResolvedValue(dependencia);

    const { res } = await ejecutar(
      controlador.actualizarUsuario,
      reqDe({ id: 'admin-1', rol: 'Administrador' }, { cargo: 'Coordinador' }, { id: ID_USUARIO })
    );

    expect(res.statusCode).toBe(200);
    expect(DependenciaArea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_dependencia: 'Usuario Prueba - Supervisión',
        responsable_id: ID_USUARIO,
        responsables_ids: [ID_USUARIO],
      })
    );
    expect(usuario.dependencia_id).toBe(ID_DEPENDENCIA);
  });

  test('reutiliza la dependencia de supervisión existente si ya hay una', async () => {
    const usuario = usuarioSimulado({ _id: ID_USUARIO, rol: 'Supervisor', dependencia_id: null });
    Usuario.findById.mockResolvedValue(usuario);
    const dependencia = dependenciaSimulada({
      _id: ID_DEPENDENCIA,
      nombre_dependencia: 'Usuario Prueba - Supervisión',
      responsables_ids: [],
    });
    DependenciaArea.findOne.mockResolvedValue(dependencia);
    DependenciaArea.create.mockResolvedValue(null);

    await ejecutar(
      controlador.actualizarUsuario,
      reqDe({ id: 'admin-1', rol: 'Administrador' }, { cargo: 'Coordinador' }, { id: ID_USUARIO })
    );

    expect(DependenciaArea.create).not.toHaveBeenCalled();
    expect(dependencia.responsables_ids.map(String)).toContain(ID_USUARIO);
    expect(usuario.dependencia_id).toBe(ID_DEPENDENCIA);
  });
});

describe('usuarioController.cambiarEstadoUsuario', () => {
  test('exige el campo activo', async () => {
    const error = await ejecutarEsperandoError(
      controlador.cambiarEstadoUsuario,
      reqDe(undefined, {}, { id: ID_USUARIO })
    );
    expect(error.statusCode).toBe(400);
  });

  test('devuelve 404 si el usuario no existe', async () => {
    Usuario.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.cambiarEstadoUsuario,
      reqDe(undefined, { activo: false }, { id: ID_USUARIO })
    );
    expect(error.statusCode).toBe(404);
  });

  test('no permite deshabilitar la propia cuenta', async () => {
    Usuario.findById.mockResolvedValue(usuarioSimulado({ _id: ID_USUARIO }));

    const error = await ejecutarEsperandoError(
      controlador.cambiarEstadoUsuario,
      reqDe({ id: ID_USUARIO, rol: 'Administrador' }, { activo: false }, { id: ID_USUARIO })
    );
    expect(error.statusCode).toBe(400);
  });

  test('deshabilita y habilita la cuenta de otro usuario', async () => {
    const usuario = usuarioSimulado({ _id: 'otro', correo_institucional: 'otro@x.co' });
    Usuario.findById.mockResolvedValue(usuario);

    const { res } = await ejecutar(
      controlador.cambiarEstadoUsuario,
      reqDe({ id: 'admin-1', rol: 'Administrador' }, { activo: false }, { id: 'otro' })
    );

    expect(res.statusCode).toBe(200);
    expect(usuario.activo).toBe(false);
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'DESACTIVAR_USUARIO' }));
  });
});
