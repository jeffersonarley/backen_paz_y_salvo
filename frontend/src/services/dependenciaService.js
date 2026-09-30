import api from './api'

// Servicios para Dependencias
export async function listarDependencias(params = {}) {
  const { data } = await api.get('/dependencias', { params })
  return data
}

export async function obtenerDependencia(id) {
  const { data } = await api.get(`/dependencias/${id}`)
  return data
}

export async function crearDependencia(datos) {
  const { data } = await api.post('/dependencias', datos)
  return data
}

export async function actualizarDependencia(id, datos) {
  const { data } = await api.put(`/dependencias/${id}`, datos)
  return data
}

export async function toggleEstado(id) {
  const { data } = await api.delete(`/dependencias/${id}`)
  return data
}

export async function asignarResponsable(id, responsable_id) {
  const { data } = await api.post(`/dependencias/${id}/responsable`, { responsable_id })
  return data
}