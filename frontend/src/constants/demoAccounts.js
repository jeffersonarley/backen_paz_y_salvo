import { ROL } from './roles'

// Cuentas demo SOLO para desarrollo local (npm run dev). Las credenciales ya no viven en el
// código: se leen de variables VITE_DEMO_* en frontend/.env y se ignoran en producción.
const habilitado = import.meta.env.DEV

const cuenta = (correo, password) => (correo && password ? { correo, password } : null)

const demo = habilitado
  ? {
      [ROL.ADMINISTRADOR]: cuenta(import.meta.env.VITE_DEMO_ADMIN_EMAIL, import.meta.env.VITE_DEMO_ADMIN_PASSWORD),
      [ROL.SUPERVISOR]: cuenta(import.meta.env.VITE_DEMO_SUPERVISOR_EMAIL, import.meta.env.VITE_DEMO_SUPERVISOR_PASSWORD)
    }
  : {}

export const CUENTAS_DEMO = Object.fromEntries(Object.entries(demo).filter(([, v]) => v))
