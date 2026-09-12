<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Gestión de Usuarios</div>
        <div class="text-subtitle2 text-grey-7">
          Administración de cuentas y roles del sistema GCCON-F-088
        </div>
      </div>

      <q-btn color="positive" icon="add" label="Nuevo Usuario" unelevated @click="nuevoUsuario" />
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
          <q-btn flat round dense color="primary" icon="edit" @click="editarUsuario(props.row)">
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
      <q-card style="min-width: 500px; max-width: 90vw">
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
              :rules="[(val) => !!val || 'El documento es obligatorio']"
            />

            <q-input
              v-model="usuario.nombre"
              label="Nombre Completo *"
              outlined
              dense
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="usuario.correo"
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

            <q-input v-model="usuario.telefono" label="Teléfono" outlined dense />

            <q-select
              v-model="usuario.rol"
              :options="roles"
              label="Rol de Usuario *"
              outlined
              dense
              :rules="[(val) => !!val || 'Debe seleccionar un rol']"
            />

            <q-input
              v-model="usuario.password"
              :label="editando ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'"
              :type="mostrarPassword ? 'text' : 'password'"
              outlined
              dense
              :rules="editando ? [] : [(val) => !!val || 'La contraseña es obligatoria']"
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
            <q-btn flat label="Cancelar" color="grey-8" @click="cancelar" />
            <q-btn unelevated type="submit" color="positive" label="Guardar" />
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
          ¿Está seguro de eliminar al usuario con documento <strong>{{ documentoEliminar }}</strong
          >?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn unelevated color="negative" label="Eliminar" @click="confirmarEliminar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

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
    name: 'correo',
    label: 'Correo',
    field: 'correo',
    align: 'left',
    sortable: true,
  },
  {
    name: 'rol',
    label: 'Rol',
    field: 'rol',
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

const rows = ref([
  {
    documento: '1098765432',
    nombre: 'Paula Valentina Rache',
    correo: 'paula.rache@sena.edu.co',
    telefono: '3100000000',
    rol: 'Administrador',
  },
])

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const documentoEliminar = ref('')
const editando = ref(false)
const indiceEditar = ref(null)
const mostrarPassword = ref(false)

const roles = ['Administrador', 'Supervisor', 'Responsable de Área', 'Contratista']

const usuario = ref({
  documento: '',
  nombre: '',
  correo: '',
  telefono: '',
  rol: '',
  password: '',
})

function guardarUsuario() {
  if (!editando.value) {
    const existeDocumento = rows.value.some((item) => item.documento === usuario.value.documento)

    if (existeDocumento) {
      $q.notify({
        type: 'negative',
        message: 'Ya existe un usuario registrado con ese documento.',
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
      rol: usuario.value.rol,
    }

    $q.notify({
      type: 'positive',
      message: 'Usuario actualizado correctamente.',
    })
  } else {
    rows.value.push({
      documento: usuario.value.documento,
      nombre: usuario.value.nombre,
      correo: usuario.value.correo,
      telefono: usuario.value.telefono,
      rol: usuario.value.rol,
    })

    $q.notify({
      type: 'positive',
      message: 'Usuario registrado correctamente.',
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
  indiceEditar.value = rows.value.findIndex((item) => item.documento === fila.documento)
  editando.value = true
  dialogo.value = true
}

function eliminarUsuario(documento) {
  documentoEliminar.value = documento
  dialogoEliminar.value = true
}

function confirmarEliminar() {
  rows.value = rows.value.filter((u) => u.documento !== documentoEliminar.value)
  dialogoEliminar.value = false
  $q.notify({
    type: 'info',
    message: 'Usuario eliminado.',
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
    password: '',
  }
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
  mostrarPassword.value = false
}
</script>
