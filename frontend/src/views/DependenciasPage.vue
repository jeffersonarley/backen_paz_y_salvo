<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Dependencias</div>
        <div class="text-subtitle2 text-grey-7">
          Gestión de áreas responsables del formato GCCON-F-088
        </div>
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nueva Dependencia"
        unelevated
        @click="nuevaDependencia"
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
        placeholder="Buscar dependencia..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Tabla de Dependencias -->
    <q-table
      title="Listado de Dependencias"
      :rows="store.dependencias"
      :columns="columns"
      :filter="filtro"
      row-key="codigo"
      flat
      bordered
      :loading="store.cargando"
      :rows-per-page-options="[10, 25, 50, 0]"
      :pagination="{ rowsPerPage: 25 }"
      no-data-label="No hay dependencias registradas"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-estado="props">
        <q-td :props="props">
          <q-badge
            :color="
              props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva'
                ? 'negative'
                : 'positive'
            "
            class="q-pa-xs text-weight-bold"
          >
            {{
              props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva'
                ? 'Inactiva'
                : 'Activa'
            }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-responsables="props">
        <q-td :props="props">
          <div v-if="(props.row.responsables || []).length" class="column q-gutter-y-xs">
            <div
              v-for="resp in props.row.responsables"
              :key="resp.id || resp._id"
              class="user-tag row items-center no-wrap cursor-pointer"
            >
              <div
                class="user-avatar text-weight-bold"
                :style="avatarStyle(resp.nombre, resp.rol)"
              >
                {{ obtenerIniciales(resp.nombre) }}
              </div>
              <span class="user-name text-weight-medium text-grey-9 q-ml-xs">
                {{ resp.nombre }}
              </span>
              <span
                v-if="resp.rol === 'Supervisor'"
                class="user-role-badge q-ml-xs"
              >
                Coord.
              </span>

              <q-tooltip class="bg-dark text-white shadow-3" :offset="[4, 4]">
                <div class="text-weight-bold">{{ resp.nombre }}</div>
                <div class="text-caption text-positive">
                  {{ resp.rol === 'Supervisor' ? 'Coordinador (Supervisor)' : 'Responsable de Área' }}
                </div>
                <div v-if="resp.correo" class="text-caption text-grey-4">{{ resp.correo }}</div>
              </q-tooltip>
            </div>
          </div>
          <div v-else class="text-caption text-grey-5 text-italic row items-center">
            <q-icon name="person_off" size="14px" class="q-mr-xs text-grey-4" />
            Sin responsables asignados
          </div>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="editarDependencia(props.row)">
            <q-tooltip>Editar Dependencia</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            :color="props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva' ? 'positive' : 'negative'"
            :icon="props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva' ? 'check_circle' : 'domain_disabled'"
            @click="eliminarDependencia(props.row)"
          >
            <q-tooltip>{{
              props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva'
                ? `Activar dependencia: ${props.row.nombre || props.row.nombre_dependencia}`
                : `Desactivar dependencia: ${props.row.nombre || props.row.nombre_dependencia}`
            }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario Creación / Edición -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-primary text-weight-bold">
            {{ editando ? 'Editar Dependencia' : 'Nueva Dependencia' }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cancelar" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="guardarDependencia">
          <q-card-section class="q-gutter-y-sm">
            <q-banner dense rounded class="bg-green-1 text-positive q-mb-sm">
              <template #avatar>
                <q-icon name="verified_user" color="positive" />
              </template>
              <div class="text-caption">
                <strong>Destinatarios oficiales:</strong> Toda solicitud o paz y salvo vinculado a esta
                dependencia va dirigido a los responsables asignados para su revisión y firma oficial.
              </div>
            </q-banner>

            <q-input
              v-model="dependencia.codigo"
              label="Código de la Dependencia *"
              outlined
              dense
              :disable="editando"
              :rules="[(val) => !!val || 'El código es obligatorio']"
            >
              <template #prepend>
                <q-icon name="tag" color="grey-7" />
              </template>
            </q-input>

            <!-- Nombre de la Dependencia con sugerencias estándar -->
            <q-select
              v-model="dependencia.nombre"
              label="Nombre de la Dependencia *"
              outlined
              dense
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              new-value-mode="add-unique"
              :options="filtroNombresDependencias"
              option-label="nombre"
              option-value="nombre"
              emit-value
              map-options
              @filter="filtrarNombresDependencias"
              @update:model-value="onSeleccionarNombreDependencia"
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
              hint="Elija un área estándar o escriba un nombre personalizado"
            >
              <template #prepend>
                <q-icon name="business" color="primary" />
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar
                      :icon="scope.opt.icono || 'business'"
                      color="primary"
                      text-color="white"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.descripcion }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Responsables: pueden ser varios por dependencia -->
            <q-select
              v-model="responsablesSeleccionados"
              label="Responsables de la Dependencia *"
              outlined
              dense
              multiple
              use-chips
              :options="opcionesResponsables"
              option-label="etiqueta"
              @update:model-value="onSeleccionarResponsables"
              :rules="[
                (val) => (val && val.length > 0) || 'Debe asignar al menos un responsable',
              ]"
              hint="Cada dependencia puede tener varios responsables (Coordinador o Responsable de Área); cualquiera de ellos puede firmar"
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
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <div
                      class="user-avatar text-weight-bold"
                      :style="avatarStyle(scope.opt.nombre, scope.opt.rol)"
                    >
                      {{ obtenerIniciales(scope.opt.nombre) }}
                    </div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>
                      {{ scope.opt.rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área' }} — {{ scope.opt.correo || 'Sin correo registrado' }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <div
              v-if="responsablesSeleccionados.length"
              class="q-pa-sm bg-blue-1 text-primary rounded-borders"
            >
              <div class="text-caption text-weight-bold">Correos de notificación:</div>
              <div class="text-caption">
                {{
                  responsablesSeleccionados
                    .map((r) => r.correo || 'sin correo')
                    .join(' · ')
                }}
              </div>
            </div>

            <!-- Estado: Activa por defecto al crear, editable solo al editar -->
            <div
              v-if="!editando"
              class="row items-center q-pa-sm bg-green-1 text-positive rounded-borders q-mt-xs"
            >
              <q-icon name="check_circle" color="positive" size="sm" class="q-mr-sm" />
              <div class="text-caption">
                <strong>Estado:</strong> Activa (queda habilitada automáticamente para recibir
                solicitudes y firmas).
              </div>
            </div>

            <q-select
              v-else
              v-model="dependencia.estado"
              :options="['Activa', 'Inactiva']"
              label="Estado de la Dependencia"
              outlined
              dense
            >
              <template #prepend>
                <q-icon
                  name="toggle_on"
                  :color="dependencia.estado === 'Activa' ? 'positive' : 'grey-7'"
                />
              </template>
            </q-select>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" color="grey-8" @click="cancelar" />
            <q-btn
              unelevated
              type="submit"
              color="positive"
              label="Guardar Dependencia"
              icon="save"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo Confirmar Desactivación / Activación -->
    <q-dialog v-model="dialogoEliminar">
      <q-card style="min-width: 420px; max-width: 90vw">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="esInactivaSeleccionada ? 'check_circle' : 'domain_disabled'"
            :color="esInactivaSeleccionada ? 'positive' : 'negative'"
            text-color="white"
            class="q-mr-sm"
          />
          <span class="text-h6 text-weight-bold">{{
            esInactivaSeleccionada ? 'Confirmar activación' : 'Confirmar desactivación'
          }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none text-body1">
          ¿Está seguro de {{ esInactivaSeleccionada ? 'activar' : 'desactivar' }} la dependencia
          <strong class="text-primary text-weight-bold">{{ nombreEliminar }}</strong
          >?
          <div class="text-caption text-grey-7 q-mt-xs">
            {{
              esInactivaSeleccionada
                ? 'El área quedará habilitada para firmar y validar compromisos contractuales.'
                : 'Esta área no podrá firmar ni validar nuevos trámites hasta que sea reactivada.'
            }}
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            :color="esInactivaSeleccionada ? 'positive' : 'negative'"
            :label="esInactivaSeleccionada ? 'Activar Dependencia' : 'Desactivar Dependencia'"
            @click="confirmarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useDependenciasStore } from '../stores/useDependenciasStore.js'
import api from '../services/api'

const $q = useQuasar()
const store = useDependenciasStore()

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const codigoEliminar = ref('')
const editando = ref(false)
const indiceEditar = ref(null)
const responsablesSeleccionados = ref([])

  const nombresDependenciasSugeridas = []
  const filtroNombresDependencias = ref([])

function filtrarNombresDependencias(val, update) {
  if (val === '') {
    update(() => {
      filtroNombresDependencias.value = nombresDependenciasSugeridas
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filtroNombresDependencias.value = nombresDependenciasSugeridas.filter(
      (v) =>
        v.nombre.toLowerCase().includes(needle) || v.descripcion.toLowerCase().includes(needle),
    )
  })
}

function onSeleccionarNombreDependencia(val) {
  if (!val) return
  const nombreTexto = typeof val === 'object' ? val.nombre : val
  dependencia.value.nombre = nombreTexto

  // Autoseleccionar responsable correspondiente si existe
  const sugerencia = nombresDependenciasSugeridas.find(
    (s) => s.nombre.toLowerCase() === nombreTexto.toLowerCase(),
  )

  if (sugerencia) {
    const respEncontrado = opcionesResponsables.value.find(
      (r) =>
        (r.nombre &&
          sugerencia.responsableSugerido &&
          r.nombre.toLowerCase().includes(sugerencia.responsableSugerido.toLowerCase())) ||
        (r.correo &&
          sugerencia.correoSugerido &&
          r.correo.toLowerCase() === sugerencia.correoSugerido.toLowerCase()),
    )
    if (respEncontrado) {
      responsablesSeleccionados.value = [respEncontrado]
      dependencia.value.responsables = [respEncontrado]
      dependencia.value.responsable = respEncontrado.nombre
      dependencia.value.correo = respEncontrado.correo
      dependencia.value.responsable_id = respEncontrado.id || respEncontrado._id || null
    }
  }
}

const opcionesResponsables = ref([])

// Los responsables son usuarios reales: responsables de área y coordinadores (supervisores)
async function cargarResponsables() {
  const opciones = []
  const vistos = new Set()

  const roles = ['ResponsableArea', 'Supervisor']
  for (const rol of roles) {
    try {
      const resp = await api.get(`/usuarios?rol=${rol}`)
      const lista = Array.isArray(resp.data) ? resp.data : resp.data?.usuarios || []
      lista.forEach((u) => {
        const id = String(u._id || u.id || '')
        if (!id || vistos.has(id)) return
        vistos.add(id)
        const nombre = u.nombre_completo || u.nombre || 'Usuario'
        const correo = u.correo_institucional || u.correo || ''
        opciones.push({
          id,
          _id: id,
          nombre,
          correo,
          rol: u.rol,
          etiqueta: `${nombre} — ${rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área'} (${correo || 'sin correo'})`,
        })
      })
    } catch {
      // Si un rol falla se sigue con el resto
    }
  }

  opcionesResponsables.value = opciones
}

onMounted(() => {
  cargarResponsables()
})

function onSeleccionarResponsables(val) {
  const seleccionados = Array.isArray(val) ? val : val ? [val] : []
  responsablesSeleccionados.value = seleccionados

  dependencia.value.responsables = seleccionados
  dependencia.value.responsable = seleccionados[0]?.nombre || ''
  dependencia.value.correo = seleccionados[0]?.correo || ''
  dependencia.value.responsable_id = seleccionados[0]?.id || seleccionados[0]?._id || null
}

const dependenciaSeleccionadaEliminar = ref(null)

const esInactivaSeleccionada = computed(() => {
  const d =
    dependenciaSeleccionadaEliminar.value ||
    store.dependencias.find(
      (item) => item.codigo === codigoEliminar.value || item._id === codigoEliminar.value,
    )
  return d ? d.estado === 'Inactiva' || d.estado === 'Inactivo' : false
})

const nombreEliminar = computed(() => {
  if (dependenciaSeleccionadaEliminar.value) {
    const nom =
      dependenciaSeleccionadaEliminar.value.nombre ||
      dependenciaSeleccionadaEliminar.value.nombre_dependencia
    if (nom) return nom
  }
  const cod = codigoEliminar.value
  const d = store.dependencias.find(
    (item) => item.codigo === cod || item._id === cod || item.id === cod,
  )
  return d?.nombre || d?.nombre_dependencia || 'la dependencia'
})

const dependencia = ref({
  codigo: '',
  nombre: '',
  responsable: '',
  responsable_id: null,
  responsables: [],
  correo: '',
  estado: 'Activa',
})

const columns = [
  {
    name: 'codigo',
    label: 'Código',
    field: 'codigo',
    align: 'left',
    sortable: true,
  },
  {
    name: 'nombre',
    label: 'Dependencia',
    field: 'nombre',
    align: 'left',
    sortable: true,
  },
  {
    name: 'responsables',
    label: 'Responsables',
    field: 'responsables',
    align: 'left',
    sortable: true,
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
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

async function guardarDependencia() {
  const existeCodigo = store.dependencias.some((item, index) => {
    return item.codigo === dependencia.value.codigo && index !== indiceEditar.value
  })

  if (existeCodigo) {
    $q.notify({
      type: 'negative',
      message: 'Ya existe una dependencia con ese código.',
    })
    return
  }

  if (!responsablesSeleccionados.value.length) {
    $q.notify({
      type: 'negative',
      message: 'Debe asignar al menos un responsable a la dependencia.',
    })
    return
  }

  const resultado = editando.value
    ? await store.editar(indiceEditar.value, { ...dependencia.value })
    : await store.agregar({ ...dependencia.value })

  if (resultado && resultado.ok === false) {
    $q.notify({
      type: 'negative',
      message: resultado.mensaje || 'No se pudo guardar la dependencia.',
    })
    return
  }

  $q.notify({
    type: 'positive',
    message: editando.value
      ? 'Dependencia y responsables actualizados correctamente.'
      : 'Dependencia registrada con sus responsables exitosamente.',
  })

  limpiarFormulario()
}

function nuevaDependencia() {
  limpiarFormulario()
  const siguienteNum = (store.dependencias.length + 1).toString().padStart(2, '0')
  dependencia.value.codigo = `DEP-${siguienteNum}`

  // Ya aparece la Dependencia con el responsable sugerido de inmediato
  if (nombresDependenciasSugeridas.length > 0) {
    const primeraSugerencia = nombresDependenciasSugeridas[0]
    dependencia.value.nombre = primeraSugerencia.nombre
    onSeleccionarNombreDependencia(primeraSugerencia.nombre)
  }
  dialogo.value = true
}

function editarDependencia(fila) {
  dependencia.value = { ...fila }
  const actuales = fila.responsables || []
  responsablesSeleccionados.value = actuales.length
    ? actuales
        .map((r) =>
          opcionesResponsables.value.find(
            (op) => String(op.id) === String(r.id || r._id) || op.nombre === r.nombre,
          ) || r,
        )
        .filter(Boolean)
    : []
  dependencia.value.responsables = responsablesSeleccionados.value
  indiceEditar.value = fila._idReal || fila._id || fila.id || store.dependencias.findIndex((item) => item.codigo === fila.codigo)
  editando.value = true
  dialogo.value = true
}

function eliminarDependencia(item) {
  if (typeof item === 'object' && item !== null) {
    dependenciaSeleccionadaEliminar.value = { ...item }
    codigoEliminar.value = item._idReal || item._id || item.id || item.codigo || ''
  } else {
    codigoEliminar.value = item
    const encontrada =
      store.dependencias.find(
        (d) => d._idReal === item || d._id === item || d.id === item || d.codigo === item,
      ) || null
    dependenciaSeleccionadaEliminar.value = encontrada ? { ...encontrada } : null
  }
  dialogoEliminar.value = true
}

async function confirmarEliminar() {
  const eraInactiva = esInactivaSeleccionada.value
  const nombreDep = nombreEliminar.value
  const resultado = await store.eliminar(codigoEliminar.value)
  codigoEliminar.value = ''
  dependenciaSeleccionadaEliminar.value = null
  dialogoEliminar.value = false

  if (resultado && resultado.ok === false) {
    $q.notify({
      type: 'negative',
      message: resultado.mensaje || 'No se pudo actualizar el estado de la dependencia.',
    })
    return
  }

  $q.notify({
    type: 'info',
    message: eraInactiva
      ? `Dependencia "${nombreDep}" activada correctamente.`
      : `Dependencia "${nombreDep}" desactivada correctamente.`,
  })
}

function cancelar() {
  limpiarFormulario()
}

function limpiarFormulario() {
  dependencia.value = {
    codigo: '',
    nombre: '',
    responsable: '',
    responsable_id: null,
    responsables: [],
    correo: '',
    estado: 'Activa',
  }
  responsablesSeleccionados.value = []
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
}

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
