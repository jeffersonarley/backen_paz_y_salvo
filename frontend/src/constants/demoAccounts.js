import { ROL } from './roles'

// Credenciales de las cuentas demo creadas por los scripts seed del backend.
// Deben coincidir con seedAdmin.js / seedSupervisor.js.
export const CUENTAS_DEMO = {
  [ROL.ADMINISTRADOR]: {
    correo: 'admin@institucion.edu.co',
    password: 'AdminSeguro123!'
  },
  [ROL.SUPERVISOR]: {
    correo: 'supervisor.prueba@institucion.edu',
    password: 'ClaveSegura123!'
  }
}
