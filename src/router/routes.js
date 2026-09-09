const routes = [
<<<<<<< HEAD
  // Ruta pública de inicio de sesión
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { titulo: 'Iniciar Sesión', publica: true }
=======
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
>>>>>>> origin/frontend-juanpablo
  },

  // Redirección inicial
  {
    path: '/',
    redirect: '/app/solicitudes'
  },

  // Rutas del aplicativo con MainLayout
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
<<<<<<< HEAD
        redirect: 'solicitudes'
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { titulo: 'Dashboard', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
=======
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { roles: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'] },
>>>>>>> origin/frontend-juanpablo
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/pages/UsuariosPage.vue'),
<<<<<<< HEAD
        meta: { titulo: 'Usuarios', roles: ['ADMINISTRADOR'] }
      },
      {
        path: 'contratistas',
        name: 'contratistas',
        component: () => import('@/pages/ContratistasPage.vue'),
        meta: { titulo: 'Contratistas', roles: ['ADMINISTRADOR', 'SUPERVISOR'] }
=======
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
>>>>>>> origin/frontend-juanpablo
      },
      {
        path: 'dependencias',
        name: 'dependencias',
        component: () => import('@/pages/DependenciasPage.vue'),
<<<<<<< HEAD
        meta: { titulo: 'Dependencias', roles: ['ADMINISTRADOR'] }
=======
        meta: { roles: ['Administrador', 'Supervisor'] },
>>>>>>> origin/frontend-juanpablo
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: () => import('@/pages/SolicitudesPage.vue'),
<<<<<<< HEAD
        meta: { titulo: 'Solicitudes GCCON-F-088', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      },
      {
        path: 'solicitudes/nueva',
        name: 'nueva-solicitud',
        component: () => import('@/pages/NuevaSolicitudPage.vue'),
        meta: { titulo: 'Nueva Solicitud GCCON-F-088', roles: ['ADMINISTRADOR', 'CONTRATISTA'] }
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
        component: () => import('@/pages/FirmasPage.vue'),
        meta: { titulo: 'Gestionar Firmas', roles: ['ADMINISTRADOR', 'SUPERVISOR'] }
=======
        meta: { roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'] },
      },
      {
        path: 'reportes',
        component: () => import('@/pages/ReportesPage.vue'),
        meta: { roles: ['Administrador'] },
>>>>>>> origin/frontend-juanpablo
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('@/pages/PerfilPage.vue'),
<<<<<<< HEAD
        meta: { titulo: 'Perfil', roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'] }
      }
    ]
=======
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
>>>>>>> origin/frontend-juanpablo
  },

  // Captura de rutas no encontradas
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes