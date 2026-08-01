<template>
  <q-page class="q-pa-lg">

    <div class="row items-center justify-between q-mb-lg">

      <div class="text-h4 text-primary text-weight-bold">
        Usuarios
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nuevo Usuario"
        @click="dialogo = true"
      />

    </div>

    <div class="row q-mb-md">

      <q-input
        v-model="filtro"
        outlined
        dense
        clearable
        style="width:300px"
        placeholder="Buscar usuario..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

    </div>

    <q-table
      title="Listado de Usuarios"
      :rows="rows"
      :columns="columns"
      :filter="filtro"
      row-key="documento"
      flat
      bordered
    >

  <template #body-cell-acciones="props">

    <q-td :props="props">

      <q-btn
        flat
        round
        color="primary"
        icon="edit"
        @click="editarUsuario(props.row)"
      />

      <q-btn
        flat
        round
        color="negative"
        icon="delete"
        @click="eliminarUsuario(props.row.documento)"
      />

    </q-td>

  </template>

</q-table>
   
    <q-dialog v-model="dialogo">

  <q-card style="min-width:500px">

    <q-card-section>

      <div class="text-h6 text-primary">
        Nuevo Usuario
      </div>

    </q-card-section>

    <q-card-section>

      <q-input
        v-model="usuario.documento"
        label="Documento"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="usuario.nombre"
        label="Nombre"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="usuario.correo"
        label="Correo"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="usuario.telefono"
        label="Teléfono"
        outlined
        class="q-mb-md"
      />

      <q-select
        v-model="usuario.rol"
        :options="roles"
        label="Rol"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="usuario.password"
        label="Contraseña"
        type="password"
        outlined
      />

    </q-card-section>

    <q-card-actions align="right">

      <q-btn
        flat
        label="Cancelar"
        color="negative"
        v-close-popup
      />

      <q-btn
        color="positive"
        label="Guardar"
        @click="guardarUsuario"
      />

    </q-card-actions>

  </q-card>

</q-dialog>

<q-dialog v-model="dialogoEliminar">

  <q-card style="min-width:350px">

    <q-card-section class="text-h6">
      Confirmar eliminación
    </q-card-section>

    <q-card-section>
      ¿Está seguro de eliminar este usuario?
    </q-card-section>

    <q-card-actions align="right">

      <q-btn
        flat
        label="Cancelar"
        color="primary"
        v-close-popup
      />

      <q-btn
        color="negative"
        label="Eliminar"
        @click="confirmarEliminar"
      />

    </q-card-actions>

  </q-card>

</q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const columns = [
  {
    name: 'documento',
    label: 'Documento',
    field: 'documento',
    align: 'left'
  },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
    align: 'left'
  },
  {
    name: 'correo',
    label: 'Correo',
    field: 'correo',
    align: 'left'
  },
  {
    name: 'rol',
    label: 'Rol',
    field: 'rol',
    align: 'left'
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center'
  }
]

const rows = ref([])

const filtro = ref('')

const dialogo = ref(false)
const dialogoEliminar = ref(false)
const documentoEliminar = ref('')

const editando = ref(false)

const indiceEditar = ref(null)

const roles = [
  'Administrador',
  'Supervisor',
  'Responsable de Área',
  'Contratista'
]

const usuario = ref({
  documento: '',
  nombre: '',
  correo: '',
  telefono: '',
  rol: '',
  password: ''
})
function guardarUsuario() {

  if (
  !usuario.value.documento ||
  !usuario.value.nombre ||
  !usuario.value.correo ||
  !usuario.value.rol ||
  !usuario.value.password
) {

  alert('Todos los campos son obligatorios.')

  return

}

if (!editando.value) {

  const existeDocumento = rows.value.some(
    item => item.documento === usuario.value.documento
  )

  if (existeDocumento) {

    alert('Ya existe un usuario con ese documento.')

    return

  }

}

const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

if (!correoValido.test(usuario.value.correo)) {

  alert('Ingrese un correo electrónico válido.')

  return

}
  if (editando.value) {

    rows.value[indiceEditar.value] = {
      documento: usuario.value.documento,
      nombre: usuario.value.nombre,
      correo: usuario.value.correo,
      rol: usuario.value.rol
    }

    editando.value = false
    indiceEditar.value = null

  } else {

    rows.value.push({
      documento: usuario.value.documento,
      nombre: usuario.value.nombre,
      correo: usuario.value.correo,
      rol: usuario.value.rol
    })

  }

  usuario.value = {
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    rol: '',
    password: ''
  }

  dialogo.value = false

}
function eliminarUsuario(documento) {

  documentoEliminar.value = documento

  dialogoEliminar.value = true

}
function confirmarEliminar() {

  rows.value = rows.value.filter(
    usuario => usuario.documento !== documentoEliminar.value
  )

  dialogoEliminar.value = false

}
function editarUsuario(fila) {

  usuario.value = { ...fila }

  indiceEditar.value = rows.value.findIndex(
    item => item.documento === fila.documento
  )

  editando.value = true

  dialogo.value = true

}
</script>
