<template>
  <q-page class="q-pa-lg">
<<<<<<< HEAD
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Aprobaciones y Firmas</div>
        <div class="text-subtitle2 text-grey-7">
          Certificado GCCON-F-088 — Solicitud: {{ codigoSolicitud || 'No especificada' }}
        </div>
      </div>

      <div class="q-gutter-sm">
        <q-btn
          outline
          color="primary"
          icon="arrow_back"
          label="Volver a Solicitudes"
          @click="router.push({ name: 'solicitudes' })"
        />
        <q-btn
          color="red-7"
          icon="picture_as_pdf"
          label="Descargar / Imprimir PDF"
          unelevated
          :disable="!solicitudActual"
          @click="imprimirCertificado"
        />
      </div>
    </div>

    <!-- Si no existe la solicitud -->
    <q-banner v-if="!solicitudActual" class="bg-warning text-white rounded-borders q-mb-md">
      No se encontró información registrada para el código de solicitud: <strong>{{ codigoSolicitud }}</strong>.
    </q-banner>

    <!-- Detalle de la Solicitud y Certificado -->
    <div v-else class="row q-col-gutter-md">
      <!-- Tarjeta Información del Paz y Salvo -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="q-pa-md">
          <q-card-section>
            <div class="text-h6 text-secondary text-weight-bold q-mb-md">
              FORMATO GCCON-F-088 - PAZ Y SALVO CONTRACTUAL
            </div>
            <q-separator class="q-mb-md" />

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <strong>Número de Solicitud:</strong> {{ solicitudActual.numeroSolicitud || solicitudActual.solicitud || solicitudActual.codigo || 'N/A' }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Número de Contrato:</strong> {{ solicitudActual.numeroContrato || solicitudActual.contrato }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Contratista:</strong> {{ solicitudActual.contratista || solicitudActual.nombreContratista || 'No registrado' }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Dependencia:</strong> {{ solicitudActual.dependencia || solicitudActual.nombreDependencia || 'No registrada' }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Responsable de Área:</strong> {{ solicitudActual.responsable || solicitudActual.supervisor || 'No asignado' }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Fecha:</strong> {{ solicitudActual.fecha }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Estado Actual:</strong> 
                <q-badge color="primary" class="q-ml-xs">{{ solicitudActual.estado || 'En Trámite' }}</q-badge>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tarjeta Gestión de Firmas -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <q-card-section>
            <div class="text-h6 text-primary text-weight-bold">Estado de Firmas</div>
            <div class="text-caption text-grey-7 q-mb-sm">Aprobación por responsables de área</div>
            <q-separator class="q-mb-md" />

            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">Supervisor de Contrato</q-item-label>
                  <q-item-label caption>Aprobado</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="pending" color="warning" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">Responsable de Dependencia</q-item-label>
                  <q-item-label caption>Pendiente de firma</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <div class="q-mt-lg row justify-end">
              <q-btn
                color="positive"
                icon="draw"
                label="Firmar Certificado"
                unelevated
                class="full-width"
                @click="aprobarYFirmar"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
=======

    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-grey-9">
          Solicitudes pendientes de firmar
        </div>
        <div class="text-subtitle1 text-grey-6">
          Revise y firme las solicitudes asignadas
        </div>
      </div>

      <q-btn
        color="primary"
        outline
        icon="refresh"
        label="Actualizar"
        @click="cargarTodo"
      />
    </div>

    <q-banner
      v-if="bannerMsj"
      class="q-mb-md"
      :class="bannerTipo === 'error' ? 'bg-red-1 text-red-9' : 'bg-green-1 text-green-8'"
      dense
    >
      <q-icon :name="bannerTipo === 'error' ? 'report_problem' : 'check_circle'" size="sm" class="q-mr-sm" />
      {{ bannerMsj }}
      <template #action>
        <q-btn flat dense color="grey" icon="close" size="sm" @click="bannerMsj = ''" />
      </template>
    </q-banner>

    <q-tabs
      v-model="tab"
      dense
      class="bg-white q-mb-md rounded-borders"
      active-color="primary"
      indicator-color="primary"
      align="left"
      no-caps
    >
      <q-tab name="pendientes" label="Pendientes" />
      <q-tab name="historial" label="Historial" />
    </q-tabs>

    <q-card flat bordered class="q-pa-md bg-white">
      <div class="row q-mb-md">
        <q-input
          v-model="filtro"
          outlined
          dense
          clearable
          style="width:340px"
          placeholder="Buscar solicitud..."
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <q-table
        v-if="tab === 'pendientes'"
        :rows="rowsPendientes"
        :columns="columns"
        :filter="filtro"
        row-key="id"
        flat
        bordered
        :loading="cargando"
        no-data-label="No hay solicitudes pendientes para su área."
        hide-bottom
      >
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge
              class="q-px-sm"
              :color="badgeColor(props.row.estado)"
              :text-color="badgeText(props.row.estado)"
            >
              {{ props.row.estado }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props">
            <div class="row q-gutter-sm">
              <q-btn outline no-caps unelevated size="sm" label="Ver PDF" @click="verPdf(props.row)" />
              <q-btn no-caps unelevated size="sm" color="primary" label="Firmar" @click="abrirFirma(props.row)" />
              <q-btn outline no-caps unelevated size="sm" label="Observaciones" @click="abrirRechazo(props.row)" />
            </div>
          </q-td>
        </template>
      </q-table>

      <q-table
        v-else
        :rows="rowsHistorial"
        :columns="columnsHistorial"
        :filter="filtro"
        row-key="id"
        flat
        bordered
        :loading="cargando"
        no-data-label="No hay solicitudes gestionadas todavía."
        hide-bottom
      >
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge
              class="q-px-sm"
              :color="badgeColor(props.row.estado)"
              :text-color="badgeText(props.row.estado)"
            >
              {{ props.row.estado }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-observacion="props">
          <q-td :props="props">
            {{ props.row.observacion || '—' }}
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props">
            <div class="row q-gutter-sm">
              <q-btn outline no-caps unelevated size="sm" label="Ver PDF" @click="verPdf(props.row)" />
              <q-btn no-caps unelevated size="sm" color="positive" label="Descargar PDF" :disable="props.row.estado !== 'Finalizado'" @click="descargarPdf(props.row.contratoId)" />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Diálogo: cargar firma electrónica -->
    <q-dialog v-model="dialogoFirma">
      <q-card style="min-width:480px; max-width:520px">
        <q-card-section>
          <div class="text-h6 text-primary">
            Firmar solicitud
          </div>
          <div class="text-caption text-grey-7">
            {{ seleccionado?.numero }} - {{ seleccionado?.contratista }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-banner class="bg-info text-white q-mb-md" dense>
            <div class="text-body2">
              <q-icon name="info" size="sm" class="q-mr-sm" />
              La firma se utilizará <strong>únicamente</strong> para generar el documento PDF
              GCCON-F-088 y <strong>no será almacenada permanentemente</strong> en la base de datos.
            </div>
          </q-banner>

          <FirmaCanvas ref="canvasRef" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup @click="dialogoFirma = false" />
          <q-btn color="primary" label="Confirmar firma" :loading="procesando" @click="confirmarFirma" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo: registrar observación -->
    <q-dialog v-model="dialogoRechazo">
      <q-card style="min-width:480px">
        <q-card-section>
          <div class="text-h6">
            Registrar Observación
          </div>
        </q-card-section>

        <q-card-section>
          <div class="campo">
            <label>Solicitud</label>
            <q-input outlined dense readonly :model-value="seleccionado?.numero || '—'" bg-color="grey-2" />
          </div>
          <div class="campo">
            <label>Dependencia</label>
            <q-input outlined dense readonly :model-value="seleccionado?.area || '—'" bg-color="grey-2" />
          </div>
          <div class="campo">
            <label>Observación</label>
            <q-input
              outlined
              type="textarea"
              v-model="observacionRechazo"
              autogrow
              :disable="procesando"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup @click="dialogoRechazo = false" />
          <q-btn color="primary" label="Guardar Observación" :loading="procesando" @click="confirmarRechazo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Vista previa PDF -->
    <FirmaPdfPreview
      v-model="mostrarPdf"
      :item="seleccionado"
      :pdf-url="pdfUrl"
    />

>>>>>>> origin/frontend-juanpablo
  </q-page>
</template>

<script setup>
<<<<<<< HEAD
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useSolicitudesStore } from '../stores/useSolicitudesStore.js'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const store = useSolicitudesStore()

// Obtener el código enviado por query params: /app/firmas?codigo=SOL-2026-001
const codigoSolicitud = computed(() => route.query.codigo)

// Buscar la solicitud en el store comprobando múltiples nombres de propiedad
const solicitudActual = computed(() => {
  if (!codigoSolicitud.value) return null
  return store.solicitudes.find(s => 
    (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) === codigoSolicitud.value
  ) || null
})

async function aprobarYFirmar() {
  if (solicitudActual.value) {
    const idBusqueda = codigoSolicitud.value

    if (typeof store.actualizarSolicitud === 'function') {
      await store.actualizarSolicitud(idBusqueda, {
        ...solicitudActual.value,
        estado: 'Firmado'
      })
    }

    // Actualización reactiva directa en la lista de solicitudes
    if (Array.isArray(store.solicitudes)) {
      const item = store.solicitudes.find(s => 
        (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) === idBusqueda
      )
      if (item) {
        item.estado = 'Firmado'
      }
    }

    $q.notify({
      type: 'positive',
      message: 'Certificado firmado y actualizado a estado "Firmado".'
    })
  }
}

function imprimirCertificado() {
  window.print()
=======
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../services/api'
import FirmaCanvas from '../components/FirmaCanvas.vue'
import FirmaPdfPreview from '../components/FirmaPdfPreview.vue'

const tab = ref('pendientes')
const filtro = ref('')
const cargando = ref(false)
const procesando = ref(false)

const rowsPendientes = ref([])
const rowsHistorial = ref([])

const dialogoFirma = ref(false)
const dialogoRechazo = ref(false)
const observacionRechazo = ref('')

const mostrarPdf = ref(false)
const pdfUrl = ref('')

const canvasRef = ref(null)
const seleccionado = ref(null)
const contratoActualId = ref(null)
const bannerMsj = ref('')
const bannerTipo = ref('success')

const columns = [
  { name: 'numero', label: 'Contrato', field: 'numero', align: 'left', sortable: true },
  { name: 'contratista', label: 'Contratista', field: 'contratista', align: 'left' },
  { name: 'area', label: 'Dependencia', field: 'area', align: 'left' },
  { name: 'fecha', label: 'Fecha de solicitud', field: 'fecha', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

const columnsHistorial = [
  ...columns.slice(0, 4),
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'observacion', label: 'Observación', field: 'observacion', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

onMounted(cargarTodo)
onBeforeUnmount(() => {
  if (pdfUrl.value) window.URL.revokeObjectURL(pdfUrl.value)
})

async function cargarTodo() {
  await Promise.all([cargarPendientes(), cargarHistorial()])
}

async function cargarPendientes() {
  cargando.value = true
  try {
    const { data } = await api.get('/api/firmas/pendientes')
    rowsPendientes.value = data.map(normalizar)
  } catch (error) {
    mostrarBanner(error.mensaje || 'No se pudieron cargar las solicitudes.', 'error')
  } finally {
    cargando.value = false
  }
}

async function cargarHistorial() {
  cargando.value = true
  try {
    const { data } = await api.get('/api/firmas/historial')
    rowsHistorial.value = data.map(normalizar)
  } catch (error) {
    mostrarBanner(error.mensaje || 'No se pudo cargar el historial.', 'error')
  } finally {
    cargando.value = false
  }
}

function normalizar(item) {
  const contrato = item.contrato_id || {}
  const codigo = item.codigo || contrato.numero_contrato || '—'
  return {
    id: item._id,
    contratoId: contrato._id || contrato,
    numero: codigo,
    contratista: contratosNombre(contrato),
    area: item.area_id?.nombre_dependencia || '—',
    fecha: item.fecha_firma || item.createdAt,
    estado: contrato.estado || item.estado || 'Pendiente',
    observacion: item.observacion_rechazo || ''
  }
}

function contratosNombre(contrato) {
  return contrato.nombre_contratista || contrato.nombre_contratante || '—'
}

function badgeColor(estado) {
  switch (estado) {
    case 'Finalizado':
    case 'Aprobado':
      return 'green-1'
    case 'Rechazado':
      return 'red-1'
    case 'Pendiente':
      return 'yellow-1'
    case 'En revision':
      return 'light-blue-1'
    default:
      return 'grey-3'
  }
}

function badgeText(estado) {
  switch (estado) {
    case 'Finalizado':
    case 'Aprobado':
      return 'green-8'
    case 'Rechazado':
      return 'red-8'
    case 'Pendiente':
      return 'yellow-9'
    case 'En revision':
      return 'light-blue-9'
    default:
      return 'grey-8'
  }
}

function mostrarBanner(mensaje, tipo = 'success') {
  bannerMsj.value = mensaje
  bannerTipo.value = tipo
}

function abrirFirma(fila) {
  seleccionado.value = fila
  contratoActualId.value = fila.contratoId
  dialogoFirma.value = true
}

async function confirmarFirma() {
  if (!canvasRef.value) return

  procesando.value = true
  try {
    const dataUrl = canvasRef.value.exportarBase64()
    const firmaBase64 = dataUrl.replace(/^data:image\/png;base64,/, '')

    const { data } = await api.post('/api/firmas/procesar', {
      contratoId: contratoActualId.value,
      accion: 'Aprobar',
      firma_base64: firmaBase64
    })

    mostrarBanner('Firma registrada correctamente')
    dialogoFirma.value = false
    await cargarTodo()

    if (data.pdf_path) {
      tab.value = 'historial'
      await descargarPdf(contratoActualId.value)
    }
  } catch (error) {
    mostrarBanner(error.mensaje || 'No se pudo registrar la firma.', 'error')
  } finally {
    procesando.value = false
  }
}

function abrirRechazo(fila) {
  seleccionado.value = fila
  contratoActualId.value = fila.contratoId
  observacionRechazo.value = ''
  dialogoRechazo.value = true
}

async function confirmarRechazo() {
  if (!observacionRechazo.value.trim()) {
    mostrarBanner('Debe indicar el motivo de la observación.', 'error')
    return
  }

  procesando.value = true
  try {
    await api.post('/api/firmas/procesar', {
      contratoId: contratoActualId.value,
      accion: 'Rechazar',
      observacion_rechazo: observacionRechazo.value.trim()
    })

    mostrarBanner('Observación registrada correctamente')
    dialogoRechazo.value = false
    await cargarTodo()
  } catch (error) {
    mostrarBanner(error.mensaje || 'No se pudo registrar la observación.', 'error')
  } finally {
    procesando.value = false
  }
}

async function descargarPdf(contratoId) {
  if (!contratoId) return
  try {
    const respuesta = await api.get(`/api/firmas/pdf/${contratoId}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(respuesta.data)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `pazysalvo_${contratoId}.pdf`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    mostrarBanner(error.mensaje || 'No se pudo descargar el documento PDF.', 'error')
  }
}

async function verPdf(fila) {
  seleccionado.value = fila
  if (pdfUrl.value) {
    window.URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = ''
  }
  if (fila.estado === 'Finalizado') {
    try {
      const respuesta = await api.get(`/api/firmas/pdf/${fila.contratoId}`, { responseType: 'blob' })
      pdfUrl.value = window.URL.createObjectURL(respuesta.data)
    } catch (error) {
      mostrarBanner(error.mensaje || 'No se pudo cargar el PDF.', 'error')
    }
  }
  mostrarPdf.value = true
>>>>>>> origin/frontend-juanpablo
}
</script>

<style scoped>
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
