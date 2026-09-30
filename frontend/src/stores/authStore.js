import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

function normalizarRol(valor) {
  const v = String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '')
  if (v.includes('ADMIN')) return 'Administrador'
  if (v.includes('SUPER')) return 'Supervisor'
  if (v.includes('RESPONSABLE')) return 'ResponsableArea'
  if (v.includes('CONTRAT')) return 'Contratista'
  return v
}

export const useAuthStore = defineStore('auth', () => {
  // Usuario autenticado en sesión (desde localStorage fond_usuario)
  const usuario = ref(JSON.parse(localStorage.getItem('fond_usuario') || 'null'))

  const estaAutenticado = computed(() => !!usuario.value)
  const rolUsuario = computed(() => normalizarRol(usuario.value?.rol))

  function tienePermiso(rolesPermitidos = []) {
    if (!usuario.value) return false
    if (!Array.isArray(rolesPermitidos) || rolesPermitidos.length === 0) return true
    const rolActual = normalizarRol(usuario.value.rol)
    return rolesPermitidos.some((rol) => normalizarRol(rol) === rolActual)
  }

  async function login(correo, password) {
    const emailLimpio = (correo || '').trim().toLowerCase()

    try {
      const resp = await api.post('/auth/login', {
        correo: emailLimpio,
        correo_institucional: emailLimpio,
        password: password,
        contraseña: password,
      })

      if (resp.data?.token && resp.data?.usuario) {
        const u = resp.data.usuario
        const userObj = {
          id: u.id || u._id,
          nombre: u.nombre || u.nombre_completo,
          correo: u.correo || u.correo_institucional,
          rol: u.rol,
          cargo: u.cargo || '',
        }
        usuario.value = userObj
        localStorage.setItem('fond_token', resp.data.token)
        localStorage.setItem('fond_usuario', JSON.stringify(userObj))
        return { success: true, user: userObj }
      }
    } catch (err) {
      console.warn('Login backend falló:', err.response?.data?.mensaje || err.message)
    }

    return { success: false, message: 'Correo o contraseña incorrectos.' }
  }

  function logout() {
    usuario.value = null
    localStorage.removeItem('fond_usuario')
    localStorage.removeItem('fond_token')
  }

  return {
    usuario,
    estaAutenticado,
    rolUsuario,
    tienePermiso,
    login,
    logout,
  }
})