import api from './axios'

/**
 * Módulo de Usuarios (Admin / Supervisor).
 * GET    /api/usuarios
 * POST   /api/usuarios
 * GET    /api/usuarios/:id
 * PATCH  /api/usuarios/:id
 * PATCH  /api/usuarios/estado/:id
 */
export function listarUsuarios() {
  return api.get('/usuarios')
}

export function crearUsuario(payload) {
  return api.post('/usuarios', payload)
}

export function obtenerUsuario(id) {
  return api.get(`/usuarios/${id}`)
}

export function actualizarUsuario(id, payload) {
  return api.patch(`/usuarios/${id}`, payload)
}

export function cambiarEstadoUsuario(id, activo) {
  return api.patch(`/usuarios/estado/${id}`, { activo })
}
