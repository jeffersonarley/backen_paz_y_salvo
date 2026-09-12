<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">Contratos</div>

    <q-card flat bordered>
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <q-input
            v-model="busqueda"
            outlined
            dense
            debounce="300"
            label="Buscar..."
            clearable
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-4">
          <q-select
            v-model="filtroEstado"
            outlined
            dense
            label="Filtrar por estado"
            :options="estados"
            emit-value
            map-options
            clearable
          />
        </div>

        <div class="col-12 col-sm-4 text-right">
          <q-btn
            v-if="esContratista"
            color="primary"
            icon="add"
            label="Nuevo Contrato"
            unelevated
            no-caps
            @click="router.push({ name: 'contrato-nuevo' })"
          />
        </div>
      </q-card-section>

      <q-table
        :rows="registrosFiltrados"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-per-page-options="[5, 10, 15, 20]"
        flat
        bordered
        no-data-label="No hay contratos disponibles"
        loading-label="Cargando contratos..."
      >
        <template #body-cell-dependencia="props">
          <q-td :props="props">
            {{ props.row.dependencia?.nombre_dependencia || '—' }}
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-badge :color="estadoInfo(props.row).color" :label="estadoInfo(props.row).label" />
              <q-icon
                v-if="estadoInfo(props.row).icon"
                :name="estadoInfo(props.row).icon"
                size="16px"
                class="q-ml-xs text-grey-7"
              />
            </div>
            <div
              v-if="estadoInfo(props.row).observacion"
              class="text-caption text-negative q-mt-xs"
              style="max-width: 280px; white-space: normal; line-height: 1.25"
            >
              <q-icon name="comment" size="14px" class="q-mr-xs" />
              {{ estadoInfo(props.row).observacion }}
            </div>
            <div
              v-else-if="props.row.estado === 'Pendiente de Firmas'"
              class="text-caption text-orange-8 q-mt-xs"
              style="white-space: normal; line-height: 1.25"
            >
              En espera de firmas de las áreas
            </div>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="visibility"
              @click="abrirDetalle(props.row)"
            >
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>

            <template v-if="esContratista && props.row.estado === 'Borrador'">
              <q-btn
                flat
                round
                dense
                color="teal"
                icon="edit"
                @click="router.push({ name: 'contrato-editar', params: { id: props.row._id } })"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click="confirmarCancelar(props.row)"
              >
                <q-tooltip>Cancelar contrato</q-tooltip>
              </q-btn>
            </template>

            <q-btn
              v-if="esContratista && props.row.estado === 'Finalizado'"
              flat
              dense
              no-caps
              color="green"
              icon="picture_as_pdf"
              label="Descargar PDF"
              class="q-ml-xs"
              @click="onDescargarPdf(props.row)"
            >
              <q-tooltip>Descargar PDF del paz y salvo</q-tooltip>
            </q-btn>

            <q-btn
              v-if="esSupervisor"
              flat
              dense
              color="primary"
              label="Evaluar"
              no-caps
              @click="abrirEvaluar(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogDetalle">
      <q-card style="min-width: 520px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">Detalle del Contrato</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section v-if="cargandoDetalle">
          <q-skeleton type="text" v-for="n in 5" :key="n" />
        </q-card-section>

        <q-card-section v-else class="q-gutter-y-sm">
          <div><strong>Número:</strong> {{ detalle.contrato?.numero_contrato }}</div>
          <div><strong>Contratista:</strong> {{ detalle.contrato?.nombre_contratista }}</div>
          <div><strong>Correo:</strong> {{ detalle.contrato?.correo_contratista }}</div>
          <div><strong>Teléfono:</strong> {{ detalle.contrato?.telefono }}</div>
          <div><strong>Dependencia:</strong> {{ detalle.contrato?.dependencia?.nombre_dependencia || '—' }}</div>
          <div>
            <strong>Estado:</strong>
            <q-badge class="q-ml-sm" :color="estadoColor(detalle.contrato?.estado)">
              {{ detalle.contrato?.estado }}
            </q-badge>
          </div>

          <div
            v-if="detalle.contrato && estadoInfo(detalle.contrato).observacion"
            class="q-mt-sm q-pa-md rounded-borders bg-red-1 text-negative"
          >
            <div class="text-weight-bold">
              <q-icon name="cancel" class="q-mr-xs" /> Solicitud rechazada
            </div>
            <div class="q-mt-xs">{{ estadoInfo(detalle.contrato).observacion }}</div>
          </div>

          <div
            v-else-if="detalle.contrato?.estado === 'Pendiente de Firmas'"
            class="q-mt-sm q-pa-md rounded-borders bg-orange-1 text-orange-9"
          >
            <div class="text-weight-bold">
              <q-icon name="draw" class="q-mr-xs" /> Aprobado por el supervisor
            </div>
            <div class="q-mt-xs">
              Su solicitud fue aprobada y pasó a "Pendiente de Firmas". Se están gestionando las firmas de las áreas.
            </div>
          </div>

          <div
            v-else-if="detalle.contrato?.estado === 'Finalizado'"
            class="q-mt-sm q-pa-md rounded-borders bg-green-1 text-green-9"
          >
            <div class="text-weight-bold">
              <q-icon name="task_alt" class="q-mr-xs" /> Paz y salvo finalizado
            </div>
            <div class="row items-center justify-between q-mt-xs">
              <span>Su paz y salvo fue emitido y autorizado.</span>
              <q-btn
                unelevated
                no-caps
                color="green"
                icon="picture_as_pdf"
                label="Descargar PDF"
                size="sm"
                @click="onDescargarPdf(detalle.contrato)"
              />
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="text-subtitle1 text-weight-bold">Bienes entregados</div>
          <q-list dense bordered>
            <q-item v-for="bien in detalle.bienes" :key="bien._id">
              <q-item-section>
                <q-item-label>{{ bien.descripcion }}</q-item-label>
                <q-item-label caption>
                  Código: {{ bien.codigo_inventario }} · Cantidad: {{ bien.cantidad }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="detalle.bienes?.length === 0">
              <q-item-section class="text-grey-6">Sin bienes registrados</q-item-section>
            </q-item>
          </q-list>

          <template v-if="detalle.observaciones">
            <q-separator class="q-my-sm" />
            <div class="text-subtitle1 text-weight-bold">Observaciones</div>
            <div v-if="detalle.observaciones.observaciones_supervisor">
              <strong>Supervisor:</strong> {{ detalle.observaciones.observaciones_supervisor }}
            </div>
            <div
              v-for="(obs, i) in detalle.observaciones.observaciones_areas || []"
              :key="i"
              class="q-mt-sm"
            >
              <strong>{{ obs.area }}:</strong> {{ obs.observacion }}
            </div>
            <div v-if="!detalle.observaciones.observaciones_supervisor && (detalle.observaciones.observaciones_areas || []).length === 0">
              <span class="text-grey-6">Sin observaciones</span>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogEvaluar" persistent>
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">Evaluar Contrato</div>
          <div class="text-subtitle2 text-grey-7">
            {{ contratoEvaluar?.numero_contrato }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-option-group
            v-model="evaluacion.aprobado"
            :options="[
              { label: 'Aprobar', value: true },
              { label: 'Rechazar', value: false }
            ]"
            color="primary"
          />

          <q-input
            v-model="evaluacion.observaciones_supervisor"
            label="Observaciones"
            type="textarea"
            outlined
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" no-caps v-close-popup />
          <q-btn
            color="primary"
            label="Enviar evaluación"
            unelevated
            no-caps
            :loading="guardando"
            @click="guardarEvaluacion"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  listarContratos,
  misSolicitudes,
  obtenerContrato,
  obtenerObservaciones,
  cancelarContrato,
  descargarPdf,
  evaluarContrato
} from '@/services/contratoService'
import { getRol } from '@/services/authService'
import { getErrorMessage } from '@/services/axios'
import { ROL } from '@/constants/roles'

