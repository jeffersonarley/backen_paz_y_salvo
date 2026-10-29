const routes = [
  // Ruta pública de inicio de sesión
  {
    path: '/login',
    component: () => import('@/layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/LoginPage.vue'),
        meta: { titulo: 'Iniciar Sesión', publica: true },
      },
    ],
  },

  // Redirección inicial: siempre debe arrancar en el login
  {
    path: '/',
    redirect: '/login',
  },

  {
    path: '/solicitudes',
    redirect: '/app/solicitudes',
  },
  {
    path: '/solicitudes/certificado',
    redirect: (to) => ({ path: '/app/solicitudes/certificado', query: to.query }),
  },
  {
    path: '/certificado',
    redirect: (to) => ({ path: '/app/solicitudes/certificado', query: to.query }),
  },

  // Rutas del aplicativo con MainLayout
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'solicitudes',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardPage.vue'),
        meta: {
          titulo: 'Dashboard',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/UsuariosPage.vue'),
        meta: { titulo: 'Usuarios', roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'supervisores',
        name: 'supervisores',
        component: () => import('@/views/SupervisoresPage.vue'),
        meta: { titulo: 'Supervisores', roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'contratistas',
        name: 'contratistas',
        component: () => import('@/views/ContratistasPage.vue'),
        meta: { titulo: 'Contratistas', roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
      },
      {
        path: 'dependencias',
        name: 'dependencias',
        component: () => import('@/views/DependenciasPage.vue'),
        meta: { titulo: 'Dependencias', roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
      },
      {
        path: 'plantillas',
        name: 'plantillas',
        component: () => import('@/views/PlantillasPage.vue'),
        meta: { titulo: 'Plantillas y Firmantes', roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: () => import('@/views/SolicitudesPage.vue'),
        meta: {
          titulo: 'Solicitudes GCCON-F-088',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'solicitudes/nueva',
        name: 'nueva-solicitud',
        component: () => import('@/views/NuevaSolicitudPage.vue'),
        meta: {
          titulo: 'Nueva Solicitud GCCON-F-088',
          roles: ['CONTRATISTA'],
        },
      },
      {
        path: 'solicitudes/certificado',
        name: 'certificado-pdf',
        component: () => import('@/views/CertificadoPdfPage.vue'),
        meta: {
          titulo: 'Certificado GCCON-F-088',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'firmas',
        name: 'firmas',
        component: () => import('@/views/FirmasPage.vue'),
        meta: {
          titulo: 'Gestionar Firmas',
          roles: ['RESPONSABLE_AREA'],
        },
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('@/views/PerfilPage.vue'),
        meta: {
          titulo: 'Perfil',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'reportes',
        name: 'reportes',
        component: () => import('@/views/ReportesPage.vue'),
        meta: {
          titulo: 'Reportes y Métricas',
          roles: ['ADMINISTRADOR', 'SUPERVISOR'],
        },
      },
      {
        path: 'notificaciones',
        name: 'notificaciones',
        component: () => import('@/views/NotificacionesPage.vue'),
        meta: {
          titulo: 'Notificaciones',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      // Trazabilidad del sistema (Admin)
      {
        path: 'auditoria',
        name: 'auditoria',
        component: () => import('@/views/AuditoriaPage.vue'),
        meta: {
          titulo: 'Auditoría del Sistema',
          roles: ['ADMINISTRADOR'],
        },
      },
    ],
  },

  // Ruta pública para recuperar contraseña
  {
    path: '/recuperar',
    name: 'recuperar',
    component: () => import('@/views/RecuperarPage.vue'),
    meta: { titulo: 'Recuperar Contraseña', publica: true },
  },

  // Ruta pública para restablecer contraseña con token
  {
    path: '/restablecer',
    name: 'restablecer',
    component: () => import('@/views/RestablecerPage.vue'),
    meta: { titulo: 'Restablecer Contraseña', publica: true },
  },

  // Captura de rutas no encontradas
  {
    path: '/app/no-permisos',
    name: 'no-permisos',
    component: () => import('@/views/NoPermisosPage.vue'),
    meta: { titulo: 'Sin permisos' },
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/views/ErrorNotFound.vue'),
  },
]

export default routes
