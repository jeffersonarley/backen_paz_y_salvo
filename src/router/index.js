import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes.js'
import { useAuthStore } from '../stores/authStore.js'

<<<<<<< HEAD
export default defineRouter(() => {
=======
/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(({ store }) => {
>>>>>>> origin/frontend-juanpablo
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

<<<<<<< HEAD
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
=======
  // Guard de autenticación: protege las rutas del módulo /app y
  // redirige usuarios ya logueados fuera de la pantalla de login.
  Router.beforeEach((to) => {
    const auth = useAuthStore(store)
    const requiereAuth = to.path.startsWith('/app')

    if (requiereAuth && !auth.isAuthenticated) {
      return { path: '/' }
    }

    if (to.path === '/' && auth.isAuthenticated) {
      return { path: '/app' }
    }

    if (to.meta?.roles && !to.meta.roles.includes(auth.rol)) {
      return { path: '/app/sinpermisos' }
>>>>>>> origin/frontend-juanpablo
    }

    return true
  })

  return Router
})