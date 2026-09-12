import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, getRol } from '@/services/authService'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'dashboard' }
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue')
      },
      {
        path: 'contratos',
        name: 'contratos',
        component: () => import('@/pages/ContratosPage.vue')
      },
      {
        path: 'contratos/nuevo',
        name: 'contrato-nuevo',
        component: () => import('@/pages/ContratoFormPage.vue'),
        meta: { roles: ['Contratista'] }
      },
      {
        path: 'contratos/:id/editar',
        name: 'contrato-editar',
        component: () => import('@/pages/ContratoFormPage.vue'),
        meta: { roles: ['Contratista'] }
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/pages/UsuariosPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor'] }
      },
      {
        path: 'dependencias',
        name: 'dependencias',
        component: () => import('@/pages/DependenciasPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor'] }
      },
      {
        path: 'firmas',
        name: 'firmas',
        component: () => import('@/pages/FirmasPage.vue'),
        meta: { roles: ['Administrador', 'ResponsableArea'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'dashboard' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const autenticado = isAuthenticated()
  const rol = getRol()

  if (to.meta.requiresAuth && !autenticado) {
    return { name: 'login' }
  }

  if (to.name === 'login' && autenticado) {
    return { name: 'dashboard' }
  }

  if (to.meta.roles && !to.meta.roles.includes(rol)) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
