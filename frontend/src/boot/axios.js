import { boot } from 'quasar/wrappers'
import axios from 'axios'

// En Quasar con Vite se usa import.meta.env en lugar de process.env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default boot(({ app }) => {
  // Inyectar token JWT si existe en localStorage
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('fond_token')
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
        localStorage.removeItem('fond_token')
        localStorage.removeItem('fond_usuario')
      }
      return Promise.reject(error)
    },
  )

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }