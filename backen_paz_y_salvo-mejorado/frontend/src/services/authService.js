import api from './axios'
import { TOKEN_KEY, USER_KEY } from '@/constants/storage'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function getRol() {
  return getUsuario()?.rol || null
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Inicia sesión contra POST /api/auth/login.
 * @param {{ correo_institucional: string, password: string }} credentials
 */
export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  setToken(data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.usuario))
  return data
}

export function logout() {
  clearSession()
}

export function isAuthenticated() {
  return Boolean(getToken())
}
