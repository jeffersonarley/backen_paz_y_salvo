const routes = [
  // Ruta pública de inicio de sesión
  {
    path: '/login',
    component: () => import('@/layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
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
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          titulo: 'Dashboard',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/UsuariosView.vue'),
        meta: { titulo: 'Usuarios', roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'supervisores',
        name: 'supervisores',
        component: () => import('@/views/SupervisoresView.vue'),
        meta: { titulo: 'Supervisores', roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'contratistas',
        name: 'contratistas',
        component: () => import('@/views/ContratistasView.vue'),
        meta: { titulo: 'Contratistas', roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
      },
      {
        path: 'dependencias',
        name: 'dependencias',
        component: () => import('@/views/DependenciasView.vue'),
        meta: { titulo: 'Dependencias', roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: () => import('@/views/SolicitudesView.vue'),
        meta: {
          titulo: 'Solicitudes GCCON-F-088',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'solicitudes/nueva',
        name: 'nueva-solicitud',
        component: () => import('@/views/NuevaSolicitudView.vue'),
        meta: {
          titulo: 'Nueva Solicitud GCCON-F-088',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA'],
        },
      },
      {
        path: 'solicitudes/certificado',
        name: 'certificado-pdf',
        component: () => import('@/views/CertificadoPdfView.vue'),
        meta: {
          titulo: 'Certificado GCCON-F-088',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'firmas',
        name: 'firmas',
        component: () => import('@/views/FirmasView.vue'),
        meta: {
          titulo: 'Gestionar Firmas',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'RESPONSABLE_AREA'],
        },
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('@/views/PerfilView.vue'),
        meta: {
          titulo: 'Perfil',
          roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
        },
      },
    ],
  },

  // Captura de rutas no encontradas
  {
    path: '/app/no-permisos',
    name: 'no-permisos',
    component: () => import('@/views/NoPermisosView.vue'),
    meta: { titulo: 'Sin permisos' },
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

export default routes
