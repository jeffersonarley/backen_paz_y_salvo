<template>
  <q-page class="q-pa-lg">
<<<<<<< HEAD
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
      row-key="numeroSolicitud"
      flat
      bordered
      no-data-label="No hay solicitudes registradas"
      no-results-label="No se encontraron coincidencias"
    >
      <!-- Badge de Estado -->
      <template #body-cell-estado="props">
        <q-td :props="props" class="text-center">
          <q-badge
            :color="obtenerColorEstado(props.row.estado)"
            class="q-pa-xs text-weight-bold"
          >
            {{ props.row.estado || 'En Trámite' }}
          </q-badge>
        </q-td>
      </template>

      <!-- Columna de Acciones -->
      <template #body-cell-acciones="props">
        <q-td :props="props" class="q-gutter-xs text-center">
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
            flat
            round
            dense
            color="primary"
            icon="edit"
            @click="editarSolicitud(props.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="eliminarSolicitud(props.row)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 550px; max-width: 90vw;">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-primary text-weight-bold">
            {{ editando ? 'Editar Solicitud' : 'Nueva Solicitud' }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cancelar" />
        </q-card-section>

        <q-separator />

        <q-form ref="formRef" @submit.prevent="guardarSolicitud">
          <q-card-section class="q-gutter-y-sm">
            <q-input
              outlined
              dense
              v-model="solicitud.numeroSolicitud"
              label="Número de Solicitud *"
              :disable="editando"
              :rules="[val => !!val || 'El número de solicitud es obligatorio']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.numeroContrato"
              label="Número de Contrato *"
              :rules="[val => !!val || 'El número de contrato es obligatorio']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.contratista"
              label="Contratista *"
              :rules="[val => !!val || 'El nombre del contratista es obligatorio']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.dependencia"
              label="Dependencia *"
              :rules="[val => !!val || 'La dependencia es obligatoria']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.responsable"
              label="Responsable de Área *"
              :rules="[val => !!val || 'El responsable es obligatorio']"
            />

            <q-input
              outlined
              dense
              type="date"
              v-model="solicitud.fecha"
              label="Fecha *"
              stack-label
              :rules="[val => !!val || 'La fecha es obligatoria']"
            />

            <q-select
              outlined
              dense
              v-model="solicitud.estado"
              :options="OPCIONES_ESTADO"
              label="Estado"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancelar"
              color="grey-8"
              @click="cancelar"
            />
            <q-btn
              unelevated
              type="submit"
              color="positive"
              label="Guardar"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo Eliminar -->
    <q-dialog v-model="dialogoEliminar">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" class="q-mr-sm" />
          <span class="text-h6">Confirmar eliminación</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          ¿Está seguro de eliminar esta solicitud? Esta acción no se puede deshacer.
=======
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-grey-9">Solicitudes pendientes de firmar</div>
        <div class="text-subtitle1 text-grey-6">Revise y firme las solicitudes asignadas</div>
      </div>
      <q-btn outline no-caps unelevated color="primary" icon="refresh" label="Actualizar" @click="cargarTodo" />
    </div>

    <div v-if="bannerMsj" class="banner" :class="bannerTipo === 'error' ? 'banner-error' : 'banner-exito'">
      <q-icon :name="bannerTipo === 'error' ? 'report_problem' : 'check_circle'" size="sm" />
      <span>{{ bannerMsj }}</span>
    </div>

    <EstadoCard
      v-if="estadoFirma === 'inconsistencia'"
      titulo="No es posible Realizar la firma."
      mensaje="Se encontraron inconsistencias en el numero de contrato, la dependencia o las obligaciones pendientes"
      icono="warning_amber"
      icono-grande="mark_email_read"
      boton="Registrar observacion"
      :boton-accion="irARegistrarObservacion"
    />

    <EstadoCard
      v-else-if="estadoFirma === 'obligaciones'"
      tipo="error"
      titulo="No se puede firmar."
      mensaje="El contratista tiene obligaciones pendientes por cumplir."
      icono="error"
      boton="Ver obligaciones"
      :boton-accion="irARegistrarObservacion"
    />

    <EstadoCard
      v-else-if="estadoFirma === 'firmada'"
      tipo="info"
      titulo="Esta solicitud ya fue firmada."
      mensaje="No es posible realizar cambios"
      icono="info"
      icono-grande="info"
    />

    <q-btn v-if="estadoFirma" flat no-caps color="grey-7" class="q-mt-md" icon="arrow_back" label="Volver a la lista" @click="estadoFirma = ''" />

    <template v-if="!estadoFirma">
      <q-tabs v-model="tab" dense class="bg-white q-mb-md rounded-borders" active-color="primary" indicator-color="primary" align="left" no-caps>
        <q-tab name="pendientes" label="Pendientes" />
        <q-tab name="historial" label="Historial" />
      </q-tabs>

    <q-card flat bordered class="bg-white q-pa-md">
      <div class="row q-mb-md">
        <q-input v-model="filtro" outlined dense clearable style="width:340px" placeholder="Buscar solicitud...">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <q-table
        v-if="tab === 'pendientes'"
        :rows="rowsPendientes" :columns="columns" :filter="filtro"
        row-key="id" flat bordered :loading="cargando" hide-bottom
      >
        <template #empty>
          <div class="empty-state">
            <q-icon name="error" size="56px" color="deep-orange-8" />
            <div class="empty-titulo">{{ filtro ? 'No se encontró la solicitud buscada.' : 'No hay datos disponibles en este momento.' }}</div>
            <div class="empty-msj">{{ filtro ? 'Verifique el código e intente de nuevo' : 'Por favor, intente más tarde.' }}</div>
            <q-btn no-caps unelevated color="primary" :label="filtro ? 'Volver a intentarlo' : 'Reintentar'" class="q-mt-md" @click="filtro = ''; cargarTodo()" />
          </div>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge class="q-px-sm" :color="badgeColor(props.row.estado)" :text-color="badgeText(props.row.estado)">{{ props.row.estado }}</q-badge>
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
        :rows="rowsHistorial" :columns="columnsHistorial" :filter="filtro"
        row-key="id" flat bordered :loading="cargando" hide-bottom
      >
        <template #empty>
          <div class="empty-state">
            <q-icon name="error" size="56px" color="deep-orange-8" />
            <div class="empty-titulo">No hay datos disponibles en este momento.</div>
            <div class="empty-msj">Por favor, intente más tarde.</div>
            <q-btn no-caps unelevated color="primary" label="Reintentar" class="q-mt-md" @click="cargarTodo()" />
          </div>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge class="q-px-sm" :color="badgeColor(props.row.estado)" :text-color="badgeText(props.row.estado)">{{ props.row.estado }}</q-badge>
          </q-td>
        </template>
        <template #body-cell-observacion="props">
          <q-td :props="props">{{ props.row.observacion || '—' }}</q-td>
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
    </template>

    <q-dialog v-model="dialogoFirma">
      <q-card style="min-width:480px; max-width:520px">
        <q-card-section>
          <div class="text-h6 text-primary">Firmar solicitud</div>
          <div class="text-caption text-grey-7">{{ seleccionado?.numero }} - {{ seleccionado?.contratista }}</div>
        </q-card-section>
        <q-card-section>
          <q-banner class="bg-info text-white q-mb-md" dense>
            <div class="text-body2">
              <q-icon name="info" size="sm" class="q-mr-sm" />
              La firma se utilizará <strong>únicamente</strong> para generar el documento PDF GCCON-F-088 y
              <strong>no será almacenada permanentemente</strong> en la base de datos.
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

    <q-dialog v-model="dialogoRechazo">
      <q-card style="min-width:480px">
        <q-card-section>
          <div class="text-h6">Registrar Observación</div>
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
            <q-input outlined type="textarea" v-model="observacionRechazo" autogrow :disable="procesando" />
          </div>
>>>>>>> origin/frontend-juanpablo
        </q-card-section>
        <q-card-actions align="right">
<<<<<<< HEAD
          <q-btn
            flat
            label="Cancelar"
            color="grey-8"
            v-close-popup
          />
          <q-btn
            unelevated
            color="negative"
            label="Eliminar"
            @click="confirmarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
=======
          <q-btn flat label="Cancelar" color="grey" v-close-popup @click="dialogoRechazo = false" />
          <q-btn color="primary" label="Guardar Observación" :loading="procesando" @click="confirmarRechazo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <FirmaPdfPreview v-model="mostrarPdf" :item="seleccionado" :pdf-url="pdfUrl" />
>>>>>>> origin/frontend-juanpablo
  </q-page>
</template>

<script setup>
<<<<<<< HEAD
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useSolicitudesStore } from '../stores/useSolicitudesStore.js'

