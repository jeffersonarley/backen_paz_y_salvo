import api from './api'

// Servicios para Reportes
export async function obtenerMetricas() {
  const { data } = await api.get('/reportes/metricas')
  return data
}

export async function obtenerContratosPorEstado() {
  const { data } = await api.get('/reportes/contratos-por-estado')
  return data
}

export async function obtenerActividadReciente(limite = 10) {
  const { data } = await api.get('/reportes/actividad-reciente', { params: { limite } })
  return data
}