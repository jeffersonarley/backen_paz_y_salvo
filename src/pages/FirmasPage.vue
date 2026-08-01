<template>
  <q-page class="q-pa-lg">

    <div class="row items-center justify-between q-mb-lg">

      <div class="text-h4 text-primary text-weight-bold">
        Responsables de Área
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
      title="Solicitudes de Firma"
      :rows="rows"
      :columns="columns"
      :filter="filtro"
      row-key="id"
      flat
      bordered
    >

      <template #body-cell-estado="props">

        <q-td :props="props">

          <q-badge
            :color="
              props.row.estado === 'Firmado'
                ? 'positive'
                : props.row.estado === 'Pendiente'
                ? 'warning'
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
            color="positive"
            icon="how_to_reg"
            @click="firmar(props.row)"
          />

          <q-btn
            flat
            round
            color="orange"
            icon="report_problem"
            @click="rechazar(props.row)"
          />

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
            @click="eliminarSolicitud(props.row.id)"
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
            type="textarea"
            v-model="solicitud.observacion"
            label="Observación"
            autogrow
          />

          <q-select
            class="q-mt-md"
            outlined
            v-model="solicitud.estado"
            :options="['Pendiente','Firmado','Rechazado']"
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

    <!-- Confirmar eliminación -->

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

const idEliminar = ref(null)

const rows = ref([])

const solicitud = ref({
  numeroContrato: '',
  contratista: '',
  dependencia: '',
  responsable: '',
  observacion: '',
  estado: 'Pendiente'
})

const columns = [
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
    name: 'responsable',
    label: 'Responsable',
    field: 'responsable',
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
    !solicitud.value.numeroContrato ||
    !solicitud.value.contratista ||
    !solicitud.value.dependencia ||
    !solicitud.value.responsable
  ) {

    alert('Todos los campos son obligatorios.')

    return

  }

  const existeContrato = rows.value.some((item, index) => {
    return (
      item.numeroContrato === solicitud.value.numeroContrato &&
      index !== indiceEditar.value
    )
  })

  if (existeContrato) {

    alert('Ya existe una solicitud con ese número de contrato.')

    return

  }

  if (editando.value) {

    rows.value[indiceEditar.value] = {
      ...solicitud.value
    }

  } else {

    rows.value.push({
      id: Date.now(),
      ...solicitud.value
    })

  }

  solicitud.value = {
    numeroContrato: '',
    contratista: '',
    dependencia: '',
    responsable: '',
    observacion: '',
    estado: 'Pendiente'
  }

  dialogo.value = false
  editando.value = false
  indiceEditar.value = null

}

function editarSolicitud(fila) {

  solicitud.value = { ...fila }

  indiceEditar.value = rows.value.findIndex(
    item => item.id === fila.id
  )

  editando.value = true

  dialogo.value = true

}

function eliminarSolicitud(id) {

  idEliminar.value = id

  dialogoEliminar.value = true

}

function confirmarEliminar() {

  rows.value = rows.value.filter(
    item => item.id !== idEliminar.value
  )

  idEliminar.value = null

  dialogoEliminar.value = false

}

function firmar(fila) {

  fila.estado = 'Firmado'

}

function rechazar(fila) {

  const motivo = prompt('Ingrese la observación')

  if (!motivo) return

  fila.observacion = motivo

  fila.estado = 'Rechazado'

}

function nuevaSolicitud() {

  editando.value = false

  indiceEditar.value = null

  solicitud.value = {
    numeroContrato: '',
    contratista: '',
    dependencia: '',
    responsable: '',
    observacion: '',
    estado: 'Pendiente'
  }

  dialogo.value = true

}

function cancelar() {

  dialogo.value = false

  editando.value = false

  indiceEditar.value = null

  solicitud.value = {
    numeroContrato: '',
    contratista: '',
    dependencia: '',
    responsable: '',
    observacion: '',
    estado: 'Pendiente'
  }

}
</script>