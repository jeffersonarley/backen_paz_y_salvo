// Pruebas unitarias de controllers/dependenciaController.js
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

jest.mock('../src/models/DependenciaArea');
jest.mock('../src/models/Usuario');
jest.mock('../src/services/auditoriaService', () => ({ registrar: jest.fn().mockResolvedValue(undefined) }));

const mongoose = require('mongoose');
const DependenciaArea = require('../src/models/DependenciaArea');
const Usuario = require('../src/models/Usuario');
const { registrar } = require('../src/services/auditoriaService');
const controlador = require('../src/controllers/dependenciaController');
const { ejecutar, ejecutarEsperandoError, usuarioSimulado, dependenciaSimulada } = require('./helpers/mocks');

const ID_VALIDO = '507f1f77bcf86cd799439011';
const OTRO_ID_VALIDO = '507f1f77bcf86cd799439022';

const reqDe = (usuario = { id: 'sup-1', rol: 'Supervisor' }, body = {}, params = {}) => ({
  usuario,
  body,
  params,
  query: {},
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dependenciaController.crearDependencia', () => {
  test('exige el nombre de la dependencia', async () => {
    const error = await ejecutarEsperandoError(controlador.crearDependencia, reqDe(undefined, {}));
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/nombre de la dependencia es obligatorio/i);
  });

  test('no permite duplicar el nombre de una dependencia', async () => {
    DependenciaArea.findOne.mockResolvedValue({ _id: 'dep-existente' });

    const error = await ejecutarEsperandoError(
      controlador.crearDependencia,
      reqDe(undefined, { nombre_dependencia: 'TIC' })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/ya se encuentra creada/i);
  });

  test('rechaza a un contratista como responsable', async () => {
    DependenciaArea.findOne.mockResolvedValue(null);
    Usuario.find.mockResolvedValue([usuarioSimulado({ _id: ID_VALIDO, rol: 'Contratista' })]);

    const error = await ejecutarEsperandoError(
      controlador.crearDependencia,
      reqDe(undefined, { nombre_dependencia: 'Nueva', responsable_ids: [ID_VALIDO] })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/no puede ser responsable/i);
  });

  test('informa cuando un responsable no existe', async () => {
    DependenciaArea.findOne.mockResolvedValue(null);
    Usuario.find.mockResolvedValue([]);

    const error = await ejecutarEsperandoError(
      controlador.crearDependencia,
      reqDe(undefined, { nombre_dependencia: 'Nueva', responsable_ids: [ID_VALIDO] })
    );

    expect(error.statusCode).toBe(404);
    expect(error.message).toMatch(/no existen/i);
  });

  test('crea la dependencia con varios responsables y los vincula', async () => {
    DependenciaArea.findOne.mockResolvedValue(null);
    Usuario.find.mockResolvedValue([
      usuarioSimulado({ _id: ID_VALIDO, rol: 'ResponsableArea' }),
      usuarioSimulado({ _id: OTRO_ID_VALIDO, rol: 'Supervisor' }),
    ]);
    DependenciaArea.create.mockResolvedValue(dependenciaSimulada({ _id: 'dep-nueva', nombre_dependencia: 'Nueva' }));
    DependenciaArea.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
    });
    Usuario.updateOne.mockResolvedValue({ acknowledged: true });

    const { res, next } = await ejecutar(
      controlador.crearDependencia,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, { nombre_dependencia: '  Nueva  ', responsable_ids: [ID_VALIDO, OTRO_ID_VALIDO] })
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(DependenciaArea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_dependencia: 'Nueva',
        activo: true,
        responsable_id: ID_VALIDO,
        responsables_ids: [ID_VALIDO, OTRO_ID_VALIDO],
      })
    );
    expect(Usuario.updateOne).toHaveBeenCalledWith(
      { _id: ID_VALIDO },
      { $set: { dependencia_id: 'dep-nueva' } }
    );
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'CREAR_DEPENDENCIA', usuario_id: 'sup-1' })
    );
  });

  test('acepta el responsable principal en el campo responsable_id', async () => {
    DependenciaArea.findOne.mockResolvedValue(null);
    Usuario.find.mockResolvedValue([usuarioSimulado({ _id: ID_VALIDO, rol: 'ResponsableArea' })]);
    DependenciaArea.create.mockResolvedValue(dependenciaSimulada());
    DependenciaArea.findById.mockReturnValue({ populate: jest.fn().mockReturnThis() });
    Usuario.updateOne.mockResolvedValue({ acknowledged: true });

    const { res } = await ejecutar(
      controlador.crearDependencia,
      reqDe(undefined, { nombre_dependencia: 'Otra', responsable_id: ID_VALIDO })
    );

    expect(res.statusCode).toBe(201);
    expect(DependenciaArea.create).toHaveBeenCalledWith(
      expect.objectContaining({ responsables_ids: [ID_VALIDO] })
    );
  });

  test('descarta los identificadores que no son ObjectId', async () => {
    DependenciaArea.findOne.mockResolvedValue(null);
    Usuario.find.mockResolvedValue([usuarioSimulado({ _id: ID_VALIDO, rol: 'ResponsableArea' })]);
    DependenciaArea.create.mockResolvedValue(dependenciaSimulada());
    DependenciaArea.findById.mockReturnValue({ populate: jest.fn().mockReturnThis() });
    Usuario.updateOne.mockResolvedValue({ acknowledged: true });

    await ejecutar(
      controlador.crearDependencia,
      reqDe(undefined, { nombre_dependencia: 'Tercera', responsable_ids: ['no-es-un-id', ID_VALIDO] })
    );

    expect(Usuario.find).toHaveBeenCalledWith({ _id: { $in: [ID_VALIDO] } });
  });
});

