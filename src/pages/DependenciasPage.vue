<template>
  <q-page class="q-pa-lg">
<<<<<<< HEAD
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">
          Dependencias
        </div>
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
      no-data-label="No hay dependencias registradas"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-estado="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.estado === 'Activa' ? 'positive' : 'negative'"
            class="q-pa-xs text-weight-bold"
          >
            {{ props.row.estado }}
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
            icon="edit"
            @click="editarDependencia(props.row)"
          >
            <q-tooltip>Editar Dependencia</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="eliminarDependencia(props.row.codigo)"
          >
            <q-tooltip>Eliminar Dependencia</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario Creación / Edición -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw;">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-primary text-weight-bold">
            {{ editando ? 'Editar Dependencia' : 'Nueva Dependencia' }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cancelar" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="guardarDependencia">
          <q-card-section class="q-gutter-y-sm">
            <q-input
              v-model="dependencia.codigo"
              label="Código *"
              outlined
              dense
              :disable="editando"
              :rules="[val => !!val || 'El código es obligatorio']"
            />

            <q-input
              v-model="dependencia.nombre"
              label="Nombre *"
              outlined
              dense
              :rules="[val => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="dependencia.responsable"
              label="Responsable de Área *"
              outlined
              dense
              :rules="[val => !!val || 'El responsable es obligatorio']"
            />

            <q-input
              v-model="dependencia.correo"
              label="Correo *"
              outlined
              dense
              type="email"
              :rules="[
                val => !!val || 'El correo es obligatorio',
                val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Ingrese un correo electrónico válido'
              ]"
            />

            <q-select
              v-model="dependencia.estado"
              :options="['Activa', 'Inactiva']"
              label="Estado"
              outlined
              dense
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              label="Cancelar"
              color="grey-8"
              @click="cancelar"
            />
            <q-btn
              unelevated
              type="submit"
              color="positive"
              label="Guardar"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo Confirmar Eliminación -->
    <q-dialog v-model="dialogoEliminar">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" class="q-mr-sm" />
          <span class="text-h6">Confirmar eliminación</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          ¿Está seguro de eliminar la dependencia con código <strong>{{ codigoEliminar }}</strong>?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancelar"
            color="grey-8"
            v-close-popup
          />
          <q-btn
            unelevated
            color="negative"
            label="Eliminar"
            @click="confirmarEliminar"
          />
=======
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 text-weight-bold text-grey-9">Dependencias</div>
      <q-btn v-if="puedeGestionar" no-caps unelevated color="primary" icon="add" label="Nueva dependencia" @click="abrirNuevo" />
    </div>

    <q-card flat bordered class="bg-white q-pa-md">
      <div class="row q-mb-md">
        <q-input v-model="filtro" outlined dense clearable style="width:340px" placeholder="Buscar dependencia...">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <q-table :rows="rows" :columns="columns" :filter="filtro" row-key="id" flat bordered :loading="cargando" no-data-label="Sin dependencias." hide-bottom>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge class="q-px-sm" :color="props.row.activo ? 'green-1' : 'red-1'" :text-color="props.row.activo ? 'green-9' : 'red-8'">
              {{ props.row.activo ? 'Activa' : 'Inactiva' }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props">
            <q-btn v-if="puedeGestionar" flat round color="grey-7" icon="edit" size="sm" title="Editar" @click="abrirEditar(props.row)" />
            <q-btn v-if="puedeGestionar" flat round color="grey-7" icon="person_add" size="sm" title="Asignar responsable" @click="abrirAsignar(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="min-width:480px">
        <q-card-section>
          <div class="text-h6 text-grey-9">{{ editando ? 'Editar dependencia' : 'Nueva dependencia' }}</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="form.nombre_dependencia" label="Nombre de la dependencia" outlined dense :disable="procesando" />
          <q-toggle v-if="editando" v-model="form.activo" label="Activa" class="q-mt-md" :disable="procesando" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup @click="dialogo = false" />
          <q-btn no-caps unelevated color="primary" label="Guardar" :loading="procesando" @click="guardar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoAsignar">
      <q-card style="min-width:480px">
        <q-card-section>
          <div class="text-h6 text-grey-9">Asignar responsable</div>
          <div class="text-caption text-grey-6 q-mb-md">{{ seleccionada?.nombre }}</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="responsableSeleccionado"
            :options="opcionesResponsables"
            label="Responsable de área"
            outlined
            dense
            emit-value
            map-options
            :disable="procesando"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup @click="dialogoAsignar = false" />
          <q-btn no-caps unelevated color="primary" label="Asignar" :loading="procesando" @click="asignar" />
>>>>>>> origin/frontend-juanpablo
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
<<<<<<< HEAD
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useDependenciasStore } from '../stores/useDependenciasStore.js'

const $q = useQuasar()
const store = useDependenciasStore()

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const codigoEliminar = ref('')
const editando = ref(false)
const indiceEditar = ref(null)

const dependencia = ref({
  codigo: '',
  nombre: '',
  responsable: '',
  correo: '',
  estado: 'Activa'
})

const columns = [
  {
    name: 'codigo',
    label: 'Código',
    field: 'codigo',
    align: 'left',
    sortable: true
  },
  {
    name: 'nombre',
    label: 'Dependencia',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'responsable',
    label: 'Responsable',
    field: 'responsable',
    align: 'left',
    sortable: true
  },
  {
    name: 'correo',
    label: 'Correo',
    field: 'correo',
    align: 'left',
    sortable: true
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'center',
    sortable: true
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center'
  }
]

