import { defineStore } from 'pinia'
<<<<<<< HEAD
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Usuario autenticado en sesión
  const usuario = ref(
    JSON.parse(localStorage.getItem('gccon_user') || 'null')
  )

  // Lista de usuarios de prueba según la jerarquía del sistema
  const usuariosPrueba = ref([
    {
      id: 1,
      nombre: 'Administrador Principal',
      correo: 'admin@gccon.com',
      password: 'admin',
      rol: 'ADMINISTRADOR',
      cargo: 'Administrador del Sistema'
    },
    {
      id: 2,
      nombre: 'Ing. María Fernanda López',
      correo: 'supervisor@gccon.com',
      password: 'super',
      rol: 'SUPERVISOR',
      cargo: 'Supervisor de Contratos'
    },
    {
      id: 3,
      nombre: 'Carlos Mendoza',
      correo: 'carlos.mendoza@email.com',
      password: '123',
      rol: 'CONTRATISTA',
      cargo: 'Contratista de Desarrollo'
    },
    {
      id: 4,
      nombre: 'Dra. Ana María Gómez',
      correo: 'responsable@gccon.com',
      password: '123',
      rol: 'RESPONSABLE_AREA',
      cargo: 'Responsable de Sistemas e Informática'
    }
  ])

  const estaAutenticado = computed(() => !!usuario.value)
  const rolUsuario = computed(() => usuario.value?.rol || null)

  function login(correo, password) {
    const user = usuariosPrueba.value.find(
      u => u.correo.toLowerCase() === correo.trim().toLowerCase() && u.password === password
    )

    if (user) {
      usuario.value = { ...user }
      localStorage.setItem('gccon_user', JSON.stringify(user))
      return { success: true, user }
    } else {
      return { success: false, message: 'Correo o contraseña incorrectos.' }
    }
  }

  function logout() {
    usuario.value = null
    localStorage.removeItem('gccon_user')
  }

  return {
    usuario,
    usuariosPrueba,
    estaAutenticado,
    rolUsuario,
    login,
    logout
  }
})
=======
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
>>>>>>> origin/frontend-juanpablo