describe('dependenciaController.obtenerDependencias', () => {
  test('devuelve la lista de dependencias con sus responsables', async () => {
    const dependencias = [dependenciaSimulada()];
    const cadena = { populate: jest.fn(() => cadena), sort: jest.fn(() => Promise.resolve(dependencias)) };
    DependenciaArea.find.mockReturnValue(cadena);

    const { res } = await ejecutar(controlador.obtenerDependencias, reqDe());

    expect(res.statusCode).toBe(200);
    expect(res.cuerpo).toBe(dependencias);
    expect(cadena.populate).toHaveBeenCalledWith('responsables_ids', 'nombre_completo correo_institucional rol');
  });
});

describe('dependenciaController.actualizarDependencia', () => {
  test('devuelve 404 si la dependencia no existe', async () => {
    DependenciaArea.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(
      controlador.actualizarDependencia,
      reqDe(undefined, { nombre_dependencia: 'X' }, { id: 'dep-1' })
    );

    expect(error.statusCode).toBe(404);
    expect(error.message).toMatch(/no encontrada/i);
  });

  test('rechaza un nombre vacío', async () => {
    DependenciaArea.findById.mockResolvedValue(dependenciaSimulada());

    const error = await ejecutarEsperandoError(
      controlador.actualizarDependencia,
      reqDe(undefined, { nombre_dependencia: '   ' }, { id: 'dep-1' })
    );

    expect(error.statusCode).toBe(400);
  });

  test('actualiza nombre y estado activo', async () => {
    const dependencia = dependenciaSimulada();
    DependenciaArea.findById
      .mockResolvedValueOnce(dependencia)
      .mockReturnValue({ populate: jest.fn().mockReturnThis() });

    const { res } = await ejecutar(
      controlador.actualizarDependencia,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, { nombre_dependencia: '  Renombrada  ', activo: false }, { id: 'dep-1' })
    );

    expect(res.statusCode).toBe(200);
    expect(dependencia.nombre_dependencia).toBe('Renombrada');
    expect(dependencia.activo).toBe(false);
    expect(dependencia.save).toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'ACTUALIZAR_DEPENDENCIA' })
    );
  });
});

describe('dependenciaController.asignarResponsable', () => {
  test('exige un responsable_id válido', async () => {
    DependenciaArea.findById.mockResolvedValue(dependenciaSimulada());

    const error = await ejecutarEsperandoError(
      controlador.asignarResponsable,
      reqDe(undefined, { responsable_id: 'invalido' }, { id: 'dep-1' })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/responsable_id válido/i);
  });

  test('agrega el responsable sin duplicarlo y conserva el principal', async () => {
    const dependencia = dependenciaSimulada({
      responsable_id: 'u-previo',
      responsables_ids: ['u-previo'],
    });
    DependenciaArea.findById
      .mockResolvedValueOnce(dependencia)
      .mockReturnValue({ populate: jest.fn().mockReturnThis() });
    Usuario.find.mockResolvedValue([usuarioSimulado({ _id: ID_VALIDO })]);
    Usuario.updateOne.mockResolvedValue({ acknowledged: true });

    const { res } = await ejecutar(
      controlador.asignarResponsable,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, { responsable_id: ID_VALIDO }, { id: 'dep-1' })
    );

    expect(res.statusCode).toBe(200);
    expect(dependencia.responsables_ids).toEqual(['u-previo', ID_VALIDO]);
    expect(dependencia.responsable_id).toBe('u-previo');
  });

  test('no agrega dos veces al mismo responsable', async () => {
    const dependencia = dependenciaSimulada({
      responsable_id: ID_VALIDO,
      responsables_ids: [ID_VALIDO],
    });
    DependenciaArea.findById
      .mockResolvedValueOnce(dependencia)
      .mockReturnValue({ populate: jest.fn().mockReturnThis() });
    Usuario.find.mockResolvedValue([usuarioSimulado({ _id: ID_VALIDO })]);
    Usuario.updateOne.mockResolvedValue({ acknowledged: true });

    await ejecutar(
      controlador.asignarResponsable,
      reqDe(undefined, { responsable_id: ID_VALIDO }, { id: 'dep-1' })
    );

    expect(dependencia.responsables_ids).toEqual([ID_VALIDO]);
  });
});