function guardarDependencia() {
  const existeCodigo = store.dependencias.some((item, index) => {
    return (
      item.codigo === dependencia.value.codigo &&
      index !== indiceEditar.value
    )
  })

  if (existeCodigo) {
    $q.notify({
      type: 'negative',
      message: 'Ya existe una dependencia con ese código.'
    })
    return
  }

  if (editando.value) {
    store.editar(indiceEditar.value, { ...dependencia.value })
    $q.notify({
      type: 'positive',
      message: 'Dependencia actualizada correctamente.'
    })
  } else {
    store.agregar({ ...dependencia.value })
    $q.notify({
      type: 'positive',
      message: 'Dependencia registrada correctamente.'
    })
  }

  limpiarFormulario()
}

function nuevaDependencia() {
  limpiarFormulario()
  dialogo.value = true
}

function editarDependencia(fila) {
  dependencia.value = { ...fila }
  indiceEditar.value = store.dependencias.findIndex(
    item => item.codigo === fila.codigo
  )
=======
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const $q = useQuasar()
const auth = useAuthStore()
const puedeGestionar = computed(() => auth.rol === 'Supervisor')

const rows = ref([])
const filtro = ref('')
const cargando = ref(false)
const procesando = ref(false)
const dialogo = ref(false)
const dialogoAsignar = ref(false)
const editando = ref(false)
const idEditar = ref(null)
const seleccionada = ref(null)
const responsables = ref([])
const responsablesCargados = ref(false)
const responsableSeleccionado = ref('')
const form = ref(defaultForm())

const columns = [
  { name: 'nombre', label: 'Dependencia', field: 'nombre', align: 'left' },
  { name: 'responsable', label: 'Responsable', field: 'responsable', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

const opcionesResponsables = computed(() =>
  responsables.value.map((r) => ({ label: `${r.nombre_completo} (${r.correo_institucional})`, value: r._id }))
)

function defaultForm() {
  return { nombre_dependencia: '', activo: true }
}

onMounted(cargar)

async function cargar() {
  cargando.value = true
  try {
    const { data } = await api.get('/api/dependencias')
    rows.value = data.map((d) => ({
      id: d._id,
      nombre: d.nombre_dependencia,
      responsable: d.responsable_id?.nombre_completo || '—',
      responsableId: d.responsable_id?._id || '',
      activo: d.activo !== false
    }))
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudieron cargar las dependencias.' })
  } finally {
    cargando.value = false
  }
}

function abrirNuevo() {
  editando.value = false
  idEditar.value = null
  form.value = defaultForm()
  dialogo.value = true
}

function abrirEditar(fila) {
>>>>>>> origin/frontend-juanpablo
  editando.value = true
  idEditar.value = fila.id
  form.value = { nombre_dependencia: fila.nombre, activo: fila.activo }
  dialogo.value = true
}

<<<<<<< HEAD
function eliminarDependencia(codigo) {
  codigoEliminar.value = codigo
  dialogoEliminar.value = true
}

function confirmarEliminar() {
  store.eliminar(codigoEliminar.value)
  codigoEliminar.value = ''
  dialogoEliminar.value = false
  $q.notify({
    type: 'info',
    message: 'Dependencia eliminada correctamente.'
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
    correo: '',
    estado: 'Activa'
  }
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
=======
async function guardar() {
  if (!form.value.nombre_dependencia) {
    $q.notify({ type: 'warning', message: 'El nombre de la dependencia es obligatorio.' })
    return
  }
  procesando.value = true
  try {
    if (editando.value) {
      await api.put(`/api/dependencias/${idEditar.value}`, {
        nombre_dependencia: form.value.nombre_dependencia,
        activo: form.value.activo
      })
    } else {
      await api.post('/api/dependencias', { nombre_dependencia: form.value.nombre_dependencia })
    }
    $q.notify({ type: 'positive', message: 'Guardado correctamente.' })
    dialogo.value = false
    await cargar()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudo guardar.' })
  } finally {
    procesando.value = false
  }
>>>>>>> origin/frontend-juanpablo
}

async function abrirAsignar(fila) {
  seleccionada.value = fila
  responsableSeleccionado.value = fila.responsableId || ''
  dialogoAsignar.value = true
  if (!responsablesCargados.value) {
    try {
      const { data } = await api.get('/api/usuarios')
      responsables.value = data.filter((u) => u.rol === 'ResponsableArea')
      responsablesCargados.value = true
    } catch (error) {
      $q.notify({ type: 'negative', message: error.mensaje || 'No se pudieron cargar los responsables.' })
    }
  }
}

async function asignar() {
  if (!responsableSeleccionado.value) {
    $q.notify({ type: 'warning', message: 'Seleccione un responsable.' })
    return
  }
  procesando.value = true
  try {
    const { data } = await api.post(`/api/dependencias/${seleccionada.value.id}/responsable`, {
      responsable_id: responsableSeleccionado.value
    })
    $q.notify({ type: 'positive', message: data.mensaje || 'Responsable asignado.' })
    dialogoAsignar.value = false
    await cargar()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudo asignar el responsable.' })
  } finally {
    procesando.value = false
  }
}
</script>
