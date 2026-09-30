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

      <!-- Columna de Acciones -->
      <template #body-cell-acciones="props">
        <q-td :props="props" class="q-gutter-xs text-center">
          <q-btn
            v-if="puedeFirmar"
            flat
            round
            dense
            :color="props.row.estado === 'Rechazado' ? 'grey-6' : 'positive'"
            :icon="props.row.estado === 'Rechazado' ? 'block' : 'draw'"
            @click="irAFirmar(props.row)"
          >
            <q-tooltip>{{
              props.row.estado === 'Rechazado'
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

          <q-btn flat round dense color="primary" icon="edit" @click="editarSolicitud(props.row)">
            <q-tooltip>Editar</q-tooltip>
          </q-btn>

          <!-- Acción de Estado (Reactivar si está Rechazado, Desactivar / Rechazar si está en Revisión/Firmado) -->
          <q-btn
            v-if="props.row.estado === 'Rechazado'"
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
            v-else
            flat
            round
            dense
            color="negative"
            icon="block"
            @click="abrirDialogoEstado(props.row, 'Rechazado')"
          >
            <q-tooltip>Desactivar / Rechazar</q-tooltip>
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

    <!-- Diálogo Confirmar Cambio de Estado (Desactivar / Rechazar o Reactivar) -->
    <q-dialog v-model="dialogoEstado" persistent>
      <q-card style="min-width: 420px; max-width: 90vw">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="nuevoEstadoObjetivo === 'Rechazado' ? 'block' : 'replay'"
            :color="nuevoEstadoObjetivo === 'Rechazado' ? 'negative' : 'positive'"
            text-color="white"
            class="q-mr-sm"
          />
          <span class="text-h6 text-weight-bold">
            {{
              nuevoEstadoObjetivo === 'Rechazado'
                ? 'Desactivar / Rechazar Solicitud'
                : 'Reactivar Solicitud'
            }}
          </span>
        </q-card-section>

        <q-card-section class="q-pt-none text-body2">
          <div v-if="nuevoEstadoObjetivo === 'Rechazado'">
            <p>
              ¿Está seguro de desactivar o rechazar la solicitud
              <strong>{{ solicitudSeleccionada?.numeroSolicitud || solicitudSeleccionada?.numeroContrato }}</strong>?
            </p>
            <p class="text-grey-8">
              El estado de la solicitud cambiará inmediatamente a
              <q-badge color="negative" class="text-weight-bold">Rechazado</q-badge>.
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
              El estado volverá a
              <q-badge color="primary" class="text-weight-bold">En revisión</q-badge>
              para continuar con el proceso.
            </p>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            :color="nuevoEstadoObjetivo === 'Rechazado' ? 'negative' : 'positive'"
            :label="nuevoEstadoObjetivo === 'Rechazado' ? 'Desactivar / Rechazar' : 'Reactivar'"
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
import { listarContratos /*, actualizarContrato, cancelarContrato */ } from '../services/contratoService.js'
// eslint-disable-next-line no-unused-vars
import { getErrorMessage } from '../services/api.js'

// eslint-disable-next-line no-unused-vars
const $q = useQuasar()
// eslint-disable-next-line no-unused-vars
const router = useRouter()
const auth = useAuthStore()

const cargando = ref(false)
const puedeFirmar = computed(() =>
  auth.tienePermiso(['ResponsableArea', 'Contratista', 'Supervisor', 'Administrador']),
)

const OPCIONES_ESTADO = ['En revisión', 'Firmado', 'Rechazado', 'Finalizado']

const formRef = ref(null)
const filtro = ref('')
const dialogo = ref(false)
const dialogoEstado = ref(false)

const editando = ref(false)
// eslint-disable-next-line no-unused-vars
const codigoEditar = ref(null)
const solicitudSeleccionada = ref(null)
const nuevoEstadoObjetivo = ref('')
const motivoEstado = ref('')

const rows = ref([])

const solicitud = ref({
  numeroSolicitud: '',
  numeroContrato: '',
  contratista: '',
  dependencia: '',
  responsable: '',
  fecha: new Date().toISOString().substring(0, 10),
  estado: 'En revisión',
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

async function cargarSolicitudes() {
  cargando.value = true
  try {
    const data = await listarContratos()
    const lista = Array.isArray(data) ? data : data?.contratos || data?.data || []
    // Transformar datos del backend al formato de la tabla
    rows.value = lista.map((c, idx) => {
      const num = c.numero_contrato || `CNT-${idx + 1}`
      const nom = c.nombre_contratista || c.usuario?.nombre_completo || 'Contratista'
      const dep = c.dependencia?.nombre_dependencia || (typeof c.dependencia === 'string' ? c.dependencia : 'Gestión Tecnológica')
      const sup = c.supervisor?.nombre_completo || 'Supervisor Asignado'
      const fch = c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]

      let est = 'En revisión'
      if (c.estado === 'Firmado' || c.estado === 'Aprobado') {
        est = 'Firmado'
      } else if (c.estado === 'Finalizado') {
        est = 'Finalizado'
      } else if (c.estado === 'Rechazado') {
        est = 'Rechazado'
      } else {
        est = 'En revisión'
      }

      return {
        _id: c._id,
        id: num,
        numeroSolicitud: `SOL-${String(num).replace(/\D/g, '').slice(-4).padStart(4, '0') || '00' + (idx + 1)}`,
        documentoContratista: c.telefono || '—',
        contratista: nom,
        nombreContratista: nom,
        numeroContrato: num,
        dependencia: dep,
        responsable: sup,
        fecha: fch,
        fechaSolicitud: fch,
        estado: est,
        observacionRechazo: c.observaciones_supervisor || c.observacion_rechazo || '',
        bienes:
          Array.isArray(c.bienes) && c.bienes.length > 0
            ? c.bienes
            : [
                {
                  descripcion: 'Equipo de cómputo y periféricos institucionales',
                  codigo_inventario: `INV-${String(num).replace(/\D/g, '').slice(-4).padStart(4, '0') || '1042'}`,
                  estado_bien: 'Bueno',
                  cantidad: 1,
                  estado_entrega:
                    est === 'Firmado' || est === 'Finalizado' ? 'Devuelto' : 'Pendiente',
                },
              ],
        firmas: [
          {
            dependenciaCodigo: 'DEP-01',
            dependenciaNombre: dep,
            firmada: est === 'Firmado' || est === 'Finalizado',
            fechaFirma: est === 'Firmado' || est === 'Finalizado' ? fch : null,
          },
        ],
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