const $q = useQuasar()
const router = useRouter()

const rol = getRol()
const esContratista = rol === ROL.CONTRATISTA
const esSupervisor = rol === ROL.SUPERVISOR

const estados = ['Borrador', 'EnProceso', 'Pendiente de Firmas', 'Aprobado', 'Rechazado', 'Finalizado']
  .map((e) => ({ label: e, value: e }))

const columns = [
  { name: 'numero_contrato', label: 'Número', field: 'numero_contrato', align: 'left', sortable: true },
  { name: 'nombre_contratista', label: 'Contratista', field: 'nombre_contratista', align: 'left', sortable: true },
  { name: 'dependencia', label: 'Dependencia', field: 'dependencia', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'right' }
]

const rows = ref([])
const loading = ref(false)
const busqueda = ref('')
const filtroEstado = ref(null)
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'createdAt',
  descending: true
})

const dialogDetalle = ref(false)
const cargandoDetalle = ref(false)
const detalle = ref({ contrato: null, bienes: [], observaciones: null })

const dialogEvaluar = ref(false)
const contratoEvaluar = ref(null)
const guardando = ref(false)
const evaluacion = ref({ aprobado: true, observaciones_supervisor: '' })

const registrosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const coincideTexto =
      !texto ||
      String(row.numero_contrato ?? '').toLowerCase().includes(texto) ||
      String(row.nombre_contratista ?? '').toLowerCase().includes(texto)
    const coincideEstado = !filtroEstado.value || row.estado === filtroEstado.value
    return coincideTexto && coincideEstado
  })
})

