<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Plantillas</div>
        <div class="text-subtitle2 text-grey-7">
          Selecciona la plantilla de dependencias y firmantes que aplica a cada contrato
        </div>
      </div>

      <q-select
        v-model="plantillaPredeterminada"
        :options="opcionesPlantilla"
        option-label="label"
        emit-value
        map-options
        outlined
        dense
        style="min-width: 320px"
        label="Plantilla predeterminada (Coordinador)"
        @update:model-value="guardarPredeterminada"
      >
        <template #prepend>
          <q-icon name="tune" color="primary" />
        </template>
      </q-select>
    </div>

    <q-banner rounded dense class="bg-blue-1 text-primary q-mb-md">
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>
      <div class="text-caption">
        <strong>Plantillas y firmantes:</strong> la plantilla define qué dependencias firman en cada
        contrato y quiénes son los responsables autorizados. El contratista ve en su certificado la
        plantilla que você (Coordinador) selections.
      </div>
    </q-banner>

    <q-table
      title="Contratos bajo mi coordinación"
      :rows="contratos"
      :columns="columns"
      row-key="_id"
      flat
      bordered
      :loading="cargando"
      no-data-label="No hay contratos asignados"
    >
      <template #body-cell-plantilla="props">
        <q-td :props="props">
          <q-badge color="teal-1" text-color="teal-9" class="q-pa-xs text-weight-bold">
            {{ nombrePlantilla(props.row.plantilla_tipo) }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="assignment_turned_in"
            @click="abrirPlantilla(props.row)"
          >
            <q-tooltip>Configurar plantilla y firmantes</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo de configuración de plantilla -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 900px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-primary text-weight-bold">
              Plantilla y firmantes — {{ contratoSeleccionado?.numero_contrato }}
            </div>
            <div class="text-caption text-grey-7">
              {{ contratoSeleccionado?.nombre_contratista }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cerrarDialogo" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-select
            v-model="tipoSeleccionado"
            :options="opcionesPlantilla"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            label="Plantilla que aplica al contrato"
            hint="Al cambiar la plantilla se ajustan las dependencias aplicables; puede modificarlas una a una"
            class="q-mb-md"
          />

          <q-table
            flat
            bordered
            dense
            :rows="filas"
            :columns="columnasFilas"
            row-key="id_fila"
            no-data-label="No hay filas de dependencias"
          >
            <template #body-cell-aplica="props">
              <q-td :props="props">
                <q-toggle v-model="props.row.aplica" color="positive" />
              </q-td>
            </template>

            <template #body-cell-encargado="props">
              <q-td :props="props">
                <div v-if="props.row.encargados && props.row.encargados.length" class="q-gutter-xs">
                  <q-badge
                    v-for="enc in props.row.encargados"
                    :key="enc.id"
                    color="blue-1"
                    text-color="blue-9"
                    class="q-pa-xs"
                  >
                    {{ enc.nombre }}
                  </q-badge>
                </div>
                <span v-else class="text-caption text-grey-6">
                  Sin responsable asignado
                </span>
              </q-td>
            </template>

            <template #body-cell-responsables="props">
              <q-td :props="props">
                <q-select
                  v-model="props.row.responsables"
                  :options="opcionesUsuarios"
                  option-label="etiqueta"
                  multiple
                  use-chips
                  outlined
                  dense
                  emit-value
                  map-options
                  :disable="!props.row.aplica"
                  placeholder="Seleccione los responsables que firman"
                  @update:model-value="actualizarEncargadosDeFila(props.row)"
                >
                  <template #prepend>
                    <q-icon name="badge" color="primary" />
                  </template>
                </q-select>
                <div class="text-caption text-grey-7 q-mt-xs">
                  {{ props.row.dependenciaSimple }}
                  <span v-if="props.row.dependencia_nombre">
                    — {{ props.row.dependencia_nombre }}
                  </span>
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" @click="cerrarDialogo" :disable="guardando" />
          <q-btn
            unelevated
            color="positive"
            icon="save"
            label="Guardar Plantilla"
            @click="guardarPlantilla"
            :loading="guardando"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore.js'

const $q = useQuasar()
const auth = useAuthStore()

const contratos = ref([])
const cargando = ref(false)
const guardando = ref(false)
const dialogo = ref(false)
const contratoSeleccionado = ref(null)
const tipoSeleccionado = ref('COMPLETA')
const filas = ref([])
const plantillaPredeterminada = ref('COMPLETA')

const definicionesPlantilla = [
  {
    label: 'Plantilla Completa Institucional (14 Dependencias)',
    value: 'COMPLETA',
    filasAplica: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  },
  {
    label: 'Servicios Profesionales / Apoyo a la Gestión (7 Dependencias)',
    value: 'SERVICIOS_PROFESIONALES',
    filasAplica: [1, 2, 3, 4, 6, 7, 14],
  },
  {
    label: 'Instructores y Formación Profesional (7 Dependencias)',
    value: 'INSTRUCTORES',
    filasAplica: [1, 3, 4, 8, 9, 13, 14],
  },
  {
    label: 'Plantilla Personalizada (Configuración a Medida)',
    value: 'PERSONALIZADA',
    filasAplica: null,
  },
]

const opcionesPlantilla = definicionesPlantilla.map((p) => ({ label: p.label, value: p.value }))

const opcionesUsuarios = ref([])

const columns = [
  { name: 'numero_contrato', label: 'Contrato', field: 'numero_contrato', align: 'left', sortable: true },
  { name: 'nombre_contratista', label: 'Contratista', field: 'nombre_contratista', align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center', sortable: true },
  { name: 'plantilla', label: 'Plantilla', field: 'plantilla_tipo', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
]

const columnasFilas = [
  { name: 'aplica', label: 'Firma', field: 'aplica', align: 'center' },
  { name: 'dependenciaSimple', label: 'Dependencia', field: 'dependenciaSimple', align: 'left' },
  { name: 'encargado', label: 'Responsable (encargado de firmar)', field: 'encargado', align: 'left' },
  { name: 'responsables', label: 'Editar firmantes', field: 'responsables', align: 'left' },
]

function nombrePlantilla(tipo) {
  return definicionesPlantilla.find((p) => p.value === tipo)?.label || 'Sin plantilla'
}

async function cargarUsuarios() {
  const opciones = []
  const vistos = new Set()
  for (const rol of ['ResponsableArea', 'Supervisor']) {
    try {
      const resp = await api.get(`/usuarios?rol=${rol}`)
      const lista = Array.isArray(resp.data) ? resp.data : resp.data?.usuarios || []
      lista.forEach((u) => {
        const id = String(u._id || u.id || '')
        if (!id || vistos.has(id)) return
        vistos.add(id)
        const nombre = u.nombre_completo || u.nombre || 'Usuario'
        const etiqueta = `${nombre} — ${rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área'}`
        opciones.push({
          id,
          label: etiqueta,
          etiqueta,
          nombre,
          correo: u.correo_institucional || u.correo || '',
          rol: u.rol,
        })
      })
    } catch {
      // se continua con los roles disponibles
    }
  }
  opcionesUsuarios.value = opciones
}

async function cargarContratos() {
  cargando.value = true
  try {
    const resp = await api.get('/contratos')
    const lista = Array.isArray(resp.data) ? resp.data : resp.data?.contratos || []
    contratos.value = lista
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.mensaje || 'No se pudieron cargar los contratos.',
    })
  } finally {
    cargando.value = false
  }
}

// Calcula los responsables visibles de cada fila (persona encargada de firmar esa dependencia)
function calcularEncargados(filas) {
  const opciones = new Map(opcionesUsuarios.value.map((u) => [String(u.id), u]))
  return (filas || []).map((fila) => {
    const ids = (fila.responsables || []).map((r) => String(r.id || r._id || r)).filter(Boolean)
    const nombres = (fila.nombres || []).filter(Boolean)
    const encargados = ids.map((id, i) => {
      const opcion = opciones.get(id)
      return {
        id,
        nombre: opcion?.nombre || nombres[i] || id,
        correo: opcion?.correo || '',
      }
    })
    return { ...fila, encargados }
  })
}

async function abrirPlantilla(contrato) {
  contratoSeleccionado.value = contrato
  dialogo.value = true
  guardando.value = false
  try {
    const resp = await api.get(`/contratos/${contrato._id}/plantilla`)
    tipoSeleccionado.value = resp.data?.tipo || contrato.plantilla_tipo || 'COMPLETA'
    filas.value = calcularEncargados(
      (resp.data?.filas || []).map((fila) => ({
        ...fila,
        responsables: (fila.responsables || []).map((r) => String(r.id || r._id || r)),
      })),
    )
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.mensaje || 'No se pudo cargar la plantilla del contrato.',
    })
  }
}

