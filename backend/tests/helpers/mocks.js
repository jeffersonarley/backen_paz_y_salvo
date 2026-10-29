// Utilidades compartidas por las pruebas unitarias de controladores.

/**
 * Crea un objeto `res` de Express simulado que registra el código y el cuerpo.
 */
function crearRes() {
  const res = {
    statusCode: null,
    cuerpo: null,
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockImplementation((codigo) => {
    res.statusCode = codigo;
    return res;
  });
  res.json.mockImplementation((cuerpo) => {
    res.cuerpo = cuerpo;
    return res;
  });
  return res;
}

/**
 * Deja que se resuelvan todas las microtareas pendientes (los controladores están
 * envueltos con asyncHandler, que no devuelve la promesa).
 */
function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Ejecuta un controlador y devuelve { res, next } tras vaciar la cola de promesas.
 */
async function ejecutar(handler, req, res = crearRes()) {
  const next = jest.fn();
  handler(req, res, next);
  await flush();
  return { res, next };
}

/**
 * Ejecuta un controlador esperando que termine y devuelve el error que llegó a `next`.
 */
async function ejecutarEsperandoError(handler, req, res = crearRes()) {
  const next = jest.fn();
  handler(req, res, next);
  await flush();
  return next.mock.calls[0]?.[0];
}

/**
 * Crea un objeto de usuario simulado.
 */
function usuarioSimulado(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    nombre_completo: 'Usuario Prueba',
    correo_institucional: 'prueba@institucion.edu.co',
    rol: 'ResponsableArea',
    activo: true,
    dependencia_id: null,
    supervisor_id: null,
    apoyo_supervision_id: null,
    plantilla_predeterminada: 'COMPLETA',
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Crea un objeto de dependencia simulado.
 */
function dependenciaSimulada(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439022',
    nombre_dependencia: 'Dependencia Prueba',
    activo: true,
    responsable_id: null,
    responsables_ids: [],
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Crea una cadena de consulta simulada (populate/sort) que devuelve el valor dado.
 */
function cadenaConsulta(valor) {
  const cadena = {
    populate: jest.fn(() => cadena),
    select: jest.fn(() => cadena),
    sort: jest.fn(() => cadena),
    then: (resolver, rechazar) => Promise.resolve(valor).then(resolver, rechazar),
  };
  return cadena;
}

module.exports = {
  crearRes,
  flush,
  ejecutar,
  ejecutarEsperandoError,
  usuarioSimulado,
  dependenciaSimulada,
  cadenaConsulta,
};
