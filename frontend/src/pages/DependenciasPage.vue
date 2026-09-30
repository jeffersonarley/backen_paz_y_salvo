<template>
  <q-page class="q-pa-lg">
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Dependencias</div>
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
      :loading="store.cargando"
      :rows-per-page-options="[10, 25, 50, 0]"
      :pagination="{ rowsPerPage: 25 }"
      no-data-label="No hay dependencias registradas"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-estado="props">
        <q-td :props="props">
          <q-badge
            :color="
              props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva'
                ? 'negative'
                : 'positive'
            "
            class="q-pa-xs text-weight-bold"
          >
            {{
              props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva'
                ? 'Inactiva'
                : 'Activa'
            }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="editarDependencia(props.row)">
            <q-tooltip>Editar Dependencia</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="domain_disabled"
            @click="eliminarDependencia(props.row.codigo)"
          >
            <q-tooltip>{{
              props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva'
                ? 'Activar Dependencia'
                : 'Desactivar Dependencia'
            }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario Creación / Edición -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
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
              :rules="[(val) => !!val || 'El código es obligatorio']"
            />

            <q-input
              v-model="dependencia.nombre"
              label="Nombre *"
              outlined
              dense
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="dependencia.responsable"
              label="Responsable de Área *"
              outlined
              dense
              :rules="[(val) => !!val || 'El responsable es obligatorio']"
            />

            <q-input
              v-model="dependencia.correo"
              label="Correo *"
              outlined
              dense
              type="email"
              :rules="[
                (val) => !!val || 'El correo es obligatorio',
                (val) =>
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Ingrese un correo electrónico válido',
              ]"
            />

            <q-select
              v-model="dependencia.estado"
              :options="['Activo', 'Inactivo']"
              label="Estado"
              outlined
              dense
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" color="grey-8" @click="cancelar" />
            <q-btn unelevated type="submit" color="positive" label="Guardar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo Confirmar Desactivación / Activación -->
    <q-dialog v-model="dialogoEliminar">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="esInactivaSeleccionada ? 'check_circle' : 'domain_disabled'"
            :color="esInactivaSeleccionada ? 'positive' : 'negative'"
            text-color="white"
            class="q-mr-sm"
          />
          <span class="text-h6">{{
            esInactivaSeleccionada ? 'Confirmar activación' : 'Confirmar desactivación'
          }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          ¿Está seguro de {{ esInactivaSeleccionada ? 'activar' : 'desactivar' }} la dependencia con
          código <strong>{{ codigoEliminar }}</strong
          >?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            :color="esInactivaSeleccionada ? 'positive' : 'negative'"
            :label="esInactivaSeleccionada ? 'Activar' : 'Desactivar'"
            @click="confirmarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const esInactivaSeleccionada = computed(() => {
  const d = store.dependencias.find((item) => item.codigo === codigoEliminar.value)
  return d ? d.estado === 'Inactiva' || d.estado === 'Inactivo' : false
})

const dependencia = ref({
  codigo: '',
  nombre: '',
  responsable: '',
  correo: '',
  estado: 'Activa',
})

const columns = [
  {
    name: 'codigo',
    label: 'Código',
    field: 'codigo',
    align: 'left',
    sortable: true,
  },
  {
    name: 'nombre',
    label: 'Dependencia',
    field: 'nombre',
    align: 'left',
    sortable: true,
  },
  {
    name: 'responsable',
    label: 'Responsable',
    field: 'responsable',
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
    name: 'estado',
    label: 'Estado',
    field: 'estado',
    align: 'center',
    sortable: true,
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'acciones',
    align: 'center',
  },
]

function guardarDependencia() {
  const existeCodigo = store.dependencias.some((item, index) => {
    return item.codigo === dependencia.value.codigo && index !== indiceEditar.value
  })

  if (existeCodigo) {
    $q.notify({
      type: 'negative',
      message: 'Ya existe una dependencia con ese código.',
    })
    return
  }

  if (editando.value) {
    store.editar(indiceEditar.value, { ...dependencia.value })
    $q.notify({
      type: 'positive',
      message: 'Dependencia actualizada correctamente.',
    })
  } else {
    store.agregar({ ...dependencia.value })
    $q.notify({
      type: 'positive',
      message: 'Dependencia registrada correctamente.',
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
  indiceEditar.value = store.dependencias.findIndex((item) => item.codigo === fila.codigo)
  editando.value = true
  dialogo.value = true
}

function eliminarDependencia(codigo) {
  codigoEliminar.value = codigo
  dialogoEliminar.value = true
}

function confirmarEliminar() {
  const eraInactiva = esInactivaSeleccionada.value
  store.eliminar(codigoEliminar.value)
  codigoEliminar.value = ''
  dialogoEliminar.value = false
  $q.notify({
    type: 'info',
    message: eraInactiva
      ? 'Dependencia activada correctamente.'
      : 'Dependencia desactivada correctamente.',
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
    estado: 'Activa',
  }
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
}
</script>
