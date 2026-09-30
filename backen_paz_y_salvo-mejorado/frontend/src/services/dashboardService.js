import { listarUsuarios } from './usuarioService'
import { listarContratos, misSolicitudes } from './contratoService'
import { listarDependencias } from './dependenciaService'
import { listarPendientes } from './firmaService'
import { ROL } from '@/constants/roles'

/**
 * Calcula los indicadores del panel a partir de los endpoints existentes,
 * según el rol del usuario autenticado (sin endpoints adicionales en backend).
 * Devuelve un array de tarjetas { key, label, icon, color, value }.
 */
export async function getDashboardStats(rol) {
  const peticiones = []

  if (rol === ROL.CONTRATISTA) {
    peticiones.push(['contratos', misSolicitudes()])
  } else {
    peticiones.push(['contratos', listarContratos()])
  }

  if ([ROL.ADMINISTRADOR, ROL.SUPERVISOR].includes(rol)) {
    peticiones.push(['usuarios', listarUsuarios()])
    peticiones.push(['dependencias', listarDependencias()])
  }

  if ([ROL.ADMINISTRADOR, ROL.RESPONSABLE_AREA].includes(rol)) {
    peticiones.push(['firmasPendientes', listarPendientes()])
  }

  const resultados = await Promise.allSettled(peticiones.map(([, p]) => p))

  const totales = {}
  peticiones.forEach(([key], i) => {
    const r = resultados[i]
    if (r.status === 'fulfilled') {
      const data = r.value?.data
      totales[key] = Array.isArray(data) ? data.length : null
    } else {
      totales[key] = null
    }
  })

  const tarjetas = []
  if (totales.contratos !== undefined) {
    tarjetas.push({
      key: 'contratos',
      label: rol === ROL.CONTRATISTA ? 'Mis solicitudes' : 'Contratos',
      icon: 'assignment',
      color: 'primary',
      value: totales.contratos
    })
  }
  if (totales.usuarios !== undefined) {
    tarjetas.push({ key: 'usuarios', label: 'Usuarios', icon: 'people', color: 'teal', value: totales.usuarios })
  }
  if (totales.dependencias !== undefined) {
    tarjetas.push({ key: 'dependencias', label: 'Dependencias', icon: 'apartment', color: 'purple', value: totales.dependencias })
  }
  if (totales.firmasPendientes !== undefined) {
    tarjetas.push({ key: 'firmasPendientes', label: 'Firmas pendientes', icon: 'draw', color: 'orange', value: totales.firmasPendientes })
  }

  return tarjetas
}
