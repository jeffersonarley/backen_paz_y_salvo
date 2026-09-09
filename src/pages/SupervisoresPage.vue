<template>
  <q-page class="q-pa-lg">
<<<<<<< HEAD
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">
          Supervisores
        </div>
        <div class="text-subtitle2 text-grey-7">
          Gestión de supervisores encargados del formato GCCON-F-088
        </div>
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nuevo Supervisor"
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
      row-key="documento"
      flat
      bordered
      no-data-label="No hay supervisores registrados"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="edit"
            @click="editarSupervisor(props.row)"
          >
            <q-tooltip>Editar Supervisor</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="eliminarSupervisor(props.row.documento)"
          >
            <q-tooltip>Eliminar Supervisor</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario Creación / Edición -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw;">
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
              :rules="[val => !!val || 'El documento es obligatorio']"
            />

            <q-input
              v-model="supervisor.nombre"
              label="Nombre Completo *"
              outlined
              dense
              :rules="[val => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="supervisor.correo"
              label="Correo Electrónico *"
              outlined
              dense
              type="email"
              :rules="[
                val => !!val || 'El correo es obligatorio',
                val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Ingrese un correo electrónico válido'
              ]"
            />

            <q-input
              v-model="supervisor.telefono"
              label="Teléfono de Contacto *"
              outlined
              dense
              :rules="[val => !!val || 'El teléfono es obligatorio']"
            />

            <q-input
              v-model="supervisor.password"
              label="Contraseña *"
              type="password"
              outlined
              dense
              :rules="[
                val => editando || !!val || 'La contraseña es obligatoria'
              ]"
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
          ¿Está seguro de eliminar al supervisor con documento <strong>{{ documentoEliminar }}</strong>?
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
      <div class="text-h4 text-weight-bold text-grey-9">Supervisores</div>
      <q-btn no-caps unelevated color="primary" icon="add" label="Nuevo supervisor" @click="abrirNuevo" />
    </div>

    <q-card flat bordered class="bg-white q-pa-md">
      <div class="row q-mb-md">
        <q-input v-model="filtro" outlined dense clearable style="width:340px" placeholder="Buscar supervisor...">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <q-table :rows="rows" :columns="columns" :filter="filtro" row-key="id" flat bordered :loading="cargando" no-data-label="Sin supervisores." hide-bottom>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge class="q-px-sm" :color="props.row.activo ? 'green-1' : 'red-1'" :text-color="props.row.activo ? 'green-9' : 'red-8'">
              {{ props.row.activo ? 'Activo' : 'Inactivo' }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props">
            <q-btn flat round color="grey-7" icon="edit" size="sm" @click="abrirEditar(props.row)" />
            <q-btn flat round :color="props.row.activo ? 'grey-7' : 'positive'" :icon="props.row.activo ? 'lock' : 'lock_open'" size="sm" @click="alternarEstado(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="min-width:500px">
        <q-card-section>
          <div class="text-h6 text-grey-9">{{ editando ? 'Editar supervisor' : 'Nuevo supervisor' }}</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="form.nombre_completo" label="Nombre completo" outlined dense class="q-mb-md" :disable="procesando" />
          <q-input v-model="form.correo_institucional" label="Correo institucional" outlined dense type="email" class="q-mb-md" :disable="procesando || editando" />
          <q-input v-if="!editando" v-model="form.password" label="Contraseña" outlined dense type="password" :disable="procesando" />
          <q-input v-model="form.telefono" label="Teléfono" outlined dense :disable="procesando" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup @click="dialogo = false" />
          <q-btn no-caps unelevated color="primary" label="Guardar" :loading="procesando" @click="guardar" />
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
import { useSupervisoresStore } from '../stores/useSupervisoresStore.js'

const store = useSupervisoresStore()
const $q = useQuasar()

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const documentoEliminar = ref('')
const editando = ref(false)
const indiceEditar = ref(null)

const supervisor = ref({
  documento: '',
  nombre: '',
  correo: '',
  telefono: '',
  password: ''
})

const columns = [
  {
    name: 'documento',
    label: 'Documento',
    field: 'documento',
    align: 'left',
    sortable: true
  },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
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
    name: 'telefono',
    label: 'Teléfono',
    field: 'telefono',
    align: 'left',
    sortable: true
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center'
  }
]