watch([busqueda, filtroEstado], () => {
  pagination.value.page = 1
})

function estadoColor(estado) {
  const mapa = {
    Borrador: 'grey-7',
    EnProceso: 'blue',
    'Pendiente de Firmas': 'orange',
    Aprobado: 'teal',
    Rechazado: 'red',
    Finalizado: 'green'
  }
  return mapa[estado] || 'grey'
}

function estadoInfo(row) {
  const estado = row?.estado
  // Rechazo del supervisor: el contrato vuelve a Borrador con observación cargada
  if (estado === 'Borrador' && row?.observaciones_supervisor) {
    return {
      color: 'red',
      label: 'Rechazado',
      icon: 'cancel',
      observacion: row.observaciones_supervisor
    }
  }
  const mapa = {
    Borrador: { color: 'grey-7', label: 'Borrador', icon: 'description' },
    EnProceso: { color: 'blue', label: 'En proceso', icon: 'hourglass_half' },
    'Pendiente de Firmas': { color: 'orange', label: 'Pendiente de firmas', icon: 'draw' },
    Aprobado: { color: 'teal', label: 'Aprobado', icon: 'check_circle' },
    Rechazado: {
      color: 'red',
      label: 'Rechazado',
      icon: 'cancel',
      observacion: row?.observaciones_supervisor
    },
    Finalizado: { color: 'green', label: 'Finalizado', icon: 'task_alt' }
  }
  return mapa[estado] || { color: 'grey', label: estado || '—', icon: null, observacion: null }
}

async function cargarDatos() {
  loading.value = true
  try {
    const peticion = esContratista ? misSolicitudes() : listarContratos()
    const { data } = await peticion
    rows.value = Array.isArray(data) ? data : data?.data ?? []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudieron cargar los contratos.')
    })
  } finally {
    loading.value = false
  }
}

async function abrirDetalle(row) {
  dialogDetalle.value = true
  cargandoDetalle.value = true
  detalle.value = { contrato: null, bienes: [], observaciones: null }
  try {
    const [resContrato, resObs] = await Promise.allSettled([
      obtenerContrato(row._id),
      obtenerObservaciones(row._id)
    ])
    if (resContrato.status === 'fulfilled') {
      detalle.value.contrato = resContrato.value.data.contrato
      detalle.value.bienes = resContrato.value.data.bienes || []
    }
    if (resObs.status === 'fulfilled') {
      detalle.value.observaciones = resObs.value.data
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo cargar el detalle.')
    })
  } finally {
    cargandoDetalle.value = false
  }
}

function confirmarCancelar(row) {
  $q.dialog({
    title: 'Cancelar contrato',
    message: `¿Está seguro que desea cancelar el contrato "${row.numero_contrato}"?`,
    cancel: true,
    persistent: true,
    ok: { color: 'negative', label: 'Cancelar contrato', noCaps: true }
  }).onOk(async () => {
    try {
      await cancelarContrato(row._id)
      $q.notify({ type: 'positive', message: 'Contrato cancelado correctamente.' })
      await cargarDatos()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: getErrorMessage(error, 'No se pudo cancelar el contrato.')
      })
    }
  })
}

async function onDescargarPdf(row) {
  try {
    const res = await descargarPdf(row._id)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `pazysalvo_${row.numero_contrato}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo descargar el PDF.')
    })
  }
}

function abrirEvaluar(row) {
  contratoEvaluar.value = row
  evaluacion.value = { aprobado: true, observaciones_supervisor: '' }
  dialogEvaluar.value = true
}

async function guardarEvaluacion() {
  guardando.value = true
  try {
    await evaluarContrato(contratoEvaluar.value._id, {
      aprobado: evaluacion.value.aprobado,
      observaciones_supervisor: evaluacion.value.observaciones_supervisor
    })
    $q.notify({
      type: 'positive',
      message: evaluacion.value.aprobado ? 'Contrato aprobado.' : 'Contrato rechazado.'
    })
    dialogEvaluar.value = false
    await cargarDatos()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo procesar la evaluación.')
    })
  } finally {
    guardando.value = false
  }
}

onMounted(cargarDatos)
</script>
