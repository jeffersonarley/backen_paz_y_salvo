import api from './axios'

/**
 * Módulo de Contratos e Inventario.
 * POST    /api/contratos/nuevo
 * GET     /api/contratos/mis-solicitudes   (Contratista)
 * GET     /api/contratos                   (Supervisor / Admin / ResponsableArea)
 * GET     /api/contratos/:id               -> { contrato, bienes }
 * PUT     /api/contratos/:id               (Contratista, estado Borrador)
 * DELETE  /api/contratos/:id               (Contratista, estado Borrador)
 * DELETE  /api/contratos/:id/bienes/:bienId
 * GET     /api/contratos/:id/observaciones
 * GET     /api/contratos/:id/pdf
 */
export function listarContratos() {
  return api.get('/contratos')
}

export function misSolicitudes() {
  return api.get('/contratos/mis-solicitudes')
}

export function obtenerContrato(id) {
  return api.get(`/contratos/${id}`)
}

export function crearContrato(payload) {
  return api.post('/contratos/nuevo', payload)
}

export function actualizarContrato(id, payload) {
  return api.put(`/contratos/${id}`, payload)
}

export function cancelarContrato(id) {
  return api.delete(`/contratos/${id}`)
}

export function eliminarBien(id, bienId) {
  return api.delete(`/contratos/${id}/bienes/${bienId}`)
}

export function obtenerObservaciones(id) {
  return api.get(`/contratos/${id}/observaciones`)
}

// Supervisión (Diagrama 3): PUT /api/contratos/evaluar/:id
export function evaluarContrato(id, payload) {
  return api.put(`/contratos/evaluar/${id}`, payload)
}

export function descargarPdf(id) {
  return api.get(`/contratos/${id}/pdf`, { responseType: 'blob' })
}
