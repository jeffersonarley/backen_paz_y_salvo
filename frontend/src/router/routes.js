const routes = [
  // Ruta pública de inicio de sesión
  {
    path: '/login',
    component: () => import('@/layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/pages/LoginPage.vue'),
        meta: { titulo: 'Iniciar Sesión', publica: true },
      },
    ],
  },

  // Redirección inicial: siempre debe arrancar en el login
  {
    path: '/',
    redirect: '/login',
  },

  // Rutas del aplicativo con MainLayout
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'solicitudes',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: {
          titulo: 'Dashboard',
          roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'],
        },
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/pages/UsuariosPage.vue'),
        meta: { titulo: 'Usuarios', roles: ['Administrador'] },
      },
      {
        path: 'supervisores',
        name: 'supervisores',
        component: () => import('@/pages/SupervisoresPage.vue'),
        meta: { titulo: 'Supervisores', roles: ['Administrador'] },
      },
      {
        path: 'contratistas',
        name: 'contratistas',
        component: () => import('@/pages/ContratistasPage.vue'),
        meta: { titulo: 'Contratistas', roles: ['Administrador', 'Supervisor'] },
      },
      {
        path: 'dependencias',
        name: 'dependencias',
        component: () => import('@/pages/DependenciasPage.vue'),
        meta: { titulo: 'Dependencias', roles: ['Administrador', 'Supervisor'] },
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: () => import('@/pages/SolicitudesPage.vue'),
        meta: {
          titulo: 'Solicitudes GCCON-F-088',
          roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'],
        },
      },
      {
        path: 'solicitudes/nueva',
        name: 'nueva-solicitud',
        component: () => import('@/pages/NuevaSolicitudPage.vue'),
        meta: {
          titulo: 'Nueva Solicitud GCCON-F-088',
          roles: ['Administrador', 'Supervisor', 'Contratista'],
        },
      },
      {
        path: 'solicitudes/certificado',
        name: 'certificado-pdf',
        component: () => import('@/pages/CertificadoPdfPage.vue'),
        meta: {
          titulo: 'Certificado GCCON-F-088',
          roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'],
        },
      },
      {
        path: 'firmas',
        name: 'firmas',
        component: () => import('@/pages/FirmasPage.vue'),
        meta: {
          titulo: 'Gestionar Firmas',
          roles: ['Administrador', 'Contratista', 'ResponsableArea'],
        },
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('@/pages/PerfilPage.vue'),
        meta: {
          titulo: 'Perfil',
          roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'],
        },
      },
      {
        path: 'reportes',
        name: 'reportes',
        component: () => import('@/pages/ReportesPage.vue'),
        meta: {
          titulo: 'Reportes y Métricas',
          roles: ['Administrador', 'Supervisor'],
        },
      },
      {
        path: 'notificaciones',
        name: 'notificaciones',
        component: () => import('@/pages/NotificacionesPage.vue'),
        meta: {
          titulo: 'Notificaciones',
          roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'],
        },
      },
    ],
  },

  // Ruta pública para recuperar contraseña
  {
    path: '/recuperar',
    name: 'recuperar',
    component: () => import('@/pages/RecuperarPage.vue'),
    meta: { titulo: 'Recuperar Contraseña', publica: true },
  },

  // Captura de rutas no encontradas
  {
    path: '/no-permisos',
    name: 'no-permisos',
    component: () => import('@/pages/NoPermisosPage.vue'),
    meta: { titulo: 'Sin permisos' },
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes