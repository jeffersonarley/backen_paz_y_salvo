<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Contratistas</div>
        <div class="text-subtitle2 text-grey-7">
          Gestión de contratistas del sistema GCCON-F-088
        </div>
      </div>

      <q-btn
        color="positive"
        icon="add"
        label="Nuevo Contratista"
        unelevated
        @click="nuevoContratista"
      />
    </div>

    <div class="row q-mb-md">
      <q-input
        v-model="filtro"
        outlined
        dense
        clearable
        style="width: 320px"
        placeholder="Buscar contratista..."
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      title="Listado de Contratistas"
      :rows="contratistas"
      :columns="columns"
      :filter="filtro"
      row-key="id"
      flat
      bordered
      :loading="cargando"
      no-data-label="No hay contratistas registrados"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="editarContratista(props.row)">
            <q-tooltip>Editar Contratista</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="eliminarContratista(props.row.documento)"
          >
            <q-tooltip>Eliminar Contratista</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-primary text-weight-bold">
            {{ editando ? 'Editar Contratista' : 'Nuevo Contratista' }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cancelar" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="guardarContratista">
          <q-card-section class="q-gutter-y-sm">
            <q-input
              v-model="contratista.documento"
              label="Documento de Identidad *"
              outlined
              dense
              :disable="editando"
              :rules="[(val) => !!val || 'El documento es obligatorio']"
            />

            <q-input
              v-model="contratista.nombre"
              label="Nombre Completo *"
              outlined
              dense
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="contratista.correo"
              label="Correo Electrónico *"
              outlined
              dense
              type="email"
              :rules="[
                (val) => !!val || 'El correo es obligatorio',
                (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Ingrese un correo electrónico válido'
              ]"
            />

            <q-input
              v-model="contratista.telefono"
              label="Teléfono de Contacto *"
              outlined
              dense
              :rules="[(val) => !!val || 'El teléfono es obligatorio']"
            />

            <q-input
              v-model="contratista.password"
              label="Contraseña de Acceso *"
              type="password"
              outlined
              dense
              :rules="[(val) => editando || !!val || 'La contraseña es obligatoria']"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" color="grey-8" @click="cancelar" />
            <q-btn unelevated type="submit" color="positive" label="Guardar" :loading="guardando" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoEliminar">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" class="q-mr-sm" />
          <span class="text-h6">Confirmar eliminación</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          ¿Está seguro de eliminar al contratista con documento
          <strong>{{ documentoEliminar }}</strong
          >?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn unelevated color="negative" label="Eliminar" :loading="guardando" @click="confirmarEliminar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { getErrorMessage } from '@/services/axios'
import { useContratistasStore } from '@/stores/useContratistasStore'

const store = useContratistasStore()
const $q = useQuasar()

const contratistas = computed(() => store.contratistas)
const cargando = computed(() => store.cargando)

const dialogo = ref(false)
const dialogoEliminar = ref(false)
const documentoEliminar = ref('')
const editando = ref(false)
const guardando = ref(false)
const filtro = ref('')

const contratista = ref({
  documento: '',
  nombre: '',
  correo: '',
  telefono: '',
  password: ''
})

const columns = [
  { name: 'documento', label: 'Documento', field: 'documento', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left', sortable: true },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

onMounted(cargarInicial)

async function cargarInicial() {
  try {
    await store.cargarContratistas()
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error, 'No se pudieron cargar los contratistas.') })
  }
}

async function guardarContratista() {
  if (!editando.value) {
    const existeDocumento = store.contratistas.some(
      (item) => item.documento === contratista.value.documento
    )
    if (existeDocumento) {
      $q.notify({
        type: 'negative',
        message: 'Ya existe un contratista registrado con ese documento.'
      })
      return
    }
  }

  guardando.value = true
  try {
    if (editando.value) {
      await store.editar({ ...contratista.value })
      $q.notify({ type: 'positive', message: 'Contratista actualizado correctamente.' })
    } else {
      await store.agregar({ ...contratista.value })
      $q.notify({ type: 'positive', message: 'Contratista registrado correctamente.' })
    }
    limpiarFormulario()
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error, 'No se pudo guardar el contratista.') })
  } finally {
    guardando.value = false
  }
}

function nuevoContratista() {
  limpiarFormulario()
  dialogo.value = true
}

function editarContratista(fila) {
  contratista.value = {
    ...fila,
    password: ''
  }
  editando.value = true
  dialogo.value = true
}

function eliminarContratista(documento) {
  documentoEliminar.value = documento
  dialogoEliminar.value = true
}

async function confirmarEliminar() {
  guardando.value = true
  try {
    await store.eliminar(documentoEliminar.value)
    $q.notify({ type: 'info', message: 'Contratista eliminado correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error, 'No se pudo eliminar el contratista.') })
  } finally {
    guardando.value = false
    documentoEliminar.value = ''
    dialogoEliminar.value = false
  }
}

function cancelar() {
  limpiarFormulario()
}

function limpiarFormulario() {
  contratista.value = {
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    password: ''
  }
  dialogo.value = false
  editando.value = false
}
</script>