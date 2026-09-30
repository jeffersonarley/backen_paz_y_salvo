import api from './api'

// Servicios para Usuarios
export async function listarUsuarios(params = {}) {
  const { data } = await api.get('/usuarios', { params })
  return data
}

export async function obtenerUsuario(id) {
  const { data } = await api.get(`/usuarios/${id}`)
  return data
}

export async function crearUsuario(datos) {
  const { data } = await api.post('/usuarios', datos)
  return data
}

export async function actualizarUsuario(id, datos) {
  const { data } = await api.patch(`/usuarios/${id}`, datos)
  return data
}

export async function eliminarUsuario(id) {
  const { data } = await api.delete(`/usuarios/${id}`)
  return data
}

export async function cambiarEstadoUsuario(id, estado) {
  const { data } = await api.patch(`/usuarios/estado/${id}`, { activo: estado })
  return data
}

export async function listarPorRol(rol) {
  const { data } = await api.get('/usuarios', { params: { rol } })
  return data
}

export async function obtenerPorId(id) {
  const { data } = await api.get(`/usuarios/${id}`)
  return data
}