const $q = useQuasar()
const router = useRouter()
const store = useSolicitudesStore()

const OPCIONES_ESTADO = ['Pendiente', 'En Trámite', 'En revisión', 'Firmado', 'Rechazado', 'Finalizado']

const formRef = ref(null)
const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)

const editando = ref(false)
const codigoEditar = ref(null)
const solicitudEliminar = ref(null)

const rows = computed(() => store.solicitudes || [])

const solicitud = ref({
  numeroSolicitud: '',
  numeroContrato: '',
  contratista: '',
  dependencia: '',
  responsable: '',
  fecha: new Date().toISOString().substring(0, 10),
  estado: 'En Trámite'
})

const columns = [
  { 
    name: 'numeroSolicitud', 
    label: 'Solicitud', 
    field: row => row.numeroSolicitud || row.solicitud || row.codigo || row.id || 'N/A', 
    align: 'left', 
    sortable: true 
  },
  { 
    name: 'numeroContrato', 
    label: 'Contrato', 
    field: row => row.numeroContrato || row.contrato || 'N/A', 
    align: 'left', 
    sortable: true 
  },
  { 
    name: 'contratista', 
    label: 'Contratista', 
    field: row => row.contratista || row.nombreContratista || 'N/A', 
    align: 'left', 
    sortable: true 
  },
  { 
    name: 'dependencia', 
    label: 'Dependencia', 
    field: row => row.dependencia || row.nombreDependencia || 'N/A', 
    align: 'left', 
    sortable: true 
  },
  { 
    name: 'estado', 
    label: 'Estado', 
    field: row => row.estado || 'En Trámite', 
    align: 'center', 
    sortable: true 
  },
  { 
    name: 'acciones', 
    label: 'Acciones', 
    field: 'acciones', 
    align: 'center' 
  }
]

