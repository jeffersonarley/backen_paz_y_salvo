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
                <div v-if="props.row.encargados && props.row.encargados.length" class="column q-gutter-y-xs">
                  <div
                    v-for="enc in props.row.encargados"
                    :key="enc.id"
                    class="user-tag row items-center no-wrap cursor-pointer"
                  >
                    <div
                      class="user-avatar text-weight-bold"
                      :style="avatarStyle(enc.nombre, enc.rol)"
                    >
                      {{ obtenerIniciales(enc.nombre) }}
                    </div>
                    <span class="user-name text-weight-medium text-grey-9 q-ml-xs">
                      {{ enc.nombre }}
                    </span>
                    <span
                      v-if="enc.rol === 'Supervisor'"
                      class="user-role-badge q-ml-xs"
                    >
                      Coord.
                    </span>
                    <q-tooltip class="bg-dark text-white shadow-3" :offset="[4, 4]">
                      <div class="text-weight-bold">{{ enc.nombre }}</div>
                      <div class="text-caption text-positive">
                        {{ enc.rol === 'Supervisor' ? 'Coordinador (Supervisor)' : 'Responsable de Área' }}
                      </div>
                      <div v-if="enc.correo" class="text-caption text-grey-4">{{ enc.correo }}</div>
                    </q-tooltip>
                  </div>
                </div>
                <div v-else class="text-caption text-grey-5 text-italic row items-center">
                  <q-icon name="person_off" size="14px" class="q-mr-xs text-grey-4" />
                  Sin responsable asignado
                </div>
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
                    <q-icon name="people" color="primary" />
                  </template>
                  <template #selected-item="scope">
                    <div class="user-chip-selected row items-center no-wrap q-mr-xs q-my-xs">
                      <div
                        class="user-avatar text-weight-bold"
                        :style="avatarStyle(scope.opt.nombre, scope.opt.rol)"
                      >
                        {{ obtenerIniciales(scope.opt.nombre) }}
                      </div>
                      <span class="text-weight-medium q-ml-xs user-chip-text">{{ scope.opt.nombre }}</span>
                      <q-icon
                        name="cancel"
                        size="16px"
                        class="cursor-pointer q-ml-xs text-grey-6 hover-delete"
                        @click.stop="scope.removeAtIndex(scope.index)"
                      />
                    </div>
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

function obtenerIniciales(nombre) {
  if (!nombre) return 'U'
  const partes = String(nombre).trim().split(/\s+/)
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function avatarStyle(nombre, rol) {
  if (rol === 'Supervisor') {
    return {
      backgroundColor: '#e0e7ff',
      color: '#3730a3',
      border: '1px solid #c7d2fe',
    }
  }

  const palettes = [
    { bg: '#e8f5e9', text: '#1b5e20', border: '#c8e6c9' }, // Verde SENA suave
    { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }, // Celeste cielo
    { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }, // Ámbar dorado
    { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' }, // Púrpura elegante
    { bg: '#ffe4e6', text: '#9f1239', border: '#fecdd3' }, // Rosa suave
    { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }, // Gris pizarra
  ]

  let hash = 0
  const str = String(nombre || 'X')
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const color = palettes[Math.abs(hash) % palettes.length]

  return {
    backgroundColor: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`,
  }
}
</script>

<style scoped>
.user-tag {
  display: inline-flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 3px 10px 3px 4px;
  max-width: fit-content;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.user-tag:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.user-avatar {
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  letter-spacing: -0.3px;
  flex-shrink: 0;
}

.user-name {
  font-size: 12.5px;
  line-height: 1.2;
  color: #1e293b;
  white-space: nowrap;
}

.user-role-badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 6px;
  background: #e0e7ff;
  color: #3730a3;
  line-height: 1.2;
  border: 1px solid #c7d2fe;
}

.user-chip-selected {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 2px 6px 2px 3px;
}

.user-chip-text {
  font-size: 12px;
  color: #1e293b;
}

.hover-delete:hover {
  color: #dc2626 !important;
}
</style>
