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
      row-key="numeroSolicitud"
      flat
      bordered
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

          <q-btn flat round dense color="primary" icon="edit" @click="editarSolicitud(props.row)">
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
      <q-card style="min-width: 550px; max-width: 90vw">
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
              :rules="[(val) => !!val || 'El número de solicitud es obligatorio']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.numeroContrato"
              label="Número de Contrato *"
              :rules="[(val) => !!val || 'El número de contrato es obligatorio']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.contratista"
              label="Contratista *"
              :rules="[(val) => !!val || 'El nombre del contratista es obligatorio']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.dependencia"
              label="Dependencia *"
              :rules="[(val) => !!val || 'La dependencia es obligatoria']"
            />

            <q-input
              outlined
              dense
              v-model="solicitud.responsable"
              label="Responsable de Área *"
              :rules="[(val) => !!val || 'El responsable es obligatorio']"
            />

            <q-input
              outlined
              dense
              type="date"
              v-model="solicitud.fecha"
              label="Fecha *"
              stack-label
              :rules="[(val) => !!val || 'La fecha es obligatoria']"
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
            <q-btn flat label="Cancelar" color="grey-8" @click="cancelar" />
            <q-btn unelevated type="submit" color="positive" label="Guardar" />
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
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn unelevated color="negative" label="Eliminar" @click="confirmarEliminar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useSolicitudesStore } from '../stores/useSolicitudesStore.js'

const $q = useQuasar()
const router = useRouter()
const store = useSolicitudesStore()

const OPCIONES_ESTADO = ['Pendiente', 'En revisión', 'Firmado', 'Rechazado', 'Finalizado']

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
  estado: 'Pendiente',
})

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
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center',
  },
]

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

function verCertificado(fila) {
  const codigo =
    fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato

  router.push({
    name: 'certificado-pdf',
    query: { codigo: codigo },
  })
}

async function guardarSolicitud() {
  if (formRef.value) {
    const esValido = await formRef.value.validate()
    if (!esValido) return
  }

  if (editando.value) {
    const idBusqueda = codigoEditar.value

    if (typeof store.actualizarSolicitud === 'function') {
      await store.actualizarSolicitud(idBusqueda, { ...solicitud.value })
    }

    if (Array.isArray(store.solicitudes)) {
      const index = store.solicitudes.findIndex(
        (s) =>
          (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) ===
          idBusqueda,
      )
      if (index !== -1) {
        store.solicitudes[index] = {
          ...store.solicitudes[index],
          ...solicitud.value,
          numeroSolicitud:
            solicitud.value.numeroSolicitud ||
            store.solicitudes[index].numeroSolicitud ||
            store.solicitudes[index].solicitud,
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
  const codigoExistente =
    fila.numeroSolicitud ||
    fila.solicitud ||
    fila.codigo ||
    fila.numeroContrato ||
    fila.contrato ||
    ''

  solicitud.value = {
    numeroSolicitud: fila.numeroSolicitud || fila.solicitud || fila.codigo || codigoExistente,
    numeroContrato: fila.numeroContrato || fila.contrato || '',
    contratista: fila.contratista || fila.nombreContratista || '',
    dependencia: fila.dependencia || fila.nombreDependencia || '',
    responsable: fila.responsable || fila.supervisor || '',
    fecha: fila.fecha || new Date().toISOString().substring(0, 10),
    estado: fila.estado || 'Pendiente',
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
    const id =
      solicitudEliminar.value.numeroSolicitud ||
      solicitudEliminar.value.solicitud ||
      solicitudEliminar.value.codigo ||
      solicitudEliminar.value.numeroContrato
    if (typeof store.eliminarSolicitud === 'function') {
      await store.eliminarSolicitud(id)
    } else if (Array.isArray(store.solicitudes)) {
      store.solicitudes = store.solicitudes.filter(
        (s) => (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato) !== id,
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
    estado: 'Pendiente',
  }
  dialogo.value = false
  editando.value = false
  codigoEditar.value = null
  if (formRef.value) {
    formRef.value.resetValidation()
  }
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