describe('dependenciaController.actualizarResponsables', () => {
  test('exige la lista de responsables', async () => {
    DependenciaArea.findById.mockResolvedValue(dependenciaSimulada());

    const error = await ejecutarEsperandoError(
      controlador.actualizarResponsables,
      reqDe(undefined, {}, { id: 'dep-1' })
    );

    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/responsable_ids/i);
  });

  test('reemplaza la lista y deja como principal al primero', async () => {
    const dependencia = dependenciaSimulada({
      responsable_id: 'u-anterior',
      responsables_ids: ['u-anterior'],
    });
    DependenciaArea.findById
      .mockResolvedValueOnce(dependencia)
      .mockReturnValue({ populate: jest.fn().mockReturnThis() });
    Usuario.find.mockResolvedValue([
      usuarioSimulado({ _id: ID_VALIDO, rol: 'ResponsableArea' }),
      usuarioSimulado({ _id: OTRO_ID_VALIDO, rol: 'ResponsableArea' }),
    ]);
    Usuario.updateOne.mockResolvedValue({ acknowledged: true });
    Usuario.updateMany.mockResolvedValue({ acknowledged: true });

    const { res } = await ejecutar(
      controlador.actualizarResponsables,
      reqDe({ id: 'sup-1', rol: 'Supervisor' }, { responsable_ids: [ID_VALIDO, OTRO_ID_VALIDO] }, { id: 'dep-1' })
    );

    expect(res.statusCode).toBe(200);
    expect(dependencia.responsables_ids).toEqual([ID_VALIDO, OTRO_ID_VALIDO]);
    expect(dependencia.responsable_id).toBe(ID_VALIDO);
    expect(Usuario.updateOne).toHaveBeenCalledWith(
      { _id: ID_VALIDO },
      { $set: { dependencia_id: dependencia._id } }
    );
    expect(Usuario.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['u-anterior'] }, dependencia_id: dependencia._id },
      { $set: { dependencia_id: null } }
    );
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'ACTUALIZAR_RESPONSABLES_DEPENDENCIA' })
    );
  });

  test('puede dejar la dependencia sin responsables', async () => {
    const dependencia = dependenciaSimulada({
      responsable_id: 'u-anterior',
      responsables_ids: ['u-anterior'],
    });
    DependenciaArea.findById
      .mockResolvedValueOnce(dependencia)
      .mockReturnValue({ populate: jest.fn().mockReturnThis() });
    Usuario.updateOne.mockResolvedValue({ acknowledged: true });
    Usuario.updateMany.mockResolvedValue({ acknowledged: true });

    const { res } = await ejecutar(
      controlador.actualizarResponsables,
      reqDe(undefined, { responsable_ids: [] }, { id: 'dep-1' })
    );

    expect(res.statusCode).toBe(200);
    expect(dependencia.responsables_ids).toEqual([]);
    expect(dependencia.responsable_id).toBeNull();
  });
});

describe('dependenciaController.toggleEstado', () => {
  test('alterna el estado activo y lo audita', async () => {
    const dependencia = dependenciaSimulada({ activo: true });
    DependenciaArea.findById
      .mockResolvedValueOnce(dependencia)
      .mockReturnValue({ populate: jest.fn().mockReturnThis() });

    const { res } = await ejecutar(controlador.toggleEstado, reqDe({ id: 'sup-1', rol: 'Supervisor' }, {}, { id: 'dep-1' }));

    expect(res.statusCode).toBe(200);
    expect(dependencia.activo).toBe(false);
    expect(res.cuerpo.mensaje).toMatch(/desactivada/i);
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'DESACTIVAR_DEPENDENCIA' })
    );
  });

  test('reactiva una dependencia inactiva', async () => {
    const dependencia = dependenciaSimulada({ activo: false });
    DependenciaArea.findById
      .mockResolvedValueOnce(dependencia)
      .mockReturnValue({ populate: jest.fn().mockReturnThis() });

    await ejecutar(controlador.toggleEstado, reqDe(undefined, {}, { id: 'dep-1' }));

    expect(dependencia.activo).toBe(true);
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'ACTIVAR_DEPENDENCIA' })
    );
  });

  test('devuelve 404 si la dependencia no existe', async () => {
    DependenciaArea.findById.mockResolvedValue(null);

    const error = await ejecutarEsperandoError(controlador.toggleEstado, reqDe(undefined, {}, { id: 'dep-x' }));

    expect(error.statusCode).toBe(404);
  });
});
