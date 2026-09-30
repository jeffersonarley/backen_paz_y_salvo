import axios from 'axios'

/*
 * Cliente HTTP central para consumir la API de Paz y Salvo (backend_paz_y_salvo).
 * - Adjunta automáticamente el token JWT en cada petición.
 * - Expulsa al usuario (limpia sesión) cuando el token expira (HTTP 401).
 */

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fond_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const mensaje = error.response?.data?.mensaje || 'Error de conexión con el servidor.'

    // Sesión expirada en rutas protegidas (no en el login, que devuelve 401 por credenciales).
    if (status === 401 && !url.includes('auth/login')) {
      localStorage.removeItem('fond_token')
      localStorage.removeItem('fond_usuario')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    error.mensaje = mensaje
    return Promise.reject(error)
  },
)

export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  if (error?.response?.data?.mensaje) return error.response.data.mensaje
  if (error?.mensaje) return error.mensaje
  if (error?.message) return error.message
  return fallback
}

export default api