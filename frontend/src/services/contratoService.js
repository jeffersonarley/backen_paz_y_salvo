import api from './api'

// Servicios para Contratos
export async function listarContratos(params = {}) {
  const { data } = await api.get('/contratos', { params })
  return data
}

export async function misSolicitudes() {
  const { data } = await api.get('/contratos/mis-solicitudes')
  return data
}

export async function obtenerContrato(id) {
  const { data } = await api.get(`/contratos/${id}`)
  return data
}

export async function obtenerObservaciones(id) {
  const { data } = await api.get(`/contratos/${id}/observaciones`)
  return data
}

export async function crearContrato(contratoData) {
  const { data } = await api.post('/contratos', contratoData)
  return data
}

export async function actualizarContrato(id, datos) {
  const { data } = await api.put(`/contratos/${id}`, datos)
  return data
}

export async function cancelarContrato(id) {
  const { data } = await api.delete(`/contratos/${id}`)
  return data
}

export async function eliminarBien(id, bienId) {
  const { data } = await api.delete(`/contratos/${id}/bienes/${bienId}`)
  return data
}

export async function descargarPdf(id) {
  const response = await api.get(`/contratos/${id}/pdf`, {
    responseType: 'blob',
  })
  return response.data
}

export async function obtenerPorCodigo(codigo) {
  // Buscar por número de contrato o número de solicitud
  const { data } = await api.get('/contratos', { params: { busqueda: codigo } })
  const lista = Array.isArray(data) ? data : data?.contratos || data?.data || []
  return lista.find(c => c.numero_contrato === codigo || c.numero === codigo)
}