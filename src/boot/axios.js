import { boot } from 'quasar/wrappers'
import axios from 'axios'

// En Quasar con Vite se usa import.meta.env en lugar de process.env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default boot(({ app }) => {
  // Inyectar token JWT si existe en sessionStorage o localStorage
  api.interceptors.request.use(
    (config) => {
      const token =
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // Interceptor para manejo global de 401
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('auth_token')
      }
      return Promise.reject(error)
    },
  )

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
