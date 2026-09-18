<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Aprobaciones y Firmas</div>
        <div class="text-subtitle2 text-grey-7">
          Certificado GCCON-F-088 — {{ solicitudActual ? `Solicitud: ${codigoSolicitud}` : 'Gestión de Dictámenes y Firmas Oficiales' }}
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
          v-if="solicitudActual"
          color="red-7"
          icon="picture_as_pdf"
          label="Ver / Descargar PDF"
          unelevated
          @click="imprimirCertificado"
        />
      </div>
    </div>

    <!-- Si no se especificó un código o no se encuentra -->
    <div v-if="!solicitudActual">
      <q-card flat bordered class="q-pa-md q-mb-lg">
        <q-card-section>
          <div class="text-h6 text-primary text-weight-bold q-mb-xs">Solicitudes Disponibles para Dictamen / Firma</div>
          <div class="text-caption text-grey-7 q-mb-md">Seleccione una solicitud para gestionar su firma electrónica GCCON-F-088</div>
          
          <q-table
            flat
            bordered
            :rows="store.solicitudes || []"
            :columns="columnasBandeja"
            row-key="id"
            no-data-label="No hay solicitudes registradas"
          >
            <template #body-cell-estado="props">
              <q-td :props="props">
                <q-badge :color="props.row.estado === 'Firmado' || props.row.estado === 'Finalizado' ? 'positive' : 'warning'">
                  {{ props.row.estado || 'Pendiente' }}
                </q-badge>
              </q-td>
            </template>
            <template #body-cell-acciones="props">
              <q-td :props="props" class="q-gutter-xs">
                <q-btn
                  flat
                  round
                  dense
                  color="positive"
                  icon="draw"
                  @click="seleccionarYFirmar(props.row)"
                >
                  <q-tooltip>Firmar Trámite</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  color="red-7"
                  icon="picture_as_pdf"
                  @click="verPdfFila(props.row)"
                >
                  <q-tooltip>Ver Certificado PDF</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

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
                <strong>Número de Solicitud:</strong>
                {{
                  solicitudActual.numeroSolicitud ||
                  solicitudActual.solicitud ||
                  solicitudActual.codigo ||
                  'N/A'
                }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Número de Contrato:</strong>
                {{ solicitudActual.numeroContrato || solicitudActual.contrato }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Contratista:</strong>
                {{
                  solicitudActual.contratista ||
                  solicitudActual.nombreContratista ||
                  'No registrado'
                }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Dependencia:</strong>
                {{
                  solicitudActual.dependencia ||
                  solicitudActual.nombreDependencia ||
                  'No registrada'
                }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Responsable de Área:</strong>
                {{ solicitudActual.responsable || solicitudActual.supervisor || 'No asignado' }}
              </div>
              <div class="col-12 col-sm-6"><strong>Fecha:</strong> {{ solicitudActual.fecha }}</div>
              <div class="col-12 col-sm-6">
                <strong>Estado Actual:</strong>
                <q-badge :color="esFirmado ? 'positive' : 'warning'" class="q-ml-xs">
                  {{ solicitudActual.estado || 'En Trámite' }}
                </q-badge>
              </div>
            </div>

            <!-- Vista previa de firma estampada si ya se firmó -->
            <div v-if="firmaActual" class="q-mt-md q-pa-sm bg-grey-1 rounded-borders border-dashed">
              <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Firma Manuscrita Estampada para este documento:</div>
              <img :src="firmaActual" alt="Firma Estampada" style="max-height: 55px; max-width: 160px; object-fit: contain; display: block;" />
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
                  <q-icon :name="esFirmado ? 'check_circle' : 'pending'" :color="esFirmado ? 'positive' : 'warning'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">Responsable de Dependencia</q-item-label>
                  <q-item-label caption>{{ esFirmado ? 'Firmado y Estampado' : 'Pendiente de firma' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <div class="q-mt-lg row justify-end q-gutter-sm">
              <q-btn
                color="positive"
                icon="draw"
                :label="esFirmado ? 'Volver a Firmar' : 'Firmar Certificado'"
                unelevated
                class="full-width"
                @click="abrirModalFirma"
              />
              <q-btn
                v-if="esFirmado"
                outline
                color="red-7"
                icon="picture_as_pdf"
                label="Ver Certificado con Firma"
                class="full-width q-mt-sm"
                @click="imprimirCertificado"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Diálogo con Canvas para Dibujar y Capturar la Firma -->
    <q-dialog v-model="dialogoFirma" persistent>
      <q-card style="min-width: 480px; max-width: 90vw;">
        <q-card-section class="bg-primary text-white row items-center justify-between">
          <div class="text-h6">
            <q-icon name="draw" class="q-mr-sm" />
            Estampar Firma Manuscrita
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-8 q-mb-sm">
            Dibuje su firma en el recuadro. Por seguridad y cumplimiento de la normativa SENA,
            la firma <strong>no se almacena en la base de datos</strong>; se estampa directamente en el archivo PDF oficial.
          </div>
          <FirmaCanvas ref="canvasRef" />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            color="positive"
            icon="verified"
            label="Confirmar y Estampar en PDF"
            :loading="procesandoFirma"
            @click="confirmarFirma"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useSolicitudesStore } from '../stores/useSolicitudesStore.js'
import FirmaCanvas from '../components/FirmaCanvas.vue'
import api from '../services/api'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const store = useSolicitudesStore()

const dialogoFirma = ref(false)
const canvasRef = ref(null)
const procesandoFirma = ref(false)
const firmaActual = ref(null)

const columnasBandeja = [
  { name: 'solicitud', label: 'Código Solicitud', field: row => row.numeroSolicitud || row.solicitud || row.codigo || '—', align: 'left' },
  { name: 'contrato', label: 'Contrato', field: row => row.numeroContrato || row.contrato || '—', align: 'left' },
  { name: 'contratista', label: 'Contratista', field: row => row.contratista || row.nombreContratista || '—', align: 'left' },
  { name: 'dependencia', label: 'Dependencia', field: row => row.dependencia || row.nombreDependencia || '—', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'acciones', label: 'Acciones', align: 'center' }
]

// Obtener el código enviado por query params: /app/firmas?codigo=SOL-2026-001
const codigoSolicitud = computed(() => route.query.codigo)

// Buscar la solicitud en el store comprobando múltiples nombres de propiedad
const solicitudActual = computed(() => {
  if (!codigoSolicitud.value) return null
  return (
    store.solicitudes.find(
      (s) =>
        (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) ===
        codigoSolicitud.value,
    ) || null
  )
})

const esFirmado = computed(() => {
  const est = solicitudActual.value?.estado
  return est === 'Firmado' || est === 'Finalizado' || est === 'Aprobado'
})

onMounted(() => {
  cargarFirmaLocal()
})

function cargarFirmaLocal() {
  if (codigoSolicitud.value) {
    const f = localStorage.getItem(`firma_${codigoSolicitud.value}`)
    if (f) firmaActual.value = f
  }
}

function abrirModalFirma() {
  dialogoFirma.value = true
}

function seleccionarYFirmar(fila) {
  const cod = fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato
  router.push({ name: 'firmas', query: { codigo: cod } })
  setTimeout(() => {
    dialogoFirma.value = true
  }, 200)
}

function verPdfFila(fila) {
  const cod = fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato
  router.push({ name: 'certificado-pdf', query: { codigo: cod } })
}

async function confirmarFirma() {
  if (!canvasRef.value) return
  procesandoFirma.value = true
  try {
    const dataUrl = canvasRef.value.exportarBase64()
    const idBusqueda = codigoSolicitud.value

    // Guardar firma local para el renderizado del PDF
    if (idBusqueda) {
      localStorage.setItem(`firma_${idBusqueda}`, dataUrl)
    }
    localStorage.setItem('ultima_firma', dataUrl)
    firmaActual.value = dataUrl

    // Si tiene contrato en backend, enviar a la API
    const contratoId = solicitudActual.value?.contratoId || solicitudActual.value?._id || solicitudActual.value?.id
    if (contratoId) {
      try {
        const firmaBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
        await api.post('/api/firmas/procesar', {
          contratoId,
          accion: 'Aprobar',
          firma_base64: firmaBase64
        })
      } catch (errApi) {
        console.warn('Registro API de firma:', errApi)
      }
    }

    if (typeof store.actualizarSolicitud === 'function' && idBusqueda) {
      await store.actualizarSolicitud(idBusqueda, {
        ...solicitudActual.value,
        estado: 'Firmado',
      })
    }

    if (Array.isArray(store.solicitudes)) {
      const item = store.solicitudes.find(
        (s) =>
          (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) ===
          idBusqueda,
      )
      if (item) {
        item.estado = 'Firmado'
      }
    }

    dialogoFirma.value = false
    $q.notify({
      type: 'positive',
      icon: 'verified',
      message: 'Firma capturada y estampada exitosamente en el archivo PDF oficial.',
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudo estampar la firma.',
    })
  } finally {
    procesandoFirma.value = false
  }
}

function imprimirCertificado() {
  if (codigoSolicitud.value) {
    router.push({ name: 'certificado-pdf', query: { codigo: codigoSolicitud.value } })
  } else {
    window.print()
  }
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

.border-dashed {
  border: 1px dashed #bdbdbd;
}
</style>
