export const ROL = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR: 'Supervisor',
  RESPONSABLE_AREA: 'ResponsableArea',
  CONTRATISTA: 'Contratista'
}

export const ROLES = Object.values(ROL)

// Cadena jerárquica de creación de usuarios (debe coincidir con el backend)
export const ROLES_CREABLES_POR_ROL = {
  [ROL.ADMINISTRADOR]: [ROL.SUPERVISOR],
  [ROL.SUPERVISOR]: [ROL.CONTRATISTA, ROL.RESPONSABLE_AREA]
}

export const ROL_LABELS = {
  [ROL.ADMINISTRADOR]: 'Administrador',
  [ROL.SUPERVISOR]: 'Supervisor',
  [ROL.RESPONSABLE_AREA]: 'Responsable de Área',
  [ROL.CONTRATISTA]: 'Contratista'
}
