import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes.js'

export default defineRouter(() => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

  const normalizarRol = (valor) => {
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

  // Navigation Guard moderno (retornos directos sin callbacks next)
  Router.beforeEach((to) => {
    const usuarioRaw = localStorage.getItem('fond_usuario')
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null

    if (to.meta && to.meta.titulo) {
      document.title = `${to.meta.titulo} - GCCON-F-088`
    }

    if (to.name === 'login') {
      return true
    }

    if (!usuario) {
      return { name: 'login' }
    }

    const rolesPermitidos = Array.isArray(to.meta?.roles) ? to.meta.roles : []
    if (rolesPermitidos.length > 0) {
      const rolActual = normalizarRol(usuario.rol)
      const tieneRol = rolesPermitidos.some((rol) => normalizarRol(rol) === rolActual)
      if (!tieneRol) {
        return { name: 'no-permisos' }
      }
    }

    return true
  })

  return Router
})