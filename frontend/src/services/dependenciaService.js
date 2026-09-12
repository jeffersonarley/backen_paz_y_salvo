import api from './axios'

/**
 * Módulo de Dependencias y Responsables (RF-012, Supervisor / Admin).
 * POST   /api/dependencias
 * GET    /api/dependencias
 * PUT    /api/dependencias/:id
 * POST   /api/dependencias/:id/responsable
 */
export function listarDependencias() {
  return api.get('/dependencias')
}

export function crearDependencia(payload) {
  return api.post('/dependencias', payload)
}

export function actualizarDependencia(id, payload) {
  return api.put(`/dependencias/${id}`, payload)
}

export function asignarResponsable(id, responsableId) {
  return api.post(`/dependencias/${id}/responsable`, { responsable_id: responsableId })
}
