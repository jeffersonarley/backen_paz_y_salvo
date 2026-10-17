import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

function normalizarRol(valor) {
  const v = String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '')
  if (v.includes('ADMIN')) return 'ADMINISTRADOR'
  if (v.includes('SUPER')) return 'SUPERVISOR'
  if (v.includes('RESPONSABLE')) return 'RESPONSABLE_AREA'
  if (v.includes('CONTRAT')) return 'CONTRATISTA'
  return v
}

export const useAuthStore = defineStore('auth', () => {
  // Usuario autenticado en sesión
  const usuarioGuardado = JSON.parse(localStorage.getItem('gccon_user') || 'null')
  const usuario = ref(usuarioGuardado)

  const estaAutenticado = computed(() => !!usuario.value)
  const rolUsuario = computed(() => normalizarRol(usuario.value?.rol))

  function tienePermiso(rolesPermitidos = []) {
    if (!usuario.value) return false
    if (!Array.isArray(rolesPermitidos) || rolesPermitidos.length === 0) return true
    const rolActual = normalizarRol(usuario.value.rol)
    return rolesPermitidos.some((rol) => normalizarRol(rol) === rolActual)
  }

  function guardarCredenciales(token, userObj) {
    usuario.value = userObj
    const tk = token
    localStorage.setItem('auth_token', tk)
    localStorage.setItem('token', tk)
    localStorage.setItem('gccon_user', JSON.stringify(userObj))
    sessionStorage.setItem('auth_token', tk)
    sessionStorage.setItem('token', tk)
    sessionStorage.setItem('gccon_user', JSON.stringify(userObj))

    // Establecer cookies para robots de testing (TestSprite, Playwright, Cypress)
    try {
      const dias = 7 * 24 * 60 * 60 * 1000
      const expira = new Date(Date.now() + dias).toUTCString()
      document.cookie = `auth_token=${tk}; expires=${expira}; path=/; SameSite=Lax`
      document.cookie = `token=${tk}; expires=${expira}; path=/; SameSite=Lax`
      document.cookie = `session=${tk}; expires=${expira}; path=/; SameSite=Lax`
      document.cookie = `gccon_user=${encodeURIComponent(JSON.stringify(userObj))}; expires=${expira}; path=/; SameSite=Lax`
    } catch (e) {
      console.warn('Error al guardar cookies de sesion:', e)
    }
  }

  async function login(correo, password) {
    const emailLimpio = (correo || '').trim().toLowerCase()

    try {
      const resp = await api.post('/auth/login', {
        correo: emailLimpio,
        correo_institucional: emailLimpio,
        password: password,
      })

      if (resp.data?.token && resp.data?.usuario) {
        const u = resp.data.usuario
        const userObj = {
          id: u.id || u._id,
          nombre: u.nombre || u.nombre_completo,
          correo: u.correo || u.correo_institucional,
          documento: u.documento || u.identificacion || u.cedula || '',
          telefono: u.telefono || '',
          numeroContrato: u.numero_contrato || u.numeroContrato || '',
          rol: u.rol,
          cargo: u.cargo || '',
          dependencia: u.dependencia || u.dependencia_id?.nombre_dependencia || '',
        }
        guardarCredenciales(resp.data.token, userObj)
        return { success: true, user: userObj }
      }

      return {
        success: false,
        message: resp.data?.mensaje || 'Correo o contraseña incorrectos.',
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.mensaje || 'Correo o contraseña incorrectos.',
      }
    }
  }

  function logout() {
    usuario.value = null
    localStorage.removeItem('gccon_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('token')
    sessionStorage.removeItem('gccon_user')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('solicitudes_creadas_sesion')
    sessionStorage.removeItem('solicitudes_creadas_orden')
    try {
      // Limpiar claves creadas de sesión por usuario
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('solicitudes_creadas_')) {
          sessionStorage.removeItem(k)
        }
      })
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'gccon_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } catch {
      /* noop */
    }
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
