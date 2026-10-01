<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Solicitudes</div>
        <div class="text-subtitle2 text-grey-7">Gestión de formatos GCCON-F-088</div>
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nueva Solicitud"
        unelevated
        @click="nuevaSolicitud"
      />
    </div>

    <!-- Filtro de Búsqueda -->
    <div class="row q-mb-md">
      <q-input
        v-model="filtro"
        outlined
        dense
        clearable
        style="width: 320px"
        placeholder="Buscar solicitud, contrato, contratista..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Tabla de Solicitudes -->
    <q-table
      title="Listado de Solicitudes Paz y Salvo"
      :rows="rows"
      :columns="columns"
      :filter="filtro"
      :filter-method="metodoFiltro"
      row-key="_id"
      flat
      bordered
      :loading="cargando"
      :rows-per-page-options="[10, 25, 50, 0]"
      :pagination="{ rowsPerPage: 25 }"
      no-data-label="No hay solicitudes registradas"
      no-results-label="No se encontraron coincidencias"
    >
      <!-- Badge de Estado -->
      <template #body-cell-estado="props">
        <q-td :props="props" class="text-center">
          <q-badge :color="obtenerColorEstado(props.row.estado)" class="q-pa-xs text-weight-bold">
            {{ props.row.estado || 'Pendiente' }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-cadena="props">
        <q-td :props="props">
          <q-expansion-item
            dense
            dense-toggle
            icon="account_tree"
            label="Ver cadena"
            header-class="text-primary"
          >
            <q-list v-if="props.row.firmas.length" dense separator>
              <q-item v-for="firma in props.row.firmas" :key="firma._id">
                <q-item-section avatar>
                  <q-icon
                    :name="iconoEstadoFirma(firma.estado)"
                    :color="colorEstadoFirma(firma.estado)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ firma.area }}</q-item-label>
                  <q-item-label caption>
                    <q-badge :color="colorEstadoFirma(firma.estado)" class="q-mr-xs">
                      {{ firma.estado }}
                    </q-badge>
                    {{ formatoFecha(firma.fecha) }}
                    <span v-if="firma.usuario"> · {{ firma.usuario }}</span>
                  </q-item-label>
                  <q-item-label v-if="firma.observacion" caption class="text-negative">
                    Observación: {{ firma.observacion }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="q-pa-sm text-caption text-grey-7">
              La cadena de firmas aún no ha sido iniciada.
            </div>
          </q-expansion-item>
        </q-td>
      </template>

      <!-- Columna de Acciones -->
      <template #body-cell-acciones="props">
        <q-td :props="props" class="q-gutter-xs text-center">
          <q-btn
            v-if="puedeFirmar && props.row.estadoBackend !== 'Borrador'"
            flat
            round
            dense
            :color="props.row.estado === 'Rechazado' ? 'grey-6' : 'positive'"
            :icon="props.row.estadoBackend === 'Rechazado' ? 'block' : 'draw'"
            @click="irAFirmar(props.row)"
          >
            <q-tooltip>{{
              props.row.estadoBackend === 'Rechazado'
                ? 'Firma bloqueada: Solicitud rechazada por novedades'
                : 'Firmar / Pegar Firma'
            }}</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="red-7"
            icon="picture_as_pdf"
            @click="verCertificado(props.row)"
          >
            <q-tooltip>Ver Certificado PDF</q-tooltip>
          </q-btn>

          <q-btn
            v-if="puedeGestionarEstado"
            flat
            round
            dense
            color="primary"
            icon="visibility"
            @click="verObservaciones(props.row)"
          >
            <q-tooltip>Ver observaciones</q-tooltip>
          </q-btn>

          <q-btn
            v-if="puedeGestionarEstado && props.row.estadoBackend === 'Rechazado'"
            flat
            round
            dense
            color="positive"
            icon="replay"
            @click="abrirDialogoEstado(props.row, 'En revisión')"
          >
            <q-tooltip>Reactivar / Enviar a Revisión</q-tooltip>
          </q-btn>
          <q-btn
            v-else-if="
              puedeGestionarEstado &&
              ['Borrador', 'EnProceso', 'Pendiente de Firmas'].includes(props.row.estadoBackend)
            "
            flat
            round
            dense
            color="negative"
            icon="block"
            @click="abrirDialogoEstado(props.row, 'Rechazado')"
          >
            <q-tooltip>Rechazar y devolver a corrección</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Confirmar Cambio de Estado (Desactivar / Rechazar o Reactivar) -->
    <q-dialog v-model="dialogoEstado" persistent>
      <q-card style="min-width: 420px; max-width: 90vw">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="nuevoEstadoObjetivo === 'Rechazado' ? 'undo' : 'replay'"
            :color="nuevoEstadoObjetivo === 'Rechazado' ? 'negative' : 'positive'"
            text-color="white"
            class="q-mr-sm"
          />
          <span class="text-h6 text-weight-bold">
            {{
              nuevoEstadoObjetivo === 'Rechazado'
                ? 'Devolver solicitud a corrección'
                : 'Reactivar Solicitud'
            }}
          </span>
        </q-card-section>

        <q-card-section class="q-pt-none text-body2">
          <div v-if="nuevoEstadoObjetivo === 'Rechazado'">
            <p>
              ¿Desea devolver a corrección la solicitud
              <strong>{{ solicitudSeleccionada?.numeroSolicitud || solicitudSeleccionada?.numeroContrato }}</strong>?
            </p>
            <p class="text-grey-8">
              El contrato volverá a
              <q-badge color="warning" class="text-weight-bold">Borrador</q-badge>
              para que se corrija antes de una nueva evaluación.
            </p>
            <q-input
              v-model="motivoEstado"
              outlined
              dense
              type="textarea"
              rows="2"
              label="Motivo u observación (opcional)"
              placeholder="Ej: Documentación incompleta o solicitud cancelada"
              class="q-mt-sm"
            />
          </div>
          <div v-else>
            <p>
              ¿Desea reactivar la solicitud
              <strong>{{ solicitudSeleccionada?.numeroSolicitud || solicitudSeleccionada?.numeroContrato }}</strong>?
            </p>
            <p class="text-grey-8">
              Se abrirá una nueva cadena de firmas para todas las áreas activas.
            </p>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            :color="nuevoEstadoObjetivo === 'Rechazado' ? 'negative' : 'positive'"
            :label="nuevoEstadoObjetivo === 'Rechazado' ? 'Devolver a corrección' : 'Reactivar'"
            :loading="procesandoEstado"
            @click="confirmarCambioEstado"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import { evaluarContrato, listarContratos, obtenerObservaciones } from '../services/contratoService.js'
import { getErrorMessage } from '../services/api.js'

const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()

const cargando = ref(false)
const procesandoEstado = ref(false)
const puedeFirmar = computed(() => auth.tienePermiso(['ResponsableArea', 'Administrador']))
const puedeGestionarEstado = computed(() =>
  auth.tienePermiso(['Supervisor', 'Administrador']),
)

const filtro = ref('')
const dialogoEstado = ref(false)

const solicitudSeleccionada = ref(null)
const nuevoEstadoObjetivo = ref('')
const motivoEstado = ref('')

const rows = ref([])

const columns = [
  {
    name: 'numeroSolicitud',
    label: 'Solicitud',
    field: (row) => row.numeroSolicitud || row.solicitud || row.codigo || row.id || 'N/A',
    align: 'left',
    sortable: true,
  },
  {
    name: 'numeroContrato',
    label: 'Contrato',
    field: (row) => row.numeroContrato || row.contrato || 'N/A',
    align: 'left',
    sortable: true,
  },
  {
    name: 'contratista',
    label: 'Contratista',
    field: (row) => row.contratista || row.nombreContratista || 'N/A',
    align: 'left',
    sortable: true,
  },
  {
    name: 'dependencia',
    label: 'Dependencia',
    field: (row) => row.dependencia || row.nombreDependencia || 'N/A',
    align: 'left',
    sortable: true,
  },
  {
    name: 'estado',
    label: 'Estado',
    field: (row) => row.estado || 'Pendiente',
    align: 'center',
    sortable: true,
  },
  { name: 'cadena', label: 'Cadena de firmas', field: 'firmas', align: 'left' },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center',
  },
]

function metodoFiltro(filas, termino) {
  const t = (termino || '').toLowerCase().trim()
  if (!t) return filas
  return filas.filter((r) => {
    const texto = [
      r.numeroSolicitud,
      r.solicitud,
      r.codigo,
      r.id,
      r.numeroContrato,
      r.contrato,
      r.contratista,
      r.nombreContratista,
      r.dependencia,
      r.responsable,
      r.documentoContratista,
      r.estado,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return texto.includes(t)
  })
}

function obtenerColorEstado(estado) {
  switch (estado) {
    case 'Pendiente':
      return 'warning'
    case 'En revisión':
      return 'primary'
    case 'Firmado':
      return 'positive'
    case 'Finalizado':
      return 'teal'
    case 'Rechazado':
      return 'negative'
    default:
      return 'warning'
  }
}

function colorEstadoFirma(estado) {
  if (estado === 'Aprobado') return 'positive'
  if (estado === 'Rechazado') return 'negative'
  if (estado === 'Cancelado') return 'grey-7'
  return 'warning'
}

function iconoEstadoFirma(estado) {
  if (estado === 'Aprobado') return 'check_circle'
  if (estado === 'Rechazado') return 'cancel'
  if (estado === 'Cancelado') return 'block'
  return 'pending'
}

function formatoFecha(fecha) {
  if (!fecha) return 'Pendiente'
  return new Date(fecha).toLocaleDateString()
}

function nuevaSolicitud() {
  router.push({ name: 'nueva-solicitud' })
}

function irAFirmar(row) {
  router.push({ name: 'firmas', query: { codigo: row._id } })
}

function verCertificado(row) {
  router.push({ name: 'certificado-pdf', query: { codigo: row.numeroContrato } })
}

async function verObservaciones(row) {
  try {
    const data = await obtenerObservaciones(row._id)
    const observaciones = [
      data.observaciones_supervisor
        ? `Supervisor: ${data.observaciones_supervisor}`
        : '',
      ...(data.observaciones_areas || []).map(
        (item) => `${item.area}: ${item.observacion}`,
      ),
    ].filter(Boolean)

    $q.dialog({
      title: `Observaciones · ${row.numeroContrato}`,
      message: observaciones.length ? observaciones.join('\n\n') : 'No hay observaciones registradas.',
      ok: { label: 'Cerrar', flat: true },
    })
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error) })
  }
}

