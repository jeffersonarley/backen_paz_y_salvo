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

  // Navigation Guard moderno (retornos directos sin callbacks next)
  Router.beforeEach((to) => {
    const usuarioRaw = localStorage.getItem('gccon_user')
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null

    if (to.meta && to.meta.titulo) {
      document.title = `${to.meta.titulo} - GCCON-F-088`
    }

    // Permitir navegación a la ruta de login sin bloqueos
    if (to.name === 'login') {
      return true
    }

    // Redirigir al login si no hay usuario registrado e intenta acceder a la App
    if (!usuario && to.path.startsWith('/app')) {
      return { name: 'login' }
    }

    return true
  })

  return Router
})