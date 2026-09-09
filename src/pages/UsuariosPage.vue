<template>
  <q-page class="q-pa-lg">
<<<<<<< HEAD
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">
          Gestión de Usuarios
        </div>
        <div class="text-subtitle2 text-grey-7">
          Administración de cuentas y roles del sistema GCCON-F-088
        </div>
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nuevo Usuario"
        unelevated
        @click="nuevoUsuario"
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
        placeholder="Buscar por documento, nombre o correo..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Tabla de Usuarios -->
    <q-table
      title="Listado de Usuarios"
      :rows="rows"
      :columns="columns"
      :filter="filtro"
      row-key="documento"
      flat
      bordered
      no-data-label="No hay usuarios registrados"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-rol="props">
        <q-td :props="props">
          <q-badge
            :color="
              props.row.rol === 'Administrador'
                ? 'purple'
                : props.row.rol === 'Supervisor'
                ? 'indigo'
                : props.row.rol === 'Responsable de Área'
                ? 'teal'
                : 'blue-grey'
            "
            class="q-pa-xs text-weight-bold"
          >
            {{ props.row.rol }}
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
            @click="editarUsuario(props.row)"
          >
            <q-tooltip>Editar Usuario</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="eliminarUsuario(props.row.documento)"
          >
            <q-tooltip>Eliminar Usuario</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario Creación / Edición -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw;">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-primary text-weight-bold">
            {{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cancelar" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="guardarUsuario">
          <q-card-section class="q-gutter-y-sm">
            <q-input
              v-model="usuario.documento"
              label="Documento de Identidad *"
              outlined
              dense
              :disable="editando"
              :rules="[val => !!val || 'El documento es obligatorio']"
            />

            <q-input
              v-model="usuario.nombre"
              label="Nombre Completo *"
              outlined
              dense
              :rules="[val => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="usuario.correo"
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
              v-model="usuario.telefono"
              label="Teléfono"
              outlined
              dense
            />

            <q-select
              v-model="usuario.rol"
              :options="roles"
              label="Rol de Usuario *"
              outlined
              dense
              :rules="[val => !!val || 'Debe seleccionar un rol']"
            />

            <q-input
              v-model="usuario.password"
              :label="editando ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'"
              :type="mostrarPassword ? 'text' : 'password'"
              outlined
              dense
              :rules="editando ? [] : [val => !!val || 'La contraseña es obligatoria']"
            >
              <template #append>
                <q-icon
                  :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrarPassword = !mostrarPassword"
                />
              </template>
            </q-input>
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
          ¿Está seguro de eliminar al usuario con documento <strong>{{ documentoEliminar }}</strong>?
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
      <div class="text-h4 text-weight-bold text-grey-9">
        Usuarios
      </div>
      <q-btn no-caps unelevated color="primary" icon="add" label="Nuevo usuario" @click="abrirNuevo" />
    </div>

    <q-card flat bordered class="bg-white q-pa-md">
      <div class="row q-mb-md">
        <q-input
          v-model="filtro"
          outlined
          dense
          clearable
          style="width:340px"
          placeholder="Buscar usuario..."
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <q-table
        :rows="rows"
        :columns="columns"
        :filter="filtro"
        row-key="id"
        flat
        bordered
        :loading="cargando"
        no-data-label="No hay usuarios registrados."
        hide-bottom
      >
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge
              class="q-px-sm"
              :color="props.row.activo ? 'green-1' : 'red-1'"
              :text-color="props.row.activo ? 'green-9' : 'red-8'"
            >
              {{ props.row.activo ? 'Activo' : 'Inactivo' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props">
            <q-btn flat round color="grey-7" icon="edit" size="sm" title="Editar" @click="abrirEditar(props.row)" />
            <q-btn
              flat
              round
              :color="props.row.activo ? 'grey-7' : 'positive'"
              :icon="props.row.activo ? 'lock' : 'lock_open'"
              size="sm"
              :title="props.row.activo ? 'Deshabilitar' : 'Habilitar'"
              @click="alternarEstado(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="min-width:500px">
        <q-card-section>
          <div class="text-h6 text-grey-9">
            {{ editando ? 'Editar usuario' : 'Nuevo usuario' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="form.nombre_completo" label="Nombre completo" outlined dense class="q-mb-md" :disable="procesando" />
          <q-input v-model="form.documento" label="Documento" outlined dense class="q-mb-md" :disable="procesando" />
          <q-input v-model="form.correo_institucional" label="Correo institucional" outlined dense type="email" class="q-mb-md" :disable="procesando || editando" />
          <div v-if="!editando" class="q-mb-md">
            <q-input v-model="form.password" label="Contraseña" outlined dense type="password" :disable="procesando" />
            <div class="q-mt-md">
              <q-select v-model="form.rol" :options="rolesCreables" label="Rol" outlined dense :disable="procesando" />
            </div>
          </div>
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

const $q = useQuasar()

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
    name: 'rol',
    label: 'Rol',
    field: 'rol',
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

const rows = ref([
  {
    documento: '1098765432',
    nombre: 'Paula Valentina Rache',
    correo: 'paula.rache@sena.edu.co',
    telefono: '3100000000',
    rol: 'Administrador'
  }
])

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const documentoEliminar = ref('')
const editando = ref(false)
const indiceEditar = ref(null)
const mostrarPassword = ref(false)

const roles = [
  'Administrador',
  'Supervisor',
  'Responsable de Área',
  'Contratista'
=======
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const $q = useQuasar()
const auth = useAuthStore()

const rows = ref([])
const filtro = ref('')
const cargando = ref(false)
const procesando = ref(false)
const dialogo = ref(false)
const editando = ref(false)
const idEditar = ref(null)
const form = ref(defaultForm())

const columns = [
  { name: 'documento', label: 'Documento', field: 'documento', align: 'left' },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
>>>>>>> origin/frontend-juanpablo
]

const rolesCreables = computed(() => {
  if (auth.rol === 'Administrador') return ['Supervisor']
  if (auth.rol === 'Supervisor') return ['Contratista', 'ResponsableArea']
  return []
})

<<<<<<< HEAD
function guardarUsuario() {
  if (!editando.value) {
    const existeDocumento = rows.value.some(
      item => item.documento === usuario.value.documento
    )

    if (existeDocumento) {
      $q.notify({
        type: 'negative',
        message: 'Ya existe un usuario registrado con ese documento.'
      })
      return
    }
  }

  if (editando.value) {
    rows.value[indiceEditar.value] = {
      documento: usuario.value.documento,
      nombre: usuario.value.nombre,
      correo: usuario.value.correo,
      telefono: usuario.value.telefono,
      rol: usuario.value.rol
    }

    $q.notify({
      type: 'positive',
      message: 'Usuario actualizado correctamente.'
    })
  } else {
    rows.value.push({
      documento: usuario.value.documento,
      nombre: usuario.value.nombre,
      correo: usuario.value.correo,
      telefono: usuario.value.telefono,
      rol: usuario.value.rol
    })

    $q.notify({
      type: 'positive',
      message: 'Usuario registrado correctamente.'
    })
  }

  limpiarFormulario()
}

function nuevoUsuario() {
  limpiarFormulario()
  dialogo.value = true
}

function editarUsuario(fila) {
  usuario.value = { ...fila, password: '' }
  indiceEditar.value = rows.value.findIndex(
    item => item.documento === fila.documento
  )
  editando.value = true
  dialogo.value = true
}

function eliminarUsuario(documento) {
  documentoEliminar.value = documento
  dialogoEliminar.value = true
}

function confirmarEliminar() {
  rows.value = rows.value.filter(
    u => u.documento !== documentoEliminar.value
  )
  dialogoEliminar.value = false
  $q.notify({
    type: 'info',
    message: 'Usuario eliminado.'
  })
}

function cancelar() {
  limpiarFormulario()
}

function limpiarFormulario() {
  usuario.value = {
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    rol: '',
    password: ''
  }
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
  mostrarPassword.value = false
}
</script>
=======
function defaultForm() {
  return { nombre_completo: '', correo_institucional: '', password: '', rol: '', telefono: '', cargo: '', documento: '' }
}

onMounted(cargar)

async function cargar() {
  cargando.value = true
  try {
    const { data } = await api.get('/api/usuarios')
    rows.value = data.map((u) => ({
      id: u._id,
      nombre: u.nombre_completo,
      correo: u.correo_institucional,
      rol: u.rol,
      activo: u.activo !== false,
      telefono: u.telefono || '',
      cargo: u.cargo || '',
      documento: u.documento || '—'
    }))
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudieron cargar los usuarios.' })
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
  editando.value = true
  idEditar.value = fila.id
  form.value = {
    nombre_completo: fila.nombre,
    correo_institucional: fila.correo,
    password: '',
    rol: fila.rol,
    telefono: fila.telefono,
    cargo: fila.cargo,
    documento: fila.documento
  }
  dialogo.value = true
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
        cargo: form.value.cargo,
        documento: form.value.documento,
        rol: form.value.rol
      })
    } else {
      if (!form.value.password || !form.value.rol) {
        $q.notify({ type: 'warning', message: 'Contraseña y rol son obligatorios.' })
        return
      }
      await api.post('/api/usuarios', {
        nombre_completo: form.value.nombre_completo,
        correo_institucional: form.value.correo_institucional,
        password: form.value.password,
        rol: form.value.rol,
        telefono: form.value.telefono,
        cargo: form.value.cargo,
        documento: form.value.documento
      })
    }
    $q.notify({ type: 'positive', message: editando.value ? 'Usuario actualizado.' : 'Usuario creado.' })
    dialogo.value = false
    await cargar()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudo guardar el usuario.' })
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
>>>>>>> origin/frontend-juanpablo
