import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function normalizarRol(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

export const useAuthStore = defineStore('auth', () => {
  // Usuario autenticado en sesión
  const usuario = ref(JSON.parse(localStorage.getItem('gccon_user') || 'null'))

  // Lista de usuarios de prueba según la jerarquía del sistema
  const usuariosPrueba = ref([
    {
      id: 1,
      nombre: 'Administrador General SENA',
      correo: 'admin@gccon.com',
      password: 'admin',
      rol: 'ADMINISTRADOR',
      cargo: 'Administrador del Sistema',
    },
    {
      id: 2,
      nombre: 'Paula Administradora',
      correo: 'paula.admin@gccon.com',
      password: '123',
      rol: 'ADMINISTRADOR',
      cargo: 'Coordinadora de Aseguramiento Contractual',
    },
    {
      id: 3,
      nombre: 'Ing. Carlos Supervisor',
      correo: 'supervisor@gccon.com',
      password: 'super',
      rol: 'SUPERVISOR',
      cargo: 'Supervisor de Contratos TIC',
    },
    {
      id: 4,
      nombre: 'Dra. Ana María Gómez',
      correo: 'agomez@sena.edu.co',
      password: '123',
      rol: 'SUPERVISOR',
      cargo: 'Supervisora Senior de Contratación',
    },
    {
      id: 5,
      nombre: 'Ing. Fernando Ramírez',
      correo: 'f.ramirez@sena.edu.co',
      password: '123',
      rol: 'SUPERVISOR',
      cargo: 'Supervisor de Infraestructura',
    },
    {
      id: 6,
      nombre: 'Laura Andrea Contratista',
      correo: 'contratista@gccon.com',
      password: '123',
      rol: 'CONTRATISTA',
      cargo: 'Especialista en Soporte Informático',
    },
    {
      id: 7,
      nombre: 'Juan Carlos Pérez',
      correo: 'juan.perez@correo.com',
      password: '123',
      rol: 'CONTRATISTA',
      cargo: 'Desarrollador Full-Stack Senior',
    },
    {
      id: 8,
      nombre: 'María Fernanda Gómez',
      correo: 'maria.gomez@correo.com',
      password: '123',
      rol: 'CONTRATISTA',
      cargo: 'Instructora Contratista en Telemática',
    },
    {
      id: 9,
      nombre: 'Carlos Eduardo Mendoza',
      correo: 'carlos.mendoza@email.com',
      password: '123',
      rol: 'CONTRATISTA',
      cargo: 'Consultor en Redes y Telecomunicaciones',
    },
    {
      id: 10,
      nombre: 'Diego Morales Castro',
      correo: 'diego.morales@correo.com',
      password: '123',
      rol: 'CONTRATISTA',
      cargo: 'Técnico de Mantenimiento de Hardware',
    },
    {
      id: 11,
      nombre: 'Lic. Martha Almacén',
      correo: 'area.almacen@gccon.com',
      password: '123',
      rol: 'RESPONSABLE_AREA',
      cargo: 'Líder de Almacén e Inventarios',
    },
    {
      id: 12,
      nombre: 'Ing. Roberto TIC',
      correo: 'area.tic@gccon.com',
      password: '123',
      rol: 'RESPONSABLE_AREA',
      cargo: 'Líder de Gestión Tecnológica',
    },
    {
      id: 13,
      nombre: 'Dra. Claudia Ramos',
      correo: 'rrhh@sena.edu.co',
      password: '123',
      rol: 'RESPONSABLE_AREA',
      cargo: 'Líder de Gestión de Talento Humano',
    },
    {
      id: 14,
      nombre: 'Lic. Jorge Biblioteca',
      correo: 'biblioteca@sena.edu.co',
      password: '123',
      rol: 'RESPONSABLE_AREA',
      cargo: 'Responsable de Archivo y Biblioteca',
    },
    {
      id: 15,
      nombre: 'Dra. Ana María Gómez',
      correo: 'responsable@gccon.com',
      password: '123',
      rol: 'RESPONSABLE_AREA',
      cargo: 'Responsable de Sistemas e Informática',
    },
  ])

  const estaAutenticado = computed(() => !!usuario.value)
  const rolUsuario = computed(() => normalizarRol(usuario.value?.rol))

  function tienePermiso(rolesPermitidos = []) {
    if (!usuario.value) return false
    if (!Array.isArray(rolesPermitidos) || rolesPermitidos.length === 0) return true
    const rolActual = normalizarRol(usuario.value.rol)
    return rolesPermitidos.some((rol) => normalizarRol(rol) === rolActual)
  }

  function login(correo, password) {
    const emailLimipio = (correo || '').trim().toLowerCase()
    let user = usuariosPrueba.value.find(
      (u) =>
        u.correo.toLowerCase() === emailLimipio &&
        (u.password === password || password === '123' || password === '12345678' || password === 'Admin1234!'),
    )

    // Fallback permisivo para demostraciones sin bloqueos
    if (!user) {
      user = usuariosPrueba.value.find((u) => u.correo.toLowerCase() === emailLimipio)
    }

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
    tienePermiso,
    login,
    logout,
  }
})
