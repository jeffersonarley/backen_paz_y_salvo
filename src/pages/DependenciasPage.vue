<template>
  <q-page class="q-pa-lg">

    <div class="row items-center justify-between q-mb-lg">

      <div class="text-h4 text-primary text-weight-bold">
        Dependencias
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nueva Dependencia"
        @click="nuevaDependencia"
      />

    </div>

    <div class="row q-mb-md">

      <q-input
        v-model="filtro"
        outlined
        dense
        clearable
        style="width:300px"
        placeholder="Buscar dependencia..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>

      </q-input>

    </div>

    <q-table
      title="Listado de Dependencias"
      :rows="store.dependencias"
      :columns="columns"
      :filter="filtro"
      row-key="codigo"
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
            @click="editarDependencia(props.row)"
          />

          <q-btn
            flat
            round
            color="negative"
            icon="delete"
            @click="eliminarDependencia(props.row.codigo)"
          />

        </q-td>

      </template>

    </q-table>
  
   <q-dialog v-model="dialogo">

  <q-card style="min-width:500px">

    <q-card-section>

    <div class="text-h6 text-primary">
  {{ editando ? 'Editar Dependencia' : 'Nueva Dependencia' }}
    </div>

    </q-card-section>

    <q-card-section>

      <q-input
        v-model="dependencia.codigo"
        label="Código"
        outlined
        
        class="q-mb-md"
      />

      <q-input
        v-model="dependencia.nombre"
        label="Nombre"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="dependencia.responsable"
        label="Responsable de Área"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="dependencia.correo"
        label="Correo"
        outlined
        class="q-mb-md"
      />

      <q-select
        v-model="dependencia.estado"
        :options="['Activa','Inactiva']"
        label="Estado"
        outlined
      />

    </q-card-section>

    <q-card-actions align="right">

      <q-btn
        flat
        label="Cancelar"
        color="negative"
        @click="cancelar"
      />

      <q-btn
        color="positive"
        label="Guardar"
        @click="guardarDependencia"
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
      ¿Está seguro de eliminar esta dependencia?
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
import { useDependenciasStore } from '../stores/Dependencias.js'

const filtro = ref('')

const store = useDependenciasStore()

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
    align: 'left'
  },
  {
    name: 'nombre',
    label: 'Dependencia',
    field: 'nombre',
    align: 'left'
  },
  {
    name: 'responsable',
    label: 'Responsable',
    field: 'responsable',
    align: 'left'
  },
  {
    name: 'correo',
    label: 'Correo',
    field: 'correo',
    align: 'left'
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'center'
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center'
  }
]

function guardarDependencia() {
 
  // Validar campos obligatorios
  if (
    !dependencia.value.codigo ||
    !dependencia.value.nombre ||
    !dependencia.value.responsable ||
    !dependencia.value.correo ||
    !dependencia.value.estado
  ) {

    alert('Todos los campos son obligatorios.')

    return

  }

 const existeCodigo = store.dependencias.some((item, index) => {
  return (
    item.codigo === dependencia.value.codigo &&
    index !== indiceEditar.value
  )
})

if (existeCodigo) {
  alert('Ya existe una dependencia con ese código.')
  return
}

  // Validar correo
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!correoValido.test(dependencia.value.correo)) {

    alert('Ingrese un correo electrónico válido.')

    return

  }

  if (editando.value) {

store.editar(indiceEditar.value, {
  codigo: dependencia.value.codigo,
  nombre: dependencia.value.nombre,
  responsable: dependencia.value.responsable,
  correo: dependencia.value.correo,
  estado: dependencia.value.estado
});

} else {

store.agregar({
  codigo: dependencia.value.codigo,
  nombre: dependencia.value.nombre,
  responsable: dependencia.value.responsable,
  correo: dependencia.value.correo,
  estado: dependencia.value.estado
})

}
  // Limpiar formulario
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

   

}

function editarDependencia(fila) {

  dependencia.value = { ...fila }
 
  indiceEditar.value = store.dependencias.findIndex(
    item => item.codigo === fila.codigo
  )

  editando.value = true
  dialogo.value = true
}

function confirmarEliminar() {
  store.eliminar(codigoEliminar.value)
  codigoEliminar.value = ''
  dialogoEliminar.value = false
}
function eliminarDependencia(codigo) {

  codigoEliminar.value = codigo

  dialogoEliminar.value = true

}
function nuevaDependencia() {

  editando.value = false
  indiceEditar.value = null

  dependencia.value = {
    codigo: '',
    nombre: '',
    responsable: '',
    correo: '',
    estado: 'Activa'
  }

  dialogo.value = true

}

function cancelar() {

  dialogo.value = false

  editando.value = false

  indiceEditar.value = null

  dependencia.value = {
    codigo: '',
    nombre: '',
    responsable: '',
    correo: '',
    estado: 'Activa'
  }

}
</script>