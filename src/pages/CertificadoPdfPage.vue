<template>
  <q-page class="q-pa-md flex flex-center bg-grey-2">
    <div style="max-width: 900px; width: 100%;">
      <!-- Botones superiores -->
      <div class="row justify-between items-center q-mb-md no-print">
        <q-btn
          flat
          color="primary"
          icon="arrow_back"
          label="Volver a Solicitudes"
          @click="volver"
        />
        <q-btn
          color="positive"
          icon="print"
          label="Imprimir / Guardar PDF"
          unelevated
          @click="imprimir"
        />
      </div>

      <!-- Hoja del Documento -->
      <q-card class="q-pa-xl bg-white shadow-2">
        <!-- Encabezado con Logo del SENA -->
        <div class="row items-center border-bottom q-pb-md q-mb-lg">
          <div class="col-3 text-center">
            <q-img
              :src="logoSena"
              spinner-color="primary"
              style="height: 70px; max-width: 70px"
              fit="contain"
            />
          </div>
          <div class="col-6 text-center">
            <div class="text-bold text-uppercase text-body1">Servicio Nacional de Aprendizaje - SENA</div>
            <div class="text-caption text-grey-8">SISTEMA INTEGRADO DE GESTIÓN</div>
            <div class="text-caption text-bold text-green-9">FORMATO PAZ Y SALVO CONTRACTUAL (GCCON-F-088)</div>
          </div>
          <div class="col-3 text-right text-caption text-grey-8">
            <div><strong>Código:</strong> {{ codigoCertificado }}</div>
            <div><strong>Versión:</strong> 02</div>
          </div>
        </div>

        <!-- Banner de Sección -->
        <div class="bg-grey-3 q-pa-xs q-px-sm text-bold text-caption text-uppercase q-mb-md border-left-accent text-dark">
          Información General del Contrato
        </div>

        <!-- Tabla de Datos del Contrato -->
        <div class="q-mb-lg">
          <div class="row q-col-gutter-sm q-mb-xs">
            <div class="col-6"><strong>Número de Contrato:</strong> {{ datosSolicitud.contrato }}</div>
            <div class="col-6"><strong>Fecha de Generación:</strong> {{ datosSolicitud.fecha }}</div>
          </div>
          <div class="row q-col-gutter-sm q-mb-xs">
            <div class="col-6"><strong>Contratista:</strong> {{ datosSolicitud.contratista }}</div>
            <div class="col-6"><strong>Dependencia:</strong> {{ datosSolicitud.dependencia }}</div>
          </div>
          <div class="row q-col-gutter-sm q-mb-xs">
            <div class="col-6"><strong>Supervisor Asignado:</strong> {{ datosSolicitud.supervisor }}</div>
            <div class="col-6">
              <strong>Estado de la Solicitud:</strong>
              <q-badge :color="esRechazado ? 'negative' : (esFirmado ? 'positive' : 'warning')" class="q-ml-xs">
                {{ datosSolicitud.estado }}
              </q-badge>
            </div>
          </div>
        </div>

        <!-- Texto Declarativo Formal -->
        <div class="text-body2 text-justify line-height-relaxed q-mb-lg text-dark">
          <!-- CASO 1: RECHAZADO -->
          <template v-if="esRechazado">
            <p>
              Se hace constar que la solicitud de paz y salvo para el(la) contratista 
              <strong>{{ datosSolicitud.contratista }}</strong> en relación con el contrato 
              <strong>{{ datosSolicitud.contrato }}</strong> ha sido rechazada por la supervisión asignada.
            </p>
            <p class="q-mt-md">
              El trámite requiere la subsanación de las observaciones indicadas antes de proceder con una nueva solicitud de paz y salvo.
            </p>
          </template>

          <!-- CASO 2: EN TRÁMITE -->
          <template v-else-if="esEnTramite">
            <p>
              Se informa que la solicitud de paz y salvo para el(la) contratista 
              <strong>{{ datosSolicitud.contratista }}</strong> bajo el contrato número 
              <strong>{{ datosSolicitud.contrato }}</strong> se encuentra en proceso de verificación de los entregables y requisitos contractuales.
            </p>
            <p class="q-mt-md">
              Este documento refleja el estado actual del trámite y no constituye paz y salvo definitivo hasta la obtención de las firmas autorizadas.
            </p>
          </template>

          <!-- CASO 3: FIRMADO -->
          <template v-else>
            <p>
              Se hace constar que el(la) contratista <strong>{{ datosSolicitud.contratista }}</strong> ha cumplido a cabalidad con las obligaciones contractuales y la entrega de los bienes, productos o servicios estipulados bajo el contrato número <strong>{{ datosSolicitud.contrato }}</strong>, de conformidad con los requerimientos técnicos y administrativos de la dependencia supervisora.
            </p>
            <p class="q-mt-md">
              Por lo anterior, se expide el presente paz y salvo definitivo para dar trámite a las gestiones administrativas, financieras y de liquidación correspondientes.
            </p>
          </template>
        </div>

        <!-- Tabla de Verificación de Obligaciones -->
        <div class="q-mb-xl">
          <div class="text-subtitle2 text-bold q-mb-xs">ESTADO DE VERIFICACIÓN DE OBLIGACIONES</div>
          <table class="tabla-oficial">
            <thead>
              <tr>
                <th>Concepto / Entregable</th>
                <th>Estado</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Informes de ejecución y entregables contractuales</td>
                <td class="text-bold text-center" :class="esRechazado ? 'text-negative' : (esFirmado ? 'text-positive' : 'text-warning')">
                  {{ esRechazado ? 'NO CUMPLIDO' : (esFirmado ? 'CUMPLIDO' : 'EN REVISIÓN') }}
                </td>
                <td>{{ esRechazado ? 'Presenta observaciones pendientes' : (esFirmado ? 'Verificado a satisfacción' : 'Pendiente de validación final') }}</td>
              </tr>
              <tr>
                <td>Paz y salvo de inventario y bienes asignados</td>
                <td class="text-bold text-center" :class="esRechazado ? 'text-negative' : (esFirmado ? 'text-positive' : 'text-warning')">
                  {{ esRechazado ? 'PENDIENTE' : (esFirmado ? 'CUMPLIDO' : 'EN TRÁMITE') }}
                </td>
                <td>{{ esRechazado ? 'Revisión de almacén pendiente' : (esFirmado ? 'Sin novedades en almacén' : 'Verificando Paz y Salvo de almacén') }}</td>
              </tr>
              <tr>
                <td>Planillas de pago a Seguridad Social y Aportes</td>
                <td class="text-bold text-center" :class="esRechazado ? 'text-negative' : (esFirmado ? 'text-positive' : 'text-warning')">
                  {{ esRechazado ? 'PENDIENTE' : (esFirmado ? 'CUMPLIDO' : 'EN TRÁMITE') }}
                </td>
                <td>{{ esRechazado ? 'Requiere validación' : (esFirmado ? 'Planillas validadas al día' : 'En proceso de validación documental') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Seccion de Firmas -->
        <div class="row q-col-gutter-xl q-mt-xl text-center">
          <div class="col-6">
            <div class="firma-linea q-mb-xs"></div>
            <div class="text-bold text-caption">{{ datosSolicitud.contratista }}</div>
            <div class="text-caption text-grey-7">Contratista</div>
          </div>
          <div class="col-6">
            <div class="firma-linea q-mb-xs"></div>
            <div class="text-bold text-caption">{{ datosSolicitud.supervisor }}</div>
            
            <!-- Estado de Firma -->
            <div v-if="esRechazado" class="text-caption text-negative text-bold">
              <q-icon name="cancel" /> Solicitud Rechazada
            </div>
            <div v-else-if="esFirmado" class="text-caption text-green-8 text-bold">
              <q-icon name="check_circle" /> Firma Electrónica Verificada
            </div>
            <div v-else class="text-caption text-warning text-bold">
              <q-icon name="hourglass_empty" /> Trámite Pendiente de Firma
            </div>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSolicitudesStore } from '../stores/useSolicitudesStore.js'
import logoSena from '../assets/Logo-Sena.png'

const route = useRoute()
const router = useRouter()
const store = useSolicitudesStore()

const codigoCertificado = ref('CERT-2026-002')

const datosSolicitud = ref({
  contratista: 'Paula Valentina Rache Fonseca',
  contrato: 'CT-2026-088',
  dependencia: 'Sistemas e Informática',
  supervisor: 'Área de Gestión Contractual SENA',
  fecha: new Date().toLocaleDateString('es-CO'),
  estado: 'En Trámite'
})

// Evaluadores de estado
const esRechazado = computed(() => datosSolicitud.value.estado === 'Rechazado')
const esFirmado = computed(() => datosSolicitud.value.estado === 'Firmado' || datosSolicitud.value.estado === 'Finalizado')
const esEnTramite = computed(() => !esRechazado.value && !esFirmado.value)

onMounted(() => {
  const codigoQuery = route.query.codigo
  if (codigoQuery) {
    codigoCertificado.value = codigoQuery

    let encontrada = null
    if (typeof store.obtenerPorCodigo === 'function') {
      encontrada = store.obtenerPorCodigo(codigoQuery)
    } else if (Array.isArray(store.solicitudes)) {
      encontrada = store.solicitudes.find(s => 
        (s.numeroSolicitud || s.codigo || s.solicitud || s.numeroContrato || s.contrato) === codigoQuery
      )
    }

    if (encontrada) {
      datosSolicitud.value = {
        contratista: encontrada.contratista || encontrada.nombreContratista || 'Paula Valentina Rache Fonseca',
        contrato: encontrada.numeroContrato || encontrada.contrato || 'CT-2026-088',
        dependencia: encontrada.dependencia || encontrada.nombreDependencia || 'Sistemas e Informática',
        supervisor: encontrada.responsable || encontrada.supervisor || 'Área de Gestión Contractual SENA',
        fecha: encontrada.fecha || new Date().toLocaleDateString('es-CO'),
        estado: encontrada.estado || 'En Trámite'
      }
    }
  }
})

const volver = () => {
  router.push({ name: 'solicitudes' })
}

const imprimir = () => {
  window.print()
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 2px solid #2e7d32;
}

.border-left-accent {
  border-left: 4px solid #2e7d32;
}

.firma-linea {
  border-bottom: 1px solid #333;
  width: 80%;
  margin: 40px auto 8px auto;
}

.line-height-relaxed p {
  line-height: 1.6;
}

.tabla-oficial {
  width: 100%;
  border-collapse: collapse;
}

.tabla-oficial th, .tabla-oficial td {
  border: 1px solid #ccc;
  padding: 8px;
  font-size: 13px;
}

.tabla-oficial th {
  background-color: #f2f2f2;
  text-align: left;
}

@media print {
  .no-print {
    display: none !important;
  }

  .q-page {
    padding: 0 !important;
    background-color: white !important;
  }

  .q-card {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
  }

  body {
    background: white !important;
  }
}
</style>