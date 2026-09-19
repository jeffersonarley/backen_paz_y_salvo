<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Supervisores</div>
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

    <q-table
      title="Listado de Supervisores"
      :rows="supervisores"
      :columns="columns"
      :filter="filtro"
      row-key="id"
      flat
      bordered
      :loading="cargando"
      no-data-label="No hay supervisores registrados"
      no-results-label="No se encontraron coincidencias"
    >
      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="editarSupervisor(props.row)">
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

    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
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
              :rules="[(val) => !!val || 'El documento es obligatorio']"
            />

            <q-input
              v-model="supervisor.nombre"
              label="Nombre Completo *"
              outlined
              dense
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model="supervisor.correo"
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
              v-model="supervisor.telefono"
              label="Teléfono de Contacto *"
              outlined
              dense
              :rules="[(val) => !!val || 'El teléfono es obligatorio']"
            />

            <q-input
              v-model="supervisor.password"
              label="Contraseña *"
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
          ¿Está seguro de eliminar al supervisor con documento
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
import { useSupervisoresStore } from '@/stores/useSupervisoresStore'

const store = useSupervisoresStore()
const $q = useQuasar()

const supervisores = computed(() => store.supervisores)
const cargando = computed(() => store.cargando)

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const documentoEliminar = ref('')
const editando = ref(false)
const guardando = ref(false)

const supervisor = ref({
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
    await store.cargarSupervisores()
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error, 'No se pudieron cargar los supervisores.') })
  }
}

async function guardarSupervisor() {
  if (!editando.value) {
    const existeDocumento = store.supervisores.some(
      (item) => item.documento === supervisor.value.documento
    )
    if (existeDocumento) {
      $q.notify({
        type: 'negative',
        message: 'Ya existe un supervisor registrado con ese documento.'
      })
      return
    }
  }

  guardando.value = true
  try {
    if (editando.value) {
      await store.editar({ ...supervisor.value })
      $q.notify({ type: 'positive', message: 'Supervisor actualizado correctamente.' })
    } else {
      await store.agregar({ ...supervisor.value })
      $q.notify({ type: 'positive', message: 'Supervisor registrado correctamente.' })
    }
    limpiarFormulario()
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error, 'No se pudo guardar el supervisor.') })
  } finally {
    guardando.value = false
  }
}

function nuevoSupervisor() {
  limpiarFormulario()
  dialogo.value = true
}

function editarSupervisor(fila) {
  supervisor.value = {
    ...fila,
    password: ''
  }
  editando.value = true
  dialogo.value = true
}

function eliminarSupervisor(documento) {
  documentoEliminar.value = documento
  dialogoEliminar.value = true
}

async function confirmarEliminar() {
  guardando.value = true
  try {
    await store.eliminar(documentoEliminar.value)
    $q.notify({ type: 'info', message: 'Supervisor eliminado correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: getErrorMessage(error, 'No se pudo eliminar el supervisor.') })
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
  supervisor.value = {
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