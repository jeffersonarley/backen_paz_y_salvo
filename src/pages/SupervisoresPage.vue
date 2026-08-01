<template>
  <q-page class="q-pa-lg">

    <div class="row items-center justify-between q-mb-lg">

      <div class="text-h4 text-primary text-weight-bold">
        Supervisores
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nuevo Supervisor"
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
        placeholder="Buscar supervisor..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>

      </q-input>

    </div>

    <q-table
      title="Listado de Supervisores"
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
            @click="editarSupervisor(props.row)"
          />

          <q-btn
            flat
            round
            color="negative"
            icon="delete"
            @click="eliminarSupervisor(props.row.documento)"
          />

        </q-td>

      </template>

    </q-table>
  
   <q-dialog v-model="dialogo">

  <q-card style="min-width:500px">

    <q-card-section>

      <div class="text-h6 text-primary">
        Nuevo Supervisor
      </div>

    </q-card-section>

    <q-card-section>

      <q-input
        v-model="supervisor.documento"
        label="Documento"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="supervisor.nombre"
        label="Nombre"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="supervisor.correo"
        label="Correo"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="supervisor.telefono"
        label="Teléfono"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="supervisor.password"
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
        @click="guardarSupervisor"
      />

    </q-card-actions>

  </q-card>

</q-dialog>

<!-- AQUÍ VA EL NUEVO DIÁLOGO -->

<q-dialog v-model="dialogoEliminar">

  <q-card style="min-width:350px">

    <q-card-section class="text-h6">
      Confirmar eliminación
    </q-card-section>

    <q-card-section>
      ¿Está seguro de eliminar este supervisor?
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

const filtro = ref('')

const rows = ref([])

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
    name: 'telefono',
    label: 'Teléfono',
    field: 'telefono',
    align: 'left'
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center'
  }
]

function guardarSupervisor() {

  // Validar campos obligatorios
  if (
    !supervisor.value.documento ||
    !supervisor.value.nombre ||
    !supervisor.value.correo ||
    !supervisor.value.telefono ||
    !supervisor.value.password
  ) {

    alert('Todos los campos son obligatorios.')

    return

  }

 if (!editando.value) {

  const existeDocumento = rows.value.some(
    item => item.documento === supervisor.value.documento
  )

  if (existeDocumento) {

    alert('Ya existe un supervisor con ese documento.')

    return

  }

}

  // Validar correo
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!correoValido.test(supervisor.value.correo)) {

    alert('Ingrese un correo electrónico válido.')

    return

  }

  if (editando.value) {

 rows.value[indiceEditar.value] = {
  documento: supervisor.value.documento,
  nombre: supervisor.value.nombre,
  correo: supervisor.value.correo,
  telefono: supervisor.value.telefono,
  password: supervisor.value.password
}

  editando.value = false
  indiceEditar.value = null

} else {

rows.value.push({
  documento: supervisor.value.documento,
  nombre: supervisor.value.nombre,
  correo: supervisor.value.correo,
  telefono: supervisor.value.telefono,
  password: supervisor.value.password
})

}
  // Limpiar formulario
  supervisor.value = {

    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    password: ''
  }

  dialogo.value = false

}

function editarSupervisor(fila) {

  supervisor.value = {
  ...fila,
  password: fila.password || ''
}

  indiceEditar.value = rows.value.findIndex(
    item => item.documento === fila.documento
  )

  editando.value = true

  dialogo.value = true

}
function confirmarEliminar() {

  rows.value = rows.value.filter(
    supervisor => supervisor.documento !== documentoEliminar.value
  )

  dialogoEliminar.value = false

}
</script>