// Actualiza al instante el responsable visible de la fila editada
function actualizarEncargadosDeFila(fila) {
  const opciones = new Map(opcionesUsuarios.value.map((u) => [String(u.id), u]))
  const ids = (fila.responsables || []).map((r) => String(r.id || r._id || r)).filter(Boolean)
  fila.encargados = ids.map((id) => {
    const opcion = opciones.get(id)
    return {
      id,
      nombre: opcion?.nombre || id,
      correo: opcion?.correo || '',
    }
  })
}

function cerrarDialogo() {
  dialogo.value = false
  contratoSeleccionado.value = null
}

async function guardarPlantilla() {
  if (!contratoSeleccionado.value) return
  guardando.value = true
  try {
    const payload = {
      plantilla_tipo: tipoSeleccionado.value,
      filas: filas.value.map((fila) => ({
        id_fila: fila.id_fila,
        dependencia_id: fila.dependencia_id,
        dependencia_nombre: fila.dependencia_nombre,
        responsables: fila.responsables || [],
        aplica: fila.aplica !== false,
      })),
    }

    const resp = await api.put(`/contratos/${contratoSeleccionado.value._id}/plantilla`, payload)
    tipoSeleccionado.value = resp.data?.tipo || tipoSeleccionado.value
    filas.value = calcularEncargados(
      (resp.data?.filas || filas.value).map((fila) => ({
        ...fila,
        responsables: (fila.responsables || []).map((r) => String(r.id || r._id || r)),
      })),
    )

    await cargarContratos()
    $q.notify({
      type: 'positive',
      message: 'Plantilla y firmantes guardados correctamente.',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.mensaje || 'No se pudo guardar la plantilla.',
    })
  } finally {
    guardando.value = false
  }
}

async function guardarPredeterminada(tipo) {
  try {
    await api.put('/plantillas/predeterminada', { plantilla_tipo: tipo })
    // Se actualiza la sesión en memoria para que el selector quede sincronizado
    if (typeof auth.actualizarUsuario === 'function') {
      auth.actualizarUsuario({ plantilla_predeterminada: tipo })
    }
    $q.notify({
      type: 'positive',
      message: 'Plantilla predeterminada actualizada.',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.mensaje || 'No se pudo actualizar la plantilla predeterminada.',
    })
  }
}

onMounted(() => {
  plantillaPredeterminada.value = auth.usuario?.plantilla_predeterminada || 'COMPLETA'
  cargarUsuarios()
  cargarContratos()
})
</script>
