import { defineStore } from 'pinia'
import api from '../services/api'

/*
 * Store de autenticación del Sistema GCCON-F-088.
 * Mantiene sesión en memoria + localStorage, expone el token y el usuario.
 */

const TOKEN_KEY = 'auth_token'
const USUARIO_KEY = 'auth_usuario'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    usuario: JSON.parse(localStorage.getItem(USUARIO_KEY) || 'null')
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    id: (state) => state.usuario?.id || '',
    rol: (state) => state.usuario?.rol || '',
    nombre: (state) => state.usuario?.nombre || '',
    correo: (state) => state.usuario?.correo || '',
    documento: (state) => state.usuario?.documento || ''
  },

  actions: {
    async login({ correo_institucional, password }) {
      const { data } = await api.post('/api/auth/login', {
        correo_institucional,
        password
      })

      this.token = data.token
      this.usuario = data.usuario
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USUARIO_KEY, JSON.stringify(data.usuario))

      return data
    },

    logout() {
      this.token = ''
      this.usuario = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USUARIO_KEY)
    }
  }
})
