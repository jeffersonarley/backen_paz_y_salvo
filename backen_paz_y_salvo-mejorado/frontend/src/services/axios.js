import axios from 'axios'
import { TOKEN_KEY, USER_KEY } from '@/constants/storage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de petición: adjunta el token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de respuesta: maneja errores globales y expiración de sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Extrae un mensaje legible de un error de Axios.
 * Se adapta a la estructura de errores del backend ({ mensaje: '...' }).
 */
export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  return (
    error?.response?.data?.mensaje ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  )
}

export default api
