import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes.js'
import { useAuthStore } from '../stores/authStore.js'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(({ store }) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

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
    }

    return true
  })

  return Router
})