function abrirDialogoEstado(row, estadoObjetivo) {
  solicitudSeleccionada.value = row
  nuevoEstadoObjetivo.value = estadoObjetivo
  motivoEstado.value = ''
  dialogoEstado.value = true
}

async function confirmarCambioEstado() {
  if (!puedeGestionarEstado.value || !solicitudSeleccionada.value?._id) return

  procesandoEstado.value = true
  try {
    const aprobado = nuevoEstadoObjetivo.value !== 'Rechazado'
    await evaluarContrato(solicitudSeleccionada.value._id, {
      aprobado,
      observaciones_supervisor: motivoEstado.value.trim(),
    })
    dialogoEstado.value = false
    $q.notify({
      type: aprobado ? 'positive' : 'warning',
      message: aprobado
        ? 'Solicitud reactivada y enviada a la cadena de firmas.'
        : 'Solicitud devuelta a Borrador para corrección.',
    })
    await cargarSolicitudes()
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error) })
  } finally {
    procesandoEstado.value = false
  }
}

async function cargarSolicitudes() {
  cargando.value = true
  try {
    const data = await listarContratos()
    const lista = Array.isArray(data) ? data : data?.contratos || data?.data || []
    // Transformar datos del backend al formato de la tabla
    rows.value = lista.map((c) => {
      const num = c.numero_contrato || '—'
      const nom = c.nombre_contratista || c.usuario?.nombre_completo || '—'
      const dep = c.dependencia?.nombre_dependencia || (typeof c.dependencia === 'string' ? c.dependencia : '—')
      const sup = c.supervisor?.nombre_completo || '—'
      const fch = c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '—'

      let est = 'En revisión'
      if (c.estado === 'Firmado' || c.estado === 'Aprobado') {
        est = 'Firmado'
      } else if (c.estado === 'Finalizado') {
        est = 'Finalizado'
      } else if (c.estado === 'Rechazado') {
        est = 'Rechazado'
      } else if (c.estado === 'Pendiente de Firmas' || c.estado === 'EnProceso') {
        est = 'En revisión'
      } else {
        est = c.estado || '—'
      }

      return {
        _id: c._id,
        id: num,
        numeroSolicitud:
          num === '—' ? '—' : `SOL-${String(num).replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
        documentoContratista: c.telefono || '—',
        contratista: nom,
        nombreContratista: nom,
        numeroContrato: num,
        dependencia: dep,
        responsable: sup,
        fecha: fch,
        fechaSolicitud: fch,
        estado: est,
        estadoBackend: c.estado,
        observacionRechazo: c.observaciones_supervisor || c.observacion_rechazo || '',
        bienes: Array.isArray(c.bienes) ? c.bienes : [],
        firmas: Array.isArray(c.firmas)
          ? c.firmas.map((firma) => ({
              _id: firma._id,
              area: firma.area_id?.nombre_dependencia || 'Área sin nombre',
              estado: firma.estado || 'Pendiente',
              fecha: firma.fecha_firma,
              usuario: firma.usuario_id?.nombre_completo || '',
              observacion: firma.observacion_rechazo || '',
            }))
          : [],
      }
    })
  } catch (err) {
    console.warn('Cargando solicitudes:', err.message)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarSolicitudes()
})

</script>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 14px 18px;
  font-weight: 600;
  margin-bottom: 18px;
}

.banner-exito {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.banner-error {
  background: #fdecea;
  color: #c62828;
  border: 1px solid #f5c6c0;
}

.campo {
  margin-bottom: 16px;
}

.campo label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #444;
  margin-bottom: 6px;
}
</style>
