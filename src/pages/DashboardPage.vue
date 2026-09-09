<template>
  <q-page class="q-pa-lg">
<<<<<<< HEAD
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">
          👋 Bienvenido
        </div>
        <div class="text-h6 q-mt-xs">
          Sistema GCCON-F-088
        </div>
        <div class="text-subtitle2 text-grey-8">
          Paz y Salvo Contractual
        </div>
        <div class="text-caption text-grey-6 text-capitalize q-mt-xs">
          {{ fechaActual }}
        </div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Nueva Solicitud"
        unelevated
        :to="{ name: 'solicitudes' }"
      />
=======
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-grey-9">
          Bienvenido, {{ auth.nombre || 'Usuario' }}
        </div>
        <div class="text-subtitle1 text-grey-6">
          Resumen del sistema
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-icon name="person" size="34px" color="grey-7" />
        <span class="text-body1 text-grey-8">{{ auth.rol }}</span>
      </div>
    </div>

    <EstadoPantalla
      v-if="error"
      tipo="error"
      titulo="No se pudo cargar la información del dashboard"
      mensaje="Por favor, intente nuevamente más tarde."
      boton="Reintentar"
      :boton-accion="cargar"
    />

    <template v-else>
    <div class="row q-col-gutter-lg q-mb-xl">
      <div v-for="card in tarjetas" :key="card.titulo" class="col-12 col-sm-6 col-md-3">
        <DashboardCard
          :titulo="card.titulo"
          :cantidad="card.cantidad"
          :icono="card.icono"
          :color="card.color"
        />
      </div>
>>>>>>> origin/frontend-juanpablo
    </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="row q-col-gutter-lg">
<<<<<<< HEAD
      <div class="col-12 col-sm-6 col-md-3">
        <DashboardCard
          titulo="Usuarios"
          :cantidad="totalUsuarios"
          icono="groups"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <DashboardCard
          titulo="Contratistas"
          :cantidad="totalContratistas"
          icono="badge"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <DashboardCard
          titulo="Dependencias"
          :cantidad="totalDependencias"
          icono="business"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <DashboardCard
          titulo="Firmas Pendientes"
          :cantidad="totalFirmas"
          icono="draw"
        />
      </div>
    </div>

    <!-- Actividad Reciente -->
    <div class="q-mt-xl">
      <q-card flat bordered class="shadow-1">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-weight-bold text-grey-9">
            Actividad Reciente
          </div>
          <q-btn
            flat
            dense
            color="primary"
            label="Ver todas"
            :to="{ name: 'solicitudes' }"
          />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-if="actividades.length === 0" class="text-grey text-center q-py-lg">
            <q-icon name="assignment_late" size="48px" class="q-mb-sm" />
            <div>No existen solicitudes registradas por el momento.</div>
          </div>

          <q-list v-else separator>
            <q-item v-for="item in actividades" :key="item.id">
              <q-item-section avatar>
                <q-avatar icon="description" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">{{ item.contratista }}</q-item-label>
                <q-item-label caption>{{ item.dependencia }} — {{ item.fecha }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-chip
                  :color="item.estado === 'Aprobado' ? 'positive' : 'warning'"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ item.estado }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
=======
      <div class="col-12 col-md-7">
        <q-card flat bordered class="bg-white">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">Supervisores recientes</div>
            <q-btn flat no-caps color="primary" label="Ver todo" @click="router.push('/app/usuarios')" />
          </q-card-section>
          <q-card-section>
            <q-table
              :rows="supervisoresRecientes"
              :columns="colsSupervisores"
              row-key="id"
              flat
              hide-bottom
              :loading="cargando"
              no-data-label="Sin registros"
            >
              <template #body-cell-estado="props">
                <q-td :props="props">
                  <q-badge
                    class="q-px-sm"
                    :color="props.row.activo ? 'green-1' : 'red-1'"
                    :text-color="props.row.activo ? 'green-9' : 'red-8'"
                  >
                    {{ props.row.activo ? 'Activo' : 'Inactivo' }}
                  </q-badge>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-5">
        <q-card flat bordered class="bg-white">
          <q-card-section class="text-h6">Actividad del sistema</q-card-section>
          <q-card-section class="q-pt-none">
            <q-list v-if="actividad.length">
              <q-item v-for="(item, i) in actividad" :key="i">
                <q-item-section avatar>
                  <q-icon :name="item.icono || 'hexagon'" color="primary" size="28px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.titulo }}</q-item-label>
                  <q-item-label caption>{{ item.subtitulo }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <span class="text-caption text-grey-6">{{ item.cuando }}</span>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-grey-6 q-mt-md">
              No se han registrado acciones todavía.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    </template>
>>>>>>> origin/frontend-juanpablo
  </q-page>
</template>

<script setup>
<<<<<<< HEAD
import { ref, computed } from 'vue'
=======
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
>>>>>>> origin/frontend-juanpablo
import DashboardCard from '../components/DashboardCard.vue'
import EstadoPantalla from '../components/EstadoPantalla.vue'
import { useAuthStore } from '../stores/authStore'

<<<<<<< HEAD
// Contadores
const totalUsuarios = ref(0)
const totalContratistas = ref(0)
const totalDependencias = ref(0)
const totalFirmas = ref(0)

// Lista de actividades de ejemplo (inicialmente vacía)
const actividades = ref([])

// Formato de Fecha
const fecha = new Date()
const fechaFormateada = fecha.toLocaleDateString('es-CO', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const fechaActual = computed(() => {
  return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)
})
</script>
=======
const router = useRouter()
const auth = useAuthStore()
const cargando = ref(false)
const error = ref(false)

const usuarios = ref([])
const dependencias = ref([])
const contratos = ref([])
const firmasPendientes = ref([])

const colsSupervisores = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'fecha', label: 'Fecha', field: 'fecha', align: 'left' }
]