function obtenerColorEstado(estado) {
  switch (estado) {
    case 'Pendiente': return 'warning'
    case 'En Trámite': return 'red-8'
    case 'En revisión': return 'primary'
    case 'Firmado': return 'positive'
    case 'Finalizado': return 'teal'
    case 'Rechazado': return 'negative'
    default: return 'red-8'
  }
}

function verCertificado(fila) {
  const codigo = fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato
  
  router.push({
    name: 'certificado-pdf',
    query: { codigo: codigo }
  })
}

async function guardarSolicitud() {
  if (formRef.value) {
    const esValido = await formRef.value.validate()
    if (!esValido) return
=======
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../services/api'
import FirmaCanvas from '../components/FirmaCanvas.vue'
import FirmaPdfPreview from '../components/FirmaPdfPreview.vue'
import EstadoCard from '../components/EstadoCard.vue'

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
const estadoFirma = ref('')

const columns = [
  { name: 'numero', label: 'Código', field: 'numero', align: 'left' },
  { name: 'contratista', label: 'Contratista', field: 'contratista', align: 'left' },
  { name: 'area', label: 'Dependencia', field: 'area', align: 'left' },
  { name: 'fecha', label: 'Fecha de solicitud', field: 'fecha', align: 'left' },
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
>>>>>>> origin/frontend-juanpablo
  }
}

<<<<<<< HEAD
  if (editando.value) {
    const idBusqueda = codigoEditar.value

    if (typeof store.actualizarSolicitud === 'function') {
      await store.actualizarSolicitud(idBusqueda, { ...solicitud.value })
    }

    // Actualización reactiva directa por si el Store no muta la lista internamente
    if (Array.isArray(store.solicitudes)) {
      const index = store.solicitudes.findIndex(s => 
        (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) === idBusqueda
      )
      if (index !== -1) {
        store.solicitudes[index] = { 
          ...store.solicitudes[index], 
          ...solicitud.value,
          numeroSolicitud: solicitud.value.numeroSolicitud || store.solicitudes[index].numeroSolicitud || store.solicitudes[index].solicitud
        }
      }
    }
    $q.notify({ type: 'positive', message: 'Solicitud actualizada correctamente.' })
  } else {
    if (typeof store.agregarSolicitud === 'function') {
      await store.agregarSolicitud({ ...solicitud.value })
    } else if (Array.isArray(store.solicitudes)) {
      store.solicitudes.push({ ...solicitud.value })
    }
    $q.notify({ type: 'positive', message: 'Solicitud registrada correctamente.' })
  }

  limpiarFormulario()
}

function editarSolicitud(fila) {
  const codigoExistente = fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato || ''

  solicitud.value = { 
    numeroSolicitud: fila.numeroSolicitud || fila.solicitud || fila.codigo || codigoExistente,
    numeroContrato: fila.numeroContrato || fila.contrato || '',
    contratista: fila.contratista || fila.nombreContratista || '',
    dependencia: fila.dependencia || fila.nombreDependencia || '',
    responsable: fila.responsable || fila.supervisor || '',
    fecha: fila.fecha || new Date().toISOString().substring(0, 10),
    estado: fila.estado || 'En Trámite'
  }

  codigoEditar.value = codigoExistente
  editando.value = true
  dialogo.value = true
}

function eliminarSolicitud(fila) {
  solicitudEliminar.value = fila
  dialogoEliminar.value = true
}

async function confirmarEliminar() {
  if (solicitudEliminar.value) {
    const id = solicitudEliminar.value.numeroSolicitud || solicitudEliminar.value.solicitud || solicitudEliminar.value.codigo || solicitudEliminar.value.numeroContrato
    if (typeof store.eliminarSolicitud === 'function') {
      await store.eliminarSolicitud(id)
    } else if (Array.isArray(store.solicitudes)) {
      store.solicitudes = store.solicitudes.filter(s => 
        (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato) !== id
      )
    }
    $q.notify({ type: 'info', message: 'Solicitud eliminada.' })
  }
  dialogoEliminar.value = false
  solicitudEliminar.value = null
}

function nuevaSolicitud() {
  limpiarFormulario()
  const cons = ((store.solicitudes?.length || 0) + 1).toString().padStart(3, '0')
  solicitud.value.numeroSolicitud = `SOL-2026-${cons}`
  solicitud.value.numeroContrato = 'CNT-2025-088'
  dialogo.value = true
}

function cancelar() {
  limpiarFormulario()
}

function limpiarFormulario() {
  solicitud.value = {
    numeroSolicitud: '',
    numeroContrato: '',
    contratista: '',
    dependencia: '',
    responsable: '',
    fecha: new Date().toISOString().substring(0, 10),
    estado: 'En Trámite'
  }
  dialogo.value = false
  editando.value = false
  codigoEditar.value = null
  if (formRef.value) {
    formRef.value.resetValidation()
  }
=======
function normalizar(item) {
  const contrato = item.contrato_id || {}
  const codigo = item.codigo || contrato.numero_contrato || '—'
  return {
    id: item._id,
    contratoId: contrato._id || contrato,
    numero: codigo,
    contratista: contrato.nombre_contratista || '—',
    area: item.area_id?.nombre_dependencia || '—',
    fecha: item.fecha_firma || item.createdAt,
    estado: contrato.estado || item.estado || 'Pendiente',
    observacion: item.observacion_rechazo || ''
  }
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
      return 'green-9'
    case 'Rechazado':
      return 'red-9'
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
    dialogoFirma.value = false
    const msg = (error.mensaje || '').toLowerCase()
    if (msg.includes('obligaciones')) {
      estadoFirma.value = 'obligaciones'
    } else if (msg.includes('ya realizó') || msg.includes('ya realizo') || msg.includes('realizó su acción')) {
      estadoFirma.value = 'firmada'
    } else {
      estadoFirma.value = 'inconsistencia'
    }
  } finally {
    procesando.value = false
  }
}

function irARegistrarObservacion() {
  estadoFirma.value = ''
  abrirRechazo(seleccionado.value)
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
>>>>>>> origin/frontend-juanpablo
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
}
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
}

.empty-titulo {
  color: #d32f2f;
  font-size: 22px;
  font-weight: 700;
  margin-top: 12px;
}

.empty-msj {
  color: #6b7280;
  font-size: 16px;
  margin-top: 8px;
  max-width: 440px;
}
</style>
