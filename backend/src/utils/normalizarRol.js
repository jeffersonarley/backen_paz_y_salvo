// Valores canónicos de rol (deben coincidir con el enum del modelo Usuario)
const ROLES_CANONICOS = ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'];

const MAPA_NORMALIZACION = {
  administrador: 'Administrador',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  responsablearea: 'ResponsableArea',
  responsable_area: 'ResponsableArea',
  responsable: 'ResponsableArea',
  contratista: 'Contratista'
};

// Normaliza cualquier valor de rol (mayúsculas, guiones, etc.) al canónico.
// Si no se reconoce, devuelve el valor tal cual para que la validación lo rechace.
const normalizarRol = (rol) => {
  if (typeof rol !== 'string') {
    return rol;
  }

  const limpio = rol.trim();
  const clave = limpio.toLowerCase().replace(/[\s-]+/g, '_');
  const normalizado = MAPA_NORMALIZACION[clave] || limpio;

  return ROLES_CANONICOS.includes(normalizado) ? normalizado : normalizado;
};

module.exports = normalizarRol;