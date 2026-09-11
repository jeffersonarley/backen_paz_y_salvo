<template>
  <q-page class="q-pa-lg">
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
      No se encontró información registrada para el código de solicitud:
      <strong>{{ codigoSolicitud }}</strong
      >.
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
                <q-badge color="primary" class="q-ml-xs">{{
                  solicitudActual.estado || 'En Trámite'
                }}</q-badge>
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
  </q-page>
</template>

<script setup>
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
  return (
    store.solicitudes.find(
      (s) =>
        (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) ===
        codigoSolicitud.value,
    ) || null
  )
})

async function aprobarYFirmar() {
  if (solicitudActual.value) {
    const idBusqueda = codigoSolicitud.value

    if (typeof store.actualizarSolicitud === 'function') {
      await store.actualizarSolicitud(idBusqueda, {
        ...solicitudActual.value,
        estado: 'Firmado',
      })
    }

    // Actualización reactiva directa en la lista de solicitudes
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

    $q.notify({
      type: 'positive',
      message: 'Certificado firmado y actualizado a estado "Firmado".',
    })
  }
}

function imprimirCertificado() {
  window.print()
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
