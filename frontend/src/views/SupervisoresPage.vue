<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Coordinadores (Supervisores)</div>
        <div class="text-subtitle2 text-grey-7">
          Gestión de coordinadores y su apoyo de supervisión para el formato GCCON-F-088
        </div>
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nuevo Coordinador"
        unelevated
        @click="nuevoSupervisor"
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
        placeholder="Buscar supervisor..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Tabla de Supervisores -->
    <q-table
      title="Listado de Supervisores"
      :rows="store ? store.supervisores : rows"
      :columns="columns"
      :filter="filtro"
      row-key="id"
      flat
      bordered
      :rows-per-page-options="[10, 25, 50, 0]"
      :pagination="{ rowsPerPage: 25 }"
      no-data-label="No hay supervisores registrados"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-dependencia="props">
        <q-td :props="props">
          <q-badge color="blue-1" text-color="primary" class="text-weight-bold q-pa-xs">
            <q-icon name="apartment" class="q-mr-xs" />
            {{ props.row.dependencia || 'Gestión Tecnológica (TIC)' }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-apoyo_supervision="props">
        <q-td :props="props">
          <q-badge
            v-if="props.row.apoyo_supervision"
            color="indigo-1"
            text-color="indigo-9"
            class="q-pa-xs text-weight-bold"
          >
            <q-icon name="support_agent" class="q-mr-xs" />
            {{ props.row.apoyo_supervision }}
          </q-badge>
          <span v-else class="text-caption text-grey-6">Sin apoyo asignado</span>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="editarSupervisor(props.row)">
            <q-tooltip>Editar Supervisor</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="person_off"
            @click="eliminarSupervisor(props.row)"
          >
            <q-tooltip>Desactivar Supervisor</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario Creación / Edición -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-primary text-weight-bold">
            {{ editando ? 'Editar Supervisor' : 'Nuevo Supervisor' }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cancelar" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="guardarSupervisor">
          <q-card-section class="q-gutter-y-sm">
            <q-input
              v-model="supervisor.documento"
              label="Documento de Identidad *"
              outlined
              dense
              :disable="editando"
              :rules="[(val) => !!val || 'El documento es obligatorio']"
            />

            <q-input
              v-model="supervisor.nombre"
              label="Nombre Completo *"
              outlined
              dense
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="supervisor.correo"
              label="Correo Electrónico *"
              outlined
              dense
              type="email"
              :rules="[
                (val) => !!val || 'El correo es obligatorio',
                (val) =>
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Ingrese un correo electrónico válido',
              ]"
            />

            <q-input
              v-model="supervisor.telefono"
              label="Teléfono de Contacto *"
              outlined
              dense
              :rules="[(val) => !!val || 'El teléfono es obligatorio']"
            />

            <q-select
              v-model="supervisor.dependencia"
              :options="opcionesDependencias"
              option-label="label"
              option-value="value"
              label="Dependencia del Coordinador *"
              outlined
              dense
              :rules="[(val) => !!val || 'La dependencia es obligatoria']"
              hint="Área técnica o administrativa a cargo del coordinador"
            >
              <template #prepend>
                <q-icon name="apartment" color="primary" />
              </template>
            </q-select>

            <q-select
              v-model="supervisor.apoyo_supervision_id"
              :options="opcionesApoyo"
              option-label="label"
              option-value="value"
              label="Asignación de apoyo de supervisión"
              outlined
              dense
              clearable
              emit-value
              map-options
              hint="Persona que apoya al coordinador en la gestión y firmas"
            >
              <template #prepend>
                <q-icon name="support_agent" color="primary" />
              </template>
            </q-select>

            <q-input
              v-model="supervisor.password"
              :label="editando ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'"
              :type="mostrarPassword ? 'text' : 'password'"
              outlined
              dense
              hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
              @focus="avisarRequisitosPassword"
              :rules="
                editando
                  ? [
                      (val) => !val || val.length >= 8 || 'Mínimo 8 caracteres',
                      (val) => !val || /[A-Z]/.test(val) || 'Debe incluir al menos una mayúscula',
                      (val) => !val || /[a-z]/.test(val) || 'Debe incluir al menos una minúscula',
                      (val) => !val || /[0-9]/.test(val) || 'Debe incluir al menos un número',
                    ]
                  : [
                      (val) => !!val || 'La contraseña es obligatoria',
                      (val) => (val && val.length >= 8) || 'Mínimo 8 caracteres',
                      (val) => /[A-Z]/.test(val) || 'Debe incluir al menos una mayúscula',
                      (val) => /[a-z]/.test(val) || 'Debe incluir al menos una minúscula',
                      (val) => /[0-9]/.test(val) || 'Debe incluir al menos un número',
                    ]
              "
            >
              <template #append>
                <q-icon
                  :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrarPassword = !mostrarPassword"
                />
              </template>
            </q-input>

            <!-- Banner de error si falla la validación en backend (sin cerrar planilla) -->
            <div v-if="errorFormulario" class="q-mt-sm">
              <q-banner rounded dense class="bg-red-1 text-negative text-caption">
                <template #avatar>
                  <q-icon name="error_outline" color="negative" />
                </template>
                {{ errorFormulario }}
              </q-banner>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" color="grey-8" @click="cancelar" :disable="guardando" />
            <q-btn unelevated type="submit" color="positive" label="Guardar" :loading="guardando" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo Confirmar Desactivación -->
    <q-dialog v-model="dialogoEliminar">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="person_off" color="negative" text-color="white" class="q-mr-sm" />
          <span class="text-h6">Confirmar desactivación</span>
        </q-card-section>

        <q-card-section class="q-pt-none text-body1">
          ¿Está seguro de desactivar al supervisor
          <strong>{{ nombreSupervisorEliminar }}</strong
          >?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn unelevated color="negative" label="Desactivar" @click="confirmarEliminar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useSupervisoresStore } from '../stores/useSupervisoresStore.js'
import { useDependenciasStore } from '../stores/useDependenciasStore.js'
import api from '../services/api'

const store = useSupervisoresStore()
const dependenciasStore = useDependenciasStore()
const $q = useQuasar()

onMounted(async () => {
  if (dependenciasStore.cargarDependencias) {
    await dependenciasStore.cargarDependencias()
  }
  await cargarOpcionesApoyo()
})

const opcionesDependencias = computed(() => {
  return (dependenciasStore.dependencias || [])
    .filter((d) => d.estado !== 'Inactiva')
    .map((d) => ({
      label: d.nombre,
      value: d._id || d.id,
    }))
})

// Candidatos para el apoyo de supervisión (responsables de área y coordinadores)
const opcionesApoyo = ref([])

async function cargarOpcionesApoyo() {
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
        opciones.push({
          label: `${nombre} — ${rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área'}`,
          value: id,
        })
      })
    } catch {
      // se continua con los roles disponibles
    }
  }
  opcionesApoyo.value = opciones
}

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const documentoEliminar = ref('')
const supervisorSeleccionadoEliminar = ref(null)

