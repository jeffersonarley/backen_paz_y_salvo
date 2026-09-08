const routes = [
  // Redirección inicial a solicitudes
  {
    path: '/',
    redirect: '/app/solicitudes'
  },
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'solicitudes'
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'), // Ajusta la ruta a tu página de Dashboard
        meta: { titulo: 'Dashboard', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/pages/UsuariosPage.vue'), // Ajusta la ruta a tu página de Usuarios
        meta: { titulo: 'Usuarios', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'contratistas',
        name: 'contratistas',
        component: () => import('@/pages/ContratistasPage.vue'), // Ajusta la ruta a tu página de Contratistas
        meta: { titulo: 'Contratistas', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'dependencias',
        name: 'dependencias',
        component: () => import('@/pages/DependenciasPage.vue'), // Ajusta la ruta a tu página de Dependencias
        meta: { titulo: 'Dependencias', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: () => import('@/pages/SolicitudesPage.vue'),
        meta: { titulo: 'Solicitudes GCCON-F-088', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'solicitudes/certificado',
        name: 'certificado-pdf',
        component: () => import('@/pages/CertificadoPdfPage.vue'),
        meta: { titulo: 'Certificado GCCON-F-088', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'firmas',
        name: 'firmas',
        component: () => import('@/pages/FirmasPage.vue'), // Ajusta la ruta a tu página de Firmas
        meta: { titulo: 'Firmas', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('@/pages/PerfilPage.vue'), // Ajusta la ruta a tu página de Perfil
        meta: { titulo: 'Perfil', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      }
    ]
  },

  // Captura de rutas no encontradas
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes