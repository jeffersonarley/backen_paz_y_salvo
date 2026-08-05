
<template>
  <q-page class="q-pa-lg">

    <div class="row items-center justify-between q-mb-lg">

      <div class="text-h4 text-primary text-weight-bold">
        Solicitudes
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nueva Solicitud"
        @click="nuevaSolicitud"
      />

    </div>

    <div class="row q-mb-md">

      <q-input
        v-model="filtro"
        outlined
        dense
        clearable
        style="width:300px"
        placeholder="Buscar solicitud..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

    </div>

    <q-table
      title="Listado de Solicitudes"
      :rows="rows"
      :columns="columns"
      :filter="filtro"
      row-key="numeroSolicitud"
      flat
      bordered
    >

      <template #body-cell-estado="props">

        <q-td :props="props">

          <q-badge
            :color="
              props.row.estado === 'Pendiente'
                ? 'warning'
                : props.row.estado === 'En revisión'
                ? 'primary'
                : props.row.estado === 'Firmado'
                ? 'positive'
                : props.row.estado === 'Finalizado'
                ? 'teal'
                : 'negative'
            "
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
            color="primary"
            icon="edit"
            @click="editarSolicitud(props.row)"
          />

          <q-btn
            flat
            round
            color="negative"
            icon="delete"
            @click="eliminarSolicitud(props.row.numeroSolicitud)"
          />

        </q-td>

      </template>

    </q-table>

    <!-- Dialogo -->

    <q-dialog v-model="dialogo">

      <q-card style="min-width:600px">

        <q-card-section>

          <div class="text-h6 text-primary">
            {{ editando ? 'Editar Solicitud' : 'Nueva Solicitud' }}
          </div>

        </q-card-section>

        <q-card-section>

          <q-input
            outlined
            v-model="solicitud.numeroSolicitud"
            label="Número de Solicitud"
            class="q-mb-md"
          />

          <q-input
            outlined
            v-model="solicitud.numeroContrato"
            label="Número de Contrato"
            class="q-mb-md"
          />

          <q-input
            outlined
            v-model="solicitud.contratista"
            label="Contratista"
            class="q-mb-md"
          />

          <q-input
            outlined
            v-model="solicitud.dependencia"
            label="Dependencia"
            class="q-mb-md"
          />

          <q-input
            outlined
            v-model="solicitud.responsable"
            label="Responsable de Área"
            class="q-mb-md"
          />

          <q-input
            outlined
            type="date"
            v-model="solicitud.fecha"
            label="Fecha"
            class="q-mb-md"
          />

          <q-select
            outlined
            v-model="solicitud.estado"
            :options="[
              'Pendiente',
              'En revisión',
              'Firmado',
              'Rechazado',
              'Finalizado'
            ]"
            label="Estado"
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
            @click="guardarSolicitud"
          />

        </q-card-actions>

      </q-card>

    </q-dialog>

    <!-- Eliminar -->

    <q-dialog v-model="dialogoEliminar">

      <q-card style="min-width:350px">

        <q-card-section class="text-h6">
          Confirmar eliminación
        </q-card-section>

        <q-card-section>
          ¿Está seguro de eliminar esta solicitud?
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

const dialogo = ref(false)
const dialogoEliminar = ref(false)

const editando = ref(false)
const indiceEditar = ref(null)

const solicitudEliminar = ref('')

const rows = ref([])

const solicitud = ref({
  numeroSolicitud: '',
  numeroContrato: '',
  contratista: '',
  dependencia: '',
  responsable: '',
  fecha: '',
  estado: 'Pendiente'
})

const columns = [
  {
    name: 'numeroSolicitud',
    label: 'Solicitud',
    field: 'numeroSolicitud',
    align: 'left'
  },
  {
    name: 'numeroContrato',
    label: 'Contrato',
    field: 'numeroContrato',
    align: 'left'
  },
  {
    name: 'contratista',
    label: 'Contratista',
    field: 'contratista',
    align: 'left'
  },
  {
    name: 'dependencia',
    label: 'Dependencia',
    field: 'dependencia',
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

function guardarSolicitud() {

  if (
    !solicitud.value.numeroSolicitud ||
    !solicitud.value.numeroContrato ||
    !solicitud.value.contratista ||
    !solicitud.value.dependencia ||
    !solicitud.value.responsable ||
    !solicitud.value.fecha
  ) {

    alert('Todos los campos son obligatorios.')

    return

  }

  const existe = rows.value.some((item, index) => {

    return (
      item.numeroSolicitud === solicitud.value.numeroSolicitud &&
      index !== indiceEditar.value
    )

  })

  if (existe) {

    alert('Ya existe una solicitud con ese número.')

    return

  }

  if (editando.value) {

    rows.value[indiceEditar.value] = {

      ...solicitud.value

    }

  } else {

    rows.value.push({

      ...solicitud.value

    })

  }

  limpiarFormulario()

}

function editarSolicitud(fila) {

  solicitud.value = { ...fila }

  indiceEditar.value = rows.value.findIndex(

    item => item.numeroSolicitud === fila.numeroSolicitud

  )

  editando.value = true

  dialogo.value = true

}

function eliminarSolicitud(numeroSolicitud) {

  solicitudEliminar.value = numeroSolicitud

  dialogoEliminar.value = true

}

function confirmarEliminar() {

  rows.value = rows.value.filter(

    item => item.numeroSolicitud !== solicitudEliminar.value

  )

  dialogoEliminar.value = false

  solicitudEliminar.value = ''

}

function nuevaSolicitud() {

  limpiarFormulario()

  dialogo.value = true

}

function cancelar() {

  limpiarFormulario()

}

function limpiarFormulario() {

  solicitud.value = {

    numeroSolicitud: '',
    numeroContrato: '',
    contratista: '',
    dependencia: '',
    responsable: '',
    fecha: '',
    estado: 'Pendiente'

  }

  dialogo.value = false

  editando.value = false

  indiceEditar.value = null

}
</script>