const nombreSupervisorEliminar = computed(() => {
  if (supervisorSeleccionadoEliminar.value) {
    return (
      supervisorSeleccionadoEliminar.value.nombre ||
      supervisorSeleccionadoEliminar.value.nombre_completo ||
      documentoEliminar.value ||
      'el supervisor'
    )
  }
  const s = store.supervisores.find(
    (item) => item.documento === documentoEliminar.value || item._id === documentoEliminar.value,
  )
  return s?.nombre || s?.nombre_completo || documentoEliminar.value || 'el supervisor'
})
const editando = ref(false)
const indiceEditar = ref(null)
const mostrarPassword = ref(false)
const guardando = ref(false)
const errorFormulario = ref('')

const supervisor = ref({
  documento: '',
  nombre: '',
  correo: '',
  telefono: '',
  dependencia: '',
  dependencia_id: null,
  apoyo_supervision_id: null,
  password: '',
})

function avisarRequisitosPassword() {
  $q.notify({
    type: 'info',
    icon: 'lock',
    message:
      'Requisitos de la contraseña: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.',
    position: 'top',
    timeout: 4000,
  })
}

const columns = [
  {
    name: 'documento',
    label: 'Documento',
    field: 'documento',
    align: 'left',
    sortable: true,
  },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
    align: 'left',
    sortable: true,
  },
  {
    name: 'dependencia',
    label: 'Dependencia Asignada',
    field: (row) => row.dependencia || 'Gestión Tecnológica (TIC)',
    align: 'left',
    sortable: true,
  },
  {
    name: 'apoyo_supervision',
    label: 'Apoyo de Supervisión',
    field: 'apoyo_supervision',
    align: 'left',
    sortable: true,
  },
  {
    name: 'correo',
    label: 'Correo',
    field: 'correo',
    align: 'left',
    sortable: true,
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    field: 'telefono',
    align: 'left',
    sortable: true,
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center',
  },
]

