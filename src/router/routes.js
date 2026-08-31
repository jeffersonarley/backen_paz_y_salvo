const routes = [
  // LOGIN / RECUPERACIÓN
  {
    path: '/',
    component: () => import('@/layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/LoginPage.vue'),
      },
      {
        path: 'recuperar',
        component: () => import('@/pages/RecuperarPage.vue'),
      },
    ],
  },

  {
    path: '/sesion',
    component: () => import('@/pages/SesionExpiradaPage.vue'),
  },

  // SISTEMA
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'] },
      },
      {
        path: 'usuarios',
        component: () => import('@/pages/UsuariosPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor'] },
      },
      {
        path: 'supervisores',
        component: () => import('@/pages/SupervisoresPage.vue'),
        meta: { roles: ['Administrador'] },
      },
      {
        path: 'contratistas',
        component: () => import('@/pages/ContratistasPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor'] },
      },
      {
        path: 'contratos',
        component: () => import('@/pages/ContratosPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor', 'Contratista'] },
      },
      {
        path: 'dependencias',
        component: () => import('@/pages/DependenciasPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor'] },
      },
      {
        path: 'solicitudes',
        component: () => import('@/pages/SolicitudesPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'] },
      },
      {
        path: 'reportes',
        component: () => import('@/pages/ReportesPage.vue'),
        meta: { roles: ['Administrador'] },
      },
      {
        path: 'perfil',
        component: () => import('@/pages/PerfilPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'] },
      },
      {
        path: 'notificaciones',
        component: () => import('@/pages/NotificacionesPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'] },
      },
      {
        path: 'sinpermisos',
        component: () => import('@/pages/NoPermisosPage.vue'),
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
