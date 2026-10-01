<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado Adaptativo por Rol -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">
          {{ esContratista ? 'Seguimiento de Paz y Salvo y Firma' : 'Aprobaciones y Firmas' }}
        </div>
        <div class="text-subtitle2 text-grey-7">
          Certificado GCCON-F-088 —
          <span v-if="esContratista" class="text-weight-bold text-primary"
            >Vista Contratista (RF-005, RF-010)</span
          >
          <span v-else-if="esResponsableArea" class="text-weight-bold text-primary"
            >Vista Responsable de Área (RF-008, RF-014)</span
          >
          <span v-else class="text-weight-bold text-primary"
            >Vista Supervisión y Administración (RF-006)</span
          >
          {{ solicitudActual ? ` | Solicitud: ${codigoSolicitud}` : '' }}
        </div>
      </div>

      <div class="q-gutter-sm">
        <q-btn
          v-if="solicitudActual"
          outline
          color="secondary"
          icon="list"
          label="Ver Todas las Solicitudes"
          @click="volverALista"
        />
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
          <div class="text-h6 text-primary text-weight-bold q-mb-xs">
            {{
              esContratista
                ? 'Mis Solicitudes de Paz y Salvo'
                : 'Solicitudes Disponibles para Dictamen / Firma'
            }}
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            {{
              esContratista
                ? 'Consulte el estado de su trámite en tiempo real. Cuando las dependencias otorguen el visto bueno en bienes, podrá estampar su firma final (RF-005, RF-010).'
                : 'Seleccione una solicitud para revisar los bienes a cargo del contratista y emitir su dictamen aprobatorio (firma) o registrar novedades de rechazo (RF-008, RF-014).'
            }}
          </div>

          <q-tabs
            v-if="!esContratista"
            v-model="pestanaBandeja"
            dense
            align="left"
            active-color="primary"
            indicator-color="primary"
            class="q-mb-sm"
          >
            <q-tab name="pendientes" icon="pending_actions" :label="`Pendientes (${solicitudesPendientes.length})`" />
            <q-tab name="historial" icon="history" :label="`Historial (${solicitudesHistorial.length})`" />
          </q-tabs>

          <q-table
            flat
            bordered
            :rows="solicitudesParaBandeja"
            :columns="columnasBandeja"
            row-key="id"
            :loading="cargandoBandeja"
            :no-data-label="pestanaBandeja === 'historial' ? 'No hay firmas en el historial' : 'No hay solicitudes pendientes para esta bandeja'"
          >
            <template #body-cell-estado="props">
              <q-td :props="props" class="text-center">
                <q-badge
                  :color="
                    props.row.estado === 'Firmado' || props.row.estado === 'Finalizado'
                      ? 'positive'
                      : props.row.estado === 'Rechazado'
                        ? 'negative'
                        : props.row.estado === 'Cancelado'
                          ? 'grey-7'
                        : 'warning'
                  "
                  class="text-weight-bold q-pa-xs"
                >
                  {{ props.row.estado || 'Pendiente' }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-observacion="props">
              <q-td :props="props" class="text-caption" style="min-width: 220px; white-space: normal">
                {{ props.row.observacionRechazo || '—' }}
              </q-td>
            </template>

            <template #body-cell-acciones="props">
              <q-td :props="props" class="q-gutter-xs text-center">
                <!-- Para CONTRATISTA: Botón según estado -->
                <template v-if="esContratista">
                  <q-btn
                    v-if="props.row.estado === 'Rechazado'"
                    flat
                    round
                    dense
                    color="negative"
                    icon="report_problem"
                    @click="irADetalle(props.row)"
                  >
                    <q-tooltip>Ver Novedades y Bienes Pendientes</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-else-if="props.row.estado === 'Firmado' || props.row.estado === 'Finalizado'"
                    flat
                    round
                    dense
                    color="positive"
                    icon="verified"
                    @click="irADetalle(props.row)"
                  >
                    <q-tooltip>Paz y Salvo Aprobado - Ver Detalle y Firmas</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-else
                    flat
                    round
                    dense
                    color="warning"
                    icon="visibility"
                    @click="irADetalle(props.row)"
                  >
                    <q-tooltip>Consultar Estado de Revisión</q-tooltip>
                  </q-btn>
                </template>

                <!-- Para RESPONSABLE DE ÁREA y SUPERVISOR: Dictámenes y gestión -->
                <template v-else-if="pestanaBandeja === 'pendientes'">
                  <!-- Botón Firmar / Dictamen Positivo -->
                  <q-btn
                    flat
                    round
                    dense
                    color="positive"
                    icon="draw"
                    @click="seleccionarYFirmar(props.row)"
                  >
                    <q-tooltip>Firmar / Estampar Paz y Salvo</q-tooltip>
                  </q-btn>

                  <!-- Botón Rechazar / Novedad con Observaciones o Bienes Faltantes -->
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="report_problem"
                    @click="abrirModalRechazo(props.row)"
                  >
                    <q-tooltip>Rechazar con Observaciones / Novedad de Bienes</q-tooltip>
                  </q-btn>

                  <!-- Botón Revisar Detalle e Inventario -->
                  <q-btn
                    flat
                    round
                    dense
                    color="primary"
                    icon="inventory_2"
                    @click="irADetalle(props.row)"
                  >
                    <q-tooltip>Ver Detalle e Inventario de Bienes</q-tooltip>
                  </q-btn>
                </template>
                <q-btn
                  v-else
                  flat
                  round
                  dense
                  color="primary"
                  icon="visibility"
                  @click="irADetalle(props.row)"
                >
                  <q-tooltip>Ver dictamen y observaciones</q-tooltip>
                </q-btn>

                <!-- Botón Ver Certificado PDF (Siempre disponible) -->
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
      <!-- Tarjeta Información del Paz y Salvo y Bienes -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="q-pa-md">
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-secondary text-weight-bold">
                FORMATO GCCON-F-088 - PAZ Y SALVO CONTRACTUAL
              </div>
              <q-badge
                :color="
                  solicitudActual.estado === 'Firmado' || solicitudActual.estado === 'Finalizado'
                    ? 'positive'
                    : solicitudActual.estado === 'Rechazado'
                      ? 'negative'
                      : 'warning'
                "
                class="text-weight-bold q-pa-xs"
              >
                Estado: {{ solicitudActual.estado || 'En revisión' }}
              </q-badge>
            </div>
            <q-separator class="q-mb-md" />

            <!-- Banner Informativo si la Solicitud fue Rechazada -->
            <q-banner
              v-if="solicitudActual.estado === 'Rechazado'"
              rounded
              class="bg-red-1 text-negative q-mb-md border-negative"
            >
              <template #avatar>
                <q-icon name="error" color="negative" size="md" />
              </template>
              <div class="text-subtitle1 text-weight-bold">
                Dictamen con Observaciones / Trámite Rechazado
              </div>
              <div class="text-body2 q-mt-xs">
                <strong>Motivo / Novedad registrada:</strong>
                <div
                  class="q-pa-sm bg-white rounded-borders q-mt-xs text-grey-9 text-italic border-grey"
                >
                  "{{
                    solicitudActual.observacionRechazo ||
                    solicitudActual.observaciones_supervisor ||
                    'Bienes o requerimientos pendientes de entrega en el área correspondiente.'
                  }}"
                </div>
              </div>
            </q-banner>

            <div class="row q-col-gutter-sm text-body2">
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
            </div>

            <!-- Vista previa de firma estampada si ya se firmó -->
            <div v-if="firmaActual" class="q-mt-md q-pa-sm bg-grey-1 rounded-borders border-dashed">
              <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
                Firma Manuscrita Estampada para este documento:
              </div>
              <img
                :src="firmaActual"
                alt="Firma Estampada"
                style="max-height: 55px; max-width: 160px; object-fit: contain; display: block"
              />
            </div>

            <!-- Sección de Inventario de Bienes a Cargo -->
            <div class="q-mt-lg">
              <div class="row items-center justify-between q-mb-xs">
                <div class="text-subtitle1 text-weight-bold text-primary">
                  <q-icon name="inventory_2" class="q-mr-xs" />
                  Inventario de Bienes Asignados al Contratista
                </div>
                <q-badge color="primary">{{ listaBienes.length }} Elementos</q-badge>
              </div>
              <div class="text-caption text-grey-7 q-mb-sm">
                Verifique físicamente la devolución de cada elemento antes de otorgar el paz y
                salvo.
              </div>

              <q-table
                flat
                bordered
                dense
                :rows="listaBienes"
                :columns="columnasBienes"
                row-key="codigo_inventario"
                no-data-label="No se encontraron bienes asignados en el inventario de este contrato"
                :pagination="{ rowsPerPage: 5 }"
              >
                <template #body-cell-estado_entrega="bProps">
                  <q-td :props="bProps" class="text-center">
                    <q-badge
                      :color="
                        bProps.row.estado_entrega === 'Devuelto' || esFirmado
                          ? 'positive'
                          : solicitudActual.estado === 'Rechazado'
                            ? 'negative'
                            : 'warning'
                      "
                      class="text-weight-bold"
                    >
                      {{ bProps.row.estado_entrega || (esFirmado ? 'Devuelto' : 'Pendiente') }}
                    </q-badge>
                  </q-td>
                </template>
              </q-table>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tarjeta Gestión de Firmas y Dictámenes -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <q-card-section>
            <div class="text-h6 text-primary text-weight-bold">Estado de Firmas</div>
            <div class="text-caption text-grey-7 q-mb-sm">Aprobación por responsables de área</div>
            <q-separator class="q-mb-md" />

            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section v-if="historialDelContrato.length === 0" class="text-caption text-grey-7">
                  No hay dictámenes de área registrados para esta solicitud.
                </q-item-section>
              </q-item>
              <q-item v-for="firma in historialDelContrato" :key="firma.id">
                <q-item-section avatar>
                  <q-icon :name="iconoEstadoFirma(firma.estado)" :color="colorEstadoFirma(firma.estado)" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ firma.area }}</q-item-label>
                  <q-item-label caption>
                    {{ firma.estado }} · {{ firma.usuarioFirma || 'Sin firmante registrado' }}
                    · {{ firma.fechaFirma ? new Date(firma.fechaFirma).toLocaleDateString() : 'Sin fecha' }}
                  </q-item-label>
                  <q-item-label v-if="firma.observacionRechazo" caption class="text-negative">
                    Observación: {{ firma.observacionRechazo }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Acciones para CONTRATISTA -->
            <div v-if="esContratista" class="q-mt-lg column q-gutter-sm">
              <div
                v-if="solicitudActual.estado === 'Rechazado'"
                class="q-pa-sm bg-red-1 rounded-borders border-negative"
              >
                <div class="text-caption text-weight-bold text-negative">
                  <q-icon name="block" class="q-mr-xs" /> Firma retenida por novedades
                </div>
                <div class="text-caption text-grey-8">
                  Debe entregar o subsanar los bienes requeridos en la dependencia para que el área
                  reactive su trámite.
                </div>
              </div>
              <div v-else-if="!esFirmado" class="q-pa-sm bg-amber-1 rounded-borders border-warning">
                <div class="text-caption text-weight-bold text-amber-9">
                  <q-icon name="pending" class="q-mr-xs" /> En revisión de bienes
                </div>
                <div class="text-caption text-grey-8">
                  El responsable de área está validando el inventario. Una vez aprobado, se
                  habilitará su firma de cierre.
                </div>
              </div>

              <!-- Botón Firmar Contratista (Se habilita cuando está en orden) -->
              <q-btn
                v-if="solicitudActual.estado !== 'Rechazado'"
                color="positive"
                icon="draw"
                :label="
                  firmaActual
                    ? 'Modificar Firma del Contratista'
                    : 'Estampar Firma del Contratista (Cierre GCCON-F-088)'
                "
                unelevated
                class="full-width text-weight-bold"
                @click="abrirModalFirma"
              />
              <q-btn
                v-else
                disable
                color="grey-6"
                icon="lock"
                label="Firma Retenida por Novedades"
                unelevated
                class="full-width"
              />

              <!-- Botón Ver PDF -->
              <q-btn
                outline
                color="red-7"
                icon="picture_as_pdf"
                label="Ver / Descargar PDF Oficial"
                class="full-width"
                @click="imprimirCertificado"
              />
            </div>

            <!-- Acciones para RESPONSABLE DE ÁREA -->
            <div v-else-if="esResponsableArea" class="q-mt-lg column q-gutter-sm">
              <!-- Botón Firmar / Dictamen Positivo de Área -->
              <q-btn
                color="positive"
                icon="draw"
                :label="
                  esFirmado
                    ? 'Dictamen Aprobado (Firmado)'
                    : 'Aprobar y Firmar Paz y Salvo del Área'
                "
                :disable="esFirmado"
                unelevated
                class="full-width text-weight-bold"
                @click="abrirModalFirma"
              />

              <!-- Botón Rechazar con Observaciones / Novedad de Bienes -->
              <q-btn
                outline
                color="negative"
                icon="report_problem"
                label="Rechazar / Novedad de Bienes"
                class="full-width text-weight-bold"
                @click="abrirModalRechazo(solicitudActual)"
              />

              <!-- Botón Ver PDF -->
              <q-btn
                outline
                color="red-7"
                icon="picture_as_pdf"
                label="Ver Certificado PDF"
                class="full-width"
                @click="imprimirCertificado"
              />
            </div>

            <!-- Acciones para SUPERVISOR Y ADMINISTRADOR -->
            <div v-else-if="esSupervisorOAdmin" class="q-mt-lg column q-gutter-sm">
              <q-btn
                color="positive"
                icon="draw"
                :label="esFirmado ? 'Firmar / Estampar' : 'Firmar Paz y Salvo'"
                unelevated
                class="full-width text-weight-bold"
                @click="abrirModalFirma"
              />
              <q-btn
                outline
                color="negative"
                icon="report_problem"
                label="Rechazar / Novedad de Bienes"
                class="full-width text-weight-bold"
                @click="abrirModalRechazo(solicitudActual)"
              />
              <q-btn
                outline
                color="red-7"
                icon="picture_as_pdf"
                label="Ver Certificado PDF"
                class="full-width"
                @click="imprimirCertificado"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Diálogo con Canvas para Dibujar y Capturar la Firma -->
    <q-dialog v-model="dialogoFirma" persistent>
      <q-card style="min-width: 480px; max-width: 90vw">
        <q-card-section class="bg-primary text-white row items-center justify-between">
          <div class="text-h6">
            <q-icon name="draw" class="q-mr-sm" />
            Estampar Firma Manuscrita
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-8 q-mb-sm">
            Dibuje su firma en el recuadro. Por seguridad y cumplimiento de la normativa SENA, la
            firma <strong>no se almacena en la base de datos</strong>; se estampa directamente en el
            archivo PDF oficial.
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
            @click="solicitarConfirmacionFirma"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo / Pantalla de Observaciones y Novedad de Bienes -->
    <q-dialog v-model="dialogoRechazo" persistent>
      <q-card style="min-width: 520px; max-width: 90vw">
        <q-card-section class="bg-negative text-white row items-center justify-between">
          <div class="text-h6 text-weight-bold">
            <q-icon name="report_problem" class="q-mr-sm" />
            Dictamen con Observaciones / Rechazo de Firma
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-8 q-mb-md">
            Si el contratista tiene bienes pendientes de devolución en su área, elementos dañados o
            soporte incompleto, emita este dictamen negativo. El trámite pasará a estado
            <strong>Rechazado</strong> y se notificará para su subsanación.
          </div>

          <!-- Resumen de la Solicitud -->
          <q-card flat bordered class="bg-grey-1 q-pa-sm q-mb-md">
            <div class="row q-col-gutter-xs text-caption">
              <div class="col-12 col-sm-6">
                <strong>Solicitud:</strong>
                {{ solicitudRechazar?.numeroSolicitud || solicitudRechazar?.numeroContrato || '—' }}
              </div>
              <div class="col-12 col-sm-6">
                <strong>Contrato:</strong>
                {{ solicitudRechazar?.numeroContrato || solicitudRechazar?.contrato || '—' }}
              </div>
              <div class="col-12">
                <strong>Contratista:</strong>
                {{ solicitudRechazar?.contratista || solicitudRechazar?.nombreContratista || '—' }}
              </div>
              <div class="col-12">
                <strong>Dependencia:</strong>
                {{ solicitudRechazar?.dependencia || '—' }}
              </div>
            </div>
          </q-card>

          <!-- Motivo Principal -->
          <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-xs">
            Motivo principal de la novedad / no paz y salvo *:
          </div>
          <q-select
            outlined
            dense
            v-model="motivoSeleccionado"
            :options="opcionesMotivos"
            label="Seleccione el motivo de la novedad"
            class="q-mb-md"
            @update:model-value="alCambiarMotivo"
          />

          <!-- Lista de Bienes con Checkbox para marcar faltantes -->
          <div v-if="bienesParaRechazo.length > 0" class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-xs">
              Marque los bienes específicos que presentan novedad o están pendientes:
            </div>
            <q-list bordered separator dense class="rounded-borders">
              <q-item
                v-for="(bien, idx) in bienesParaRechazo"
                :key="idx"
                tag="label"
                v-ripple
                class="q-py-xs"
              >
                <q-item-section side top>
                  <q-checkbox
                    v-model="bien.marcadoFaltante"
                    color="negative"
                    @update:model-value="alCambiarCheckBien"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium text-body2">
                    {{ bien.descripcion || bien.nombre }}
                  </q-item-label>
                  <q-item-label caption>
                    Placa/Código: {{ bien.codigo_inventario || bien.codigo || 'S/C' }} | Estado
                    físico: {{ bien.estado_bien || 'Bueno' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="bien.marcadoFaltante ? 'negative' : 'grey-5'">
                    {{ bien.marcadoFaltante ? 'Pendiente' : 'OK' }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Observaciones Detalladas -->
          <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-xs">
            Observaciones detalladas para el contratista y supervisor *:
          </div>
          <q-input
            v-model="textoObservacionesRechazo"
            outlined
            type="textarea"
            rows="3"
            placeholder="Describa claramente los elementos pendientes por devolver o la justificación del no paz y salvo..."
            :rules="[
              (val) =>
                (!!val && val.trim().length >= 5) ||
                'Ingrese una observación detallada de al menos 5 caracteres',
            ]"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            color="negative"
            icon="send"
            label="Confirmar y Emitir Dictamen de Rechazo"
            :loading="guardandoRechazo"
            @click="confirmarDictamenRechazo"
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
import { useAuthStore } from '../stores/authStore.js'
import { listarPendientes, listarHistorial } from '../services/firmaService.js'
import { misSolicitudes, obtenerContrato } from '../services/contratoService.js'
import FirmaCanvas from '../components/FirmaCanvas.vue'
import api from '../services/api'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const esContratista = computed(() => auth.rolUsuario === 'Contratista')
const esResponsableArea = computed(() => auth.rolUsuario === 'ResponsableArea')
const esSupervisorOAdmin = computed(() => auth.tienePermiso(['Administrador']))
const pestanaBandeja = ref('pendientes')
const cargandoBandeja = ref(false)
const solicitudesPendientes = ref([])
const solicitudesHistorial = ref([])
const solicitudesContratista = ref([])

const solicitudesParaBandeja = computed(() => {
  if (esContratista.value) return solicitudesContratista.value
  return pestanaBandeja.value === 'historial'
    ? solicitudesHistorial.value
    : solicitudesPendientes.value
})

const dialogoFirma = ref(false)
const dialogoRechazo = ref(false)
const canvasRef = ref(null)
const procesandoFirma = ref(false)
const guardandoRechazo = ref(false)
const firmaActual = ref(null)

const solicitudRechazar = ref(null)
const motivoSeleccionado = ref('Bienes o inventario pendiente por entregar / devolver')
const textoObservacionesRechazo = ref('')
const bienesParaRechazo = ref([])

const opcionesMotivos = [
  'Bienes o inventario pendiente por entregar / devolver',
  'Equipo o herramienta devuelta con daños o incompleta',
  'Falta carnet institucional o credencial de acceso',
  'Documentación o informe de entregables contractuales pendiente',
  'Otro motivo / Novedad administrativa en el área',
]

const columnasBandeja = [
  {
    name: 'solicitud',
    label: 'Código Solicitud',
    field: (row) => row.numeroSolicitud || row.solicitud || row.codigo || '—',
    align: 'left',
  },
  {
    name: 'contrato',
    label: 'Contrato',
    field: (row) => row.numeroContrato || row.contrato || '—',
    align: 'left',
  },
  {
    name: 'contratista',
    label: 'Contratista',
    field: (row) => row.contratista || row.nombreContratista || '—',
    align: 'left',
  },
  {
    name: 'dependencia',
    label: 'Área',
    field: (row) => row.dependencia || row.nombreDependencia || '—',
    align: 'left',
  },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  {
    name: 'observacion',
    label: 'Observaciones',
    field: (row) => row.observacionRechazo || '—',
    align: 'left',
  },
  { name: 'acciones', label: 'Acciones', align: 'center' },
]

const columnasBienes = [
  {
    name: 'codigo',
    label: 'Código / Inventario',
    field: (row) => row.codigo_inventario || row.codigo || 'S/C',
    align: 'left',
  },
  {
    name: 'descripcion',
    label: 'Descripción del Bien',
    field: (row) => row.descripcion || row.nombre || '—',
    align: 'left',
  },
  { name: 'cantidad', label: 'Cantidad', field: (row) => row.cantidad || 1, align: 'center' },
  {
    name: 'estado_bien',
    label: 'Estado Físico',
    field: (row) => row.estado_bien || 'Bueno',
    align: 'center',
  },
  { name: 'estado_entrega', label: 'Estado Devolución', field: 'estado_entrega', align: 'center' },
]

// Obtener el código enviado por query params: /app/firmas?codigo=SOL-2026-001
const codigoSolicitud = computed(() => route.query.codigo)

const solicitudActual = computed(() => {
  if (!codigoSolicitud.value) return null
  const lista = [
    ...solicitudesPendientes.value,
    ...solicitudesHistorial.value,
    ...solicitudesContratista.value,
  ]
  return lista.find((solicitud) =>
    [solicitud._id, solicitud.numeroSolicitud, solicitud.numeroContrato].some(
      (valor) => String(valor || '') === String(codigoSolicitud.value),
    ),
  ) || null
})

const historialDelContrato = computed(() => {
  const contratoId = solicitudActual.value?._id
  if (!contratoId) return []
  const registros = [...solicitudesPendientes.value, ...solicitudesHistorial.value]
    .filter((firma) => String(firma._id) === String(contratoId))
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  return registros
})

const esFirmado = computed(() => {
  const est = solicitudActual.value?.estado
  return est === 'Firmado' || est === 'Finalizado' || est === 'Aprobado'
})

const listaBienes = computed(() => {
  if (!solicitudActual.value) return []
  return Array.isArray(solicitudActual.value.bienes) ? solicitudActual.value.bienes : []
})

function codigoSolicitudDeContrato(numeroContrato) {
  const digitos = String(numeroContrato || '').replace(/\D/g, '').slice(-4)
  return digitos ? `SOL-${digitos.padStart(4, '0')}` : '—'
}

function mapearTraza(registro) {
  const contrato = registro.contrato_id || {}
  const numeroContrato = contrato.numero_contrato || '—'
  const area = registro.area_id?.nombre_dependencia || 'Área sin nombre'
  return {
    ...contrato,
    id: registro._id,
    numeroSolicitud: codigoSolicitudDeContrato(numeroContrato),
    numeroContrato,
    contratista: contrato.nombre_contratista || '—',
    dependencia: area,
    estado: registro.estado || 'Pendiente',
    observacionRechazo: registro.observacion_rechazo || '',
    fechaFirma: registro.fecha_firma,
    usuarioFirma: registro.usuario_id?.nombre_completo || '',
    area,
    createdAt: registro.createdAt,
    bienes: [],
  }
}

function mapearContratoContratista(contrato) {
  const numeroContrato = contrato.numero_contrato || '—'
  return {
    ...contrato,
    id: contrato._id,
    numeroSolicitud: codigoSolicitudDeContrato(numeroContrato),
    numeroContrato,
    contratista: contrato.nombre_contratista || '—',
    dependencia: contrato.dependencia?.nombre_dependencia || '—',
    observacionRechazo: contrato.observaciones_supervisor || '',
    bienes: [],
  }
}

async function cargarBandeja() {
  cargandoBandeja.value = true
  try {
    if (esContratista.value) {
      const data = await misSolicitudes()
      const lista = Array.isArray(data) ? data : data?.contratos || []
      solicitudesContratista.value = lista.map(mapearContratoContratista)
      solicitudesPendientes.value = []
      solicitudesHistorial.value = []
      return
    }

    const [pendientes, historial] = await Promise.all([
      listarPendientes(),
      listarHistorial(),
    ])
    solicitudesPendientes.value = (Array.isArray(pendientes) ? pendientes : []).map(mapearTraza)
    solicitudesHistorial.value = (Array.isArray(historial) ? historial : []).map(mapearTraza)
  } catch (error) {
    solicitudesPendientes.value = []
    solicitudesHistorial.value = []
    solicitudesContratista.value = []
    $q.notify({
      type: 'negative',
      message: 'No se pudo cargar la bandeja de firmas: ' + (error.response?.data?.mensaje || error.message),
    })
  } finally {
    cargandoBandeja.value = false
  }
}

async function cargarDetalleSeleccionado() {
  const solicitud = solicitudActual.value
  if (!solicitud?._id) return
  try {
    const data = await obtenerContrato(solicitud._id)
    const contrato = data.contrato || data
    Object.assign(solicitud, contrato, {
      id: solicitud.id,
      numeroSolicitud: solicitud.numeroSolicitud,
      numeroContrato: contrato.numero_contrato || solicitud.numeroContrato,
      contratista: contrato.nombre_contratista || solicitud.contratista,
      dependencia: solicitud.dependencia,
      estado: solicitud.estado,
      observacionRechazo: solicitud.observacionRechazo,
      fechaFirma: solicitud.fechaFirma,
      usuarioFirma: solicitud.usuarioFirma,
      area: solicitud.area,
      bienes: Array.isArray(data.bienes) ? data.bienes : [],
    })
  } catch (error) {
    console.warn('No se pudo cargar el detalle de la solicitud:', error.message)
  }
}

function colorEstadoFirma(estado) {
  if (estado === 'Aprobado' || estado === 'Finalizado') return 'positive'
  if (estado === 'Rechazado') return 'negative'
  if (estado === 'Cancelado') return 'grey-7'
  return 'warning'
}

function iconoEstadoFirma(estado) {
  if (estado === 'Aprobado' || estado === 'Finalizado') return 'check_circle'
  if (estado === 'Rechazado') return 'cancel'
  if (estado === 'Cancelado') return 'block'
  return 'pending'
}

onMounted(async () => {
  await cargarBandeja()
  cargarFirmaLocal()
  await cargarDetalleSeleccionado()
})

function cargarFirmaLocal() {
  if (codigoSolicitud.value) {
    const f = localStorage.getItem(`firma_${codigoSolicitud.value}`)
    if (f) firmaActual.value = f
  }
}

function volverALista() {
  router.push({ name: 'firmas' })
}

function irADetalle(fila) {
  const cod =
    fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato
  router.push({ name: 'firmas', query: { codigo: cod } })
}

function abrirModalFirma() {
  dialogoFirma.value = true
}

function seleccionarYFirmar(fila) {
  const cod =
    fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato
  router.push({ name: 'firmas', query: { codigo: cod } })
  setTimeout(() => {
    dialogoFirma.value = true
  }, 200)
}

function verPdfFila(fila) {
  const cod =
    fila.numeroSolicitud || fila.solicitud || fila.codigo || fila.numeroContrato || fila.contrato
  router.push({ name: 'certificado-pdf', query: { codigo: cod } })
}

async function abrirModalRechazo(fila) {
  solicitudRechazar.value = fila
  motivoSeleccionado.value = 'Bienes o inventario pendiente por entregar / devolver'
  let bienesOrigen = Array.isArray(fila.bienes) ? fila.bienes : []
  if (bienesOrigen.length === 0 && fila._id) {
    try {
      const data = await obtenerContrato(fila._id)
      bienesOrigen = Array.isArray(data.bienes) ? data.bienes : []
      fila.bienes = bienesOrigen
    } catch (error) {
      console.warn('No se pudo cargar el inventario del contrato:', error.message)
    }
  }
  bienesParaRechazo.value = bienesOrigen.map((b) => ({
    ...b,
    marcadoFaltante: true,
  }))
  textoObservacionesRechazo.value = ''

  dialogoRechazo.value = true
}

function alCambiarMotivo(nuevoMotivo) {
  if (nuevoMotivo === 'Bienes o inventario pendiente por entregar / devolver') {
    const marcados = bienesParaRechazo.value
      .filter((b) => b.marcadoFaltante)
      .map((b) => b.descripcion)
    textoObservacionesRechazo.value =
      marcados.length > 0
        ? `Pendiente entrega y devolución física de: ${marcados.join(', ')}.`
        : 'Pendiente devolución de inventario institucional a cargo en el área.'
  } else if (nuevoMotivo === 'Falta carnet institucional o credencial de acceso') {
    textoObservacionesRechazo.value =
      'El contratista tiene pendiente la devolución del carnet institucional y credenciales de acceso a las instalaciones.'
  } else if (nuevoMotivo === 'Equipo o herramienta devuelta con daños o incompleta') {
    textoObservacionesRechazo.value =
      'Los elementos devueltos presentan daños físicos o componentes faltantes (cargador/periféricos) pendientes de subsanar.'
  } else if (nuevoMotivo === 'Documentación o informe de entregables contractuales pendiente') {
    textoObservacionesRechazo.value =
      'Falta presentar los soportes e informe final de ejecución contractual ante la supervisión.'
  }
}

function alCambiarCheckBien() {
  const marcados = bienesParaRechazo.value
    .filter((b) => b.marcadoFaltante)
    .map((b) => `${b.descripcion} (${b.codigo_inventario || 'S/C'})`)
  if (marcados.length > 0) {
    textoObservacionesRechazo.value = `El contratista tiene pendiente la devolución en el área de los siguientes bienes: ${marcados.join(', ')}.`
  } else {
    textoObservacionesRechazo.value =
      'Novedad registrada en el área: No se concede el paz y salvo por requerimientos pendientes.'
  }
}

async function confirmarDictamenRechazo() {
  if (!textoObservacionesRechazo.value || textoObservacionesRechazo.value.trim().length < 5) {
    $q.notify({
      type: 'warning',
      message: 'Por favor describa las observaciones detalladas del rechazo.',
    })
    return
  }

  guardandoRechazo.value = true
  try {
    const contratoId = solicitudRechazar.value?._id
    if (!contratoId) throw new Error('No se encontró el contrato de la solicitud.')
    await api.post('/firmas/procesar', {
      contratoId,
      accion: 'Rechazar',
      observacion_rechazo: textoObservacionesRechazo.value.trim(),
    })
    await cargarBandeja()

    dialogoRechazo.value = false
    $q.notify({
      type: 'warning',
      icon: 'report_problem',
      message: 'Dictamen registrado exitosamente: Solicitud rechazada con observaciones.',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Error al registrar el dictamen de rechazo: ' + (err.message || ''),
    })
  } finally {
    guardandoRechazo.value = false
  }
}

function solicitarConfirmacionFirma() {
  $q.dialog({
    title: 'Confirmación de Firma (GCCON-F-088)',
    message: esContratista.value
      ? '¿Confirma que desea estampar su firma como contratista para dar constancia de recibo y cierre de este trámite? (RF-010)'
      : '¿Confirma que desea emitir y registrar su dictamen de firma y paz y salvo para este contrato? (RF-008)',
    ok: {
      label: 'Sí, Confirmar y Estampar',
      color: 'positive',
      icon: 'verified',
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-8',
    },
    persistent: true,
  }).onOk(() => {
    confirmarFirma()
  })
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
    if (!esContratista.value) {
      const contratoId = solicitudActual.value?._id
      if (!contratoId) throw new Error('No se encontró el contrato de la solicitud.')
      const firmaBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      await api.post('/firmas/procesar', {
        contratoId,
        accion: 'Aprobar',
        firma_base64: firmaBase64,
      })
      await cargarBandeja()
    }

    dialogoFirma.value = false
    $q.notify({
      type: 'positive',
      icon: 'verified',
      message: esContratista.value
        ? '¡Firma del contratista estampada exitosamente! Ya puede descargar su PDF oficial (RF-010).'
        : 'Paz y salvo de área registrado exitosamente (RF-008). Trámite habilitado para firma del contratista.',
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

.border-negative {
  border: 1px solid #ef5350;
}

.border-grey {
  border: 1px solid #e0e0e0;
}
</style>