function guardarSupervisor() {
  if (!editando.value) {
    const existeDocumento = store.supervisores.some(
      item => item.documento === supervisor.value.documento
    )

    if (existeDocumento) {
      $q.notify({
        type: 'negative',
        message: 'Ya existe un supervisor registrado con ese documento.'
      })
      return
    }
  }

  if (editando.value) {
    store.editar(indiceEditar.value, { ...supervisor.value })
    $q.notify({
      type: 'positive',
      message: 'Supervisor actualizado correctamente.'
    })
  } else {
    store.agregar({ ...supervisor.value })
    $q.notify({
      type: 'positive',
      message: 'Supervisor registrado correctamente.'
    })
  }

  limpiarFormulario()
}

function nuevoSupervisor() {
  limpiarFormulario()
  dialogo.value = true
}

function editarSupervisor(fila) {
  supervisor.value = {
    ...fila,
    password: fila.password || ''
  }

  indiceEditar.value = store.supervisores.findIndex(
    item => item.documento === fila.documento
  )

  editando.value = true
  dialogo.value = true
}

function eliminarSupervisor(documento) {
  documentoEliminar.value = documento
  dialogoEliminar.value = true
}

function confirmarEliminar() {
  store.eliminar(documentoEliminar.value)
  documentoEliminar.value = ''
  dialogoEliminar.value = false
  $q.notify({
    type: 'info',
    message: 'Supervisor eliminado correctamente.'
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
    password: ''
  }
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
=======
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'

const $q = useQuasar()
const rows = ref([])
const filtro = ref('')
const cargando = ref(false)
const procesando = ref(false)
const dialogo = ref(false)
const editando = ref(false)
const idEditar = ref(null)
const form = ref(defaultForm())

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

function defaultForm() {
  return { nombre_completo: '', correo_institucional: '', password: '', telefono: '', cargo: '' }
}

onMounted(cargar)

async function cargar() {
  cargando.value = true
  try {
    const { data } = await api.get('/api/usuarios')
    rows.value = data.filter((u) => u.rol === 'Supervisor').map(mapa)
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudieron cargar los supervisores.' })
  } finally {
    cargando.value = false
  }
}

function mapa(u) {
  return {
    id: u._id,
    nombre: u.nombre_completo,
    correo: u.correo_institucional,
    telefono: u.telefono || '',
    activo: u.activo !== false
  }
}

function abrirNuevo() {
  editando.value = false
  idEditar.value = null
  form.value = defaultForm()
  dialogo.value = true
}

function abrirEditar(fila) {
  editando.value = true
  idEditar.value = fila.id
  form.value = { ...defaultForm(), nombre_completo: fila.nombre, correo_institucional: fila.correo, telefono: fila.telefono }
  dialogo.value = true
>>>>>>> origin/frontend-juanpablo
}

async function guardar() {
  if (!form.value.nombre_completo || !form.value.correo_institucional) {
    $q.notify({ type: 'warning', message: 'Nombre y correo son obligatorios.' })
    return
  }
  procesando.value = true
  try {
    if (editando.value) {
      await api.patch(`/api/usuarios/${idEditar.value}`, {
        nombre_completo: form.value.nombre_completo,
        telefono: form.value.telefono,
        cargo: form.value.cargo
      })
    } else {
      if (!form.value.password) {
        $q.notify({ type: 'warning', message: 'La contraseña es obligatoria.' })
        return
      }
      await api.post('/api/usuarios', {
        nombre_completo: form.value.nombre_completo,
        correo_institucional: form.value.correo_institucional,
        password: form.value.password,
        rol: 'Supervisor',
        telefono: form.value.telefono,
        cargo: form.value.cargo
      })
    }
    $q.notify({ type: 'positive', message: 'Guardado correctamente.' })
    dialogo.value = false
    await cargar()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudo guardar.' })
  } finally {
    procesando.value = false
  }
}

async function alternarEstado(fila) {
  try {
    const { data } = await api.patch(`/api/usuarios/estado/${fila.id}`, { activo: !fila.activo })
    $q.notify({ type: 'positive', message: data.mensaje })
    await cargar()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudo cambiar el estado.' })
  }
}
</script>