const supervisoresRecientes = computed(() =>
  usuarios.value
    .filter((u) => u.rol === 'Supervisor')
    .slice(0, 5)
    .map((u) => ({
      id: u._id,
      nombre: u.nombre_completo,
      correo: u.correo_institucional,
      activo: u.activo !== false,
      fecha: u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'
    }))
)

const tarjetas = computed(() => {
  const rol = auth.rol
  if (rol === 'Supervisor') {
    return [
      { titulo: 'Contratistas registrados', cantidad: contarRol('Contratista'), icono: 'badge', color: 'green' },
      { titulo: 'Solicitudes creadas', cantidad: contratos.value.length, icono: 'assignment', color: 'yellow' },
      { titulo: 'Firmas pendientes', cantidad: contarEstado('Pendiente de Firmas'), icono: 'draw', color: 'blue' },
      { titulo: 'Observaciones pendientes', cantidad: contarEstado('EnProceso'), icono: 'visibility', color: 'orange' }
    ]
  }
  if (rol === 'ResponsableArea') {
    return [
      { titulo: 'Solicitudes asignadas', cantidad: firmasPendientes.value.length, icono: 'assignment', color: 'green' },
      { titulo: 'Firmas pendientes', cantidad: firmasPendientes.value.length, icono: 'draw', color: 'yellow' },
      { titulo: 'Contratos relacionados', cantidad: contratos.value.length, icono: 'description', color: 'blue' },
      { titulo: 'Observaciones', cantidad: contarEstado('Rechazado'), icono: 'report_problem', color: 'orange' }
    ]
  }
  if (rol === 'Contratista') {
    return [
      { titulo: 'Mis solicitudes', cantidad: contratos.value.length, icono: 'assignment', color: 'green' },
      { titulo: 'En proceso', cantidad: contarEstado('EnProceso'), icono: 'hourglass', color: 'yellow' },
      { titulo: 'Pendiente de firmas', cantidad: contarEstado('Pendiente de Firmas'), icono: 'draw', color: 'blue' },
      { titulo: 'Finalizadas', cantidad: contarEstado('Finalizado'), icono: 'check_circle', color: 'orange' }
    ]
  }
  return [
    { titulo: 'Supervisores registrados', cantidad: contarRol('Supervisor'), icono: 'supervised_user_circle', color: 'green' },
    { titulo: 'Usuarios activos', cantidad: usuarios.value.filter((u) => u.activo !== false).length, icono: 'group', color: 'yellow' },
    { titulo: 'Roles configurados', cantidad: new Set(usuarios.value.map((u) => u.rol)).size, icono: 'admin_panel_settings', color: 'blue' },
    { titulo: 'Dependencias activas', cantidad: dependencias.value.filter((d) => d.activo !== false).length, icono: 'business', color: 'green' }
  ]
})

const actividad = computed(() => {
  const items = []
  const recientesUsuarios = usuarios.value.slice(0, 5)
  recientesUsuarios.forEach((u) => {
    items.push({
      icono: 'person_add',
      titulo: 'Nuevo usuario creado',
      subtitulo: u.correo_institucional,
      cuando: hace(u.createdAt)
    })
  })
  const recientesContratos = contratos.value.slice(0, 3)
  recientesContratos.forEach((c) => {
    items.push({
      icono: 'description',
      titulo: 'Solicitud de contrato',
      subtitulo: c.numero_contrato || c.numero || '—',
      cuando: hace(c.createdAt)
    })
  })
  return items.filter((i) => i.cuando !== '—').slice(0, 6)
})

function contarRol(rol) {
  return usuarios.value.filter((u) => u.rol === rol).length
}

function contarEstado(estado) {
  return contratos.value.filter((c) => c.estado === estado).length
}

function hace(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const dif = Date.now() - d.getTime()
  if (Number.isNaN(dif)) return '—'
  const min = Math.floor(dif / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  return `hace ${dias} d`
}

async function cargar() {
  cargando.value = true
  error.value = false
  const rol = auth.rol
  const tareas = []
  let fallo = false

  if (['Administrador', 'Supervisor'].includes(rol)) {
    tareas.push(api.get('/api/usuarios').then((r) => (usuarios.value = r.data)).catch(() => { fallo = true }))
  }
  if (['Administrador', 'Supervisor'].includes(rol)) {
    tareas.push(api.get('/api/dependencias').then((r) => (dependencias.value = r.data)).catch(() => { fallo = true }))
  }
  if (['Administrador', 'Supervisor', 'ResponsableArea'].includes(rol)) {
    tareas.push(api.get('/api/contratos').then((r) => (contratos.value = r.data)).catch(() => { fallo = true }))
  }
  if (rol === 'Contratista') {
    tareas.push(api.get('/api/contratos/mis-solicitudes').then((r) => (contratos.value = r.data)).catch(() => { fallo = true }))
  }
  if (['Administrador', 'ResponsableArea'].includes(rol)) {
    tareas.push(api.get('/api/firmas/pendientes').then((r) => (firmasPendientes.value = r.data)).catch(() => { fallo = true }))
  }

  await Promise.all(tareas)
  error.value = fallo
  cargando.value = false
}

onMounted(cargar)
</script>
>>>>>>> origin/frontend-juanpablo
