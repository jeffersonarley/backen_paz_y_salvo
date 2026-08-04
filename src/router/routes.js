const routes = [
  // LOGIN
 {
  path: '/',
  component: () => import('@/layouts/LoginLayout.vue'),
  children: [
    {
      path: '',
      component: () => import('@/pages/LoginPage.vue'),
    },
  ],
},

  // SISTEMA
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/DashboardPage.vue'),
      },

      {
        path: 'usuarios',
        component: () => import('@/pages/UsuariosPage.vue'),
      },

      {
        path: 'contratistas',
        component: () => import('@/pages/ContratistasPage.vue'),
      },

      {
        path: 'supervisores',
        component: () => import('@/pages/SupervisoresPage.vue'),
      },

      {
        path: 'dependencias',
        component: () => import('@/pages/DependenciasPage.vue'),
      },

      {
        path: 'solicitudes',
        component: () => import('@/pages/SolicitudesPage.vue'),
      },

      {
        path: 'firmas',
        component: () => import('@/pages/FirmasPage.vue'),
      },

      {
        path: 'perfil',
        component: () => import('@/pages/PerfilPage.vue'),
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
