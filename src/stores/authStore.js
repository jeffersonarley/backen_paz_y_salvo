import { defineStore } from 'pinia'
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