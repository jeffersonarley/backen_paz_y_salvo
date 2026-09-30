import api from './api'

// Servicios de Autenticación
export async function login(correo, password) {
  const { data } = await api.post('/auth/login', {
    correo_institucional: correo,
    password,
  })
  return data
}

export async function recuperarPassword(correo) {
  const { data } = await api.post('/auth/recuperar', { correo_institucional: correo })
  return data
}

export async function restablecerPassword(token, password) {
  const { data } = await api.post('/auth/restablecer', { token, password })
  return data
}

export async function cambiarPassword(passwordActual, nuevaPassword) {
  const { data } = await api.put('/auth/cambiar-password', {
    password_actual: passwordActual,
    nueva_password: nuevaPassword,
  })
  return data
}