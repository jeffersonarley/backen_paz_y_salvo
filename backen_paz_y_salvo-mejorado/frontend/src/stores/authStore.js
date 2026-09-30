import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUsuario, logout as cerrarSesion } from '@/services/authService'

function normalizarRol(valor) {
  const v = String(valor || '').trim().toUpperCase().replace(/[\s_-]+/g, '')
  if (v.includes('ADMIN')) return 'ADMINISTRADOR'
  if (v.includes('SUPER')) return 'SUPERVISOR'
  if (v.includes('RESPONSABLE')) return 'RESPONSABLE_AREA'
  if (v.includes('CONTRAT')) return 'CONTRATISTA'
  return v
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(getUsuario())

  const nombre = computed(() => usuario.value?.nombre || usuario.value?.nombre_completo || '')
  const correo = computed(() => usuario.value?.correo || usuario.value?.correo_institucional || '')
  const id = computed(() => usuario.value?.id || usuario.value?._id || null)
  const rol = computed(() => usuario.value?.rol || '')
  const rolNormalizado = computed(() => normalizarRol(rol.value))
  const cargo = computed(() => usuario.value?.cargo || '')
  const estaAutenticado = computed(() => !!usuario.value)

  function hasRol(rolesPermitidos = []) {
    if (!Array.isArray(rolesPermitidos) || rolesPermitidos.length === 0) return true
    return rolesPermitidos.some((r) => normalizarRol(r) === rolNormalizado.value)
  }

  function logout() {
    cerrarSesion()
    usuario.value = null
  }

  return {
    usuario,
    nombre,
    correo,
    id,
    rol,
    rolNormalizado,
    cargo,
    estaAutenticado,
    hasRol,
    logout
  }
})