async function guardarSupervisor() {
  errorFormulario.value = ''

  if (!editando.value) {
    const existeDocumento = store.supervisores.some(
      (item) => item.documento === supervisor.value.documento,
    )

    if (existeDocumento) {
      errorFormulario.value = 'Ya existe un supervisor registrado con ese documento.'
      $q.notify({
        type: 'negative',
        message: 'Ya existe un supervisor registrado con ese documento.',
        position: 'top',
      })
      return
    }

    if (!supervisor.value.password) {
      const msg = 'La contraseña es obligatoria.'
      errorFormulario.value = msg
      $q.notify({ type: 'warning', message: msg, position: 'top', timeout: 4000 })
      return
    }

    if (supervisor.value.password.length < 8) {
      const msg = 'La contraseña debe tener mínimo 8 caracteres.'
      errorFormulario.value = msg
      $q.notify({ type: 'warning', message: msg, position: 'top', timeout: 4000 })
      return
    }

    if (!/[A-Z]/.test(supervisor.value.password)) {
      const msg = 'La contraseña debe incluir al menos una letra mayúscula.'
      errorFormulario.value = msg
      $q.notify({ type: 'warning', message: msg, position: 'top', timeout: 4000 })
      return
    }

    if (!/[a-z]/.test(supervisor.value.password)) {
      const msg = 'La contraseña debe incluir al menos una letra minúscula.'
      errorFormulario.value = msg
      $q.notify({ type: 'warning', message: msg, position: 'top', timeout: 4000 })
      return
    }

    if (!/[0-9]/.test(supervisor.value.password)) {
      const msg = 'La contraseña debe incluir al menos un número.'
      errorFormulario.value = msg
      $q.notify({ type: 'warning', message: msg, position: 'top', timeout: 4000 })
      return
    }
  }

  guardando.value = true
  try {
    if (editando.value) {
      store.editar(indiceEditar.value, { ...supervisor.value })
      $q.notify({
        type: 'positive',
        message: 'Supervisor actualizado correctamente.',
      })
    } else {
      await store.agregar({ ...supervisor.value })
      $q.notify({
        type: 'positive',
        message: 'Supervisor registrado correctamente.',
      })
    }
    // Solo cerramos la planilla cuando la operación tiene éxito
    limpiarFormulario()
  } catch (err) {
    const mensajeError =
      err.response?.data?.mensaje ||
      err.mensaje ||
      'Error al guardar supervisor en la base de datos.'
    errorFormulario.value = mensajeError
    $q.notify({
      type: 'negative',
      message: mensajeError,
      position: 'top',
    })
    // No se llama a limpiarFormulario() para que la ventana permanezca abierta con los datos
  } finally {
    guardando.value = false
  }
}

function nuevoSupervisor() {
  limpiarFormulario()
  const primera = dependenciasStore.dependencias.find((d) => d.estado !== 'Inactiva')
  supervisor.value.dependencia = primera ? primera._id || primera.id : null
  supervisor.value.dependencia_id = primera ? primera._id || primera.id : null
  dialogo.value = true
}

function editarSupervisor(fila) {
  supervisor.value = {
    ...fila,
    dependencia: fila.dependencia_id || fila.dependencia || null,
    dependencia_id: fila.dependencia_id || null,
    apoyo_supervision_id: fila.apoyo_supervision_id || null,
    password: fila.password || '',
  }

  indiceEditar.value = store.supervisores.findIndex((item) => item.documento === fila.documento)

  editando.value = true
  errorFormulario.value = ''
  dialogo.value = true
}

function eliminarSupervisor(item) {
  if (typeof item === 'object' && item !== null) {
    supervisorSeleccionadoEliminar.value = item
    documentoEliminar.value = item.documento || item._id || ''
  } else {
    documentoEliminar.value = item
    supervisorSeleccionadoEliminar.value =
      store.supervisores.find((s) => s.documento === item || s._id === item) || null
  }
  dialogoEliminar.value = true
}

function confirmarEliminar() {
  const nombreSup = nombreSupervisorEliminar.value
  store.eliminar(documentoEliminar.value)
  documentoEliminar.value = ''
  supervisorSeleccionadoEliminar.value = null
  dialogoEliminar.value = false
  $q.notify({
    type: 'info',
    message: `Supervisor "${nombreSup}" desactivado correctamente.`,
  })
}

function cancelar() {
  limpiarFormulario()
}

function limpiarFormulario() {
  supervisor.value = {
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    dependencia: '',
    dependencia_id: null,
    apoyo_supervision_id: null,
    password: '',
  }
  errorFormulario.value = ''
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
  mostrarPassword.value = false
}
</script>
