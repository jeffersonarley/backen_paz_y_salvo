<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">Gestión de Dependencias</div>

    <q-card flat bordered>
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <q-input
            v-model="busqueda"
            outlined
            dense
            debounce="300"
            label="Buscar..."
            clearable
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-8 text-right">
          <q-btn
            v-if="esSupervisor"
            color="primary"
            icon="add"
            label="Nueva Dependencia"
            unelevated
            no-caps
            @click="abrirNuevo"
          />
        </div>
      </q-card-section>

      <q-table
        :rows="registrosFiltrados"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-per-page-options="[5, 10, 15, 20]"
        flat
        bordered
        no-data-label="No hay dependencias disponibles"
        loading-label="Cargando dependencias..."
      >
        <template #body-cell-_id="props">
          <q-td :props="props">
            <span class="text-mono text-grey-8">{{ props.row._id }}</span>
          </q-td>
        </template>

        <template #body-cell-activo="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.activo ? 'positive' : 'negative'"
              :label="props.row.activo ? 'Activa' : 'Inactiva'"
            />
          </q-td>
        </template>

        <template #body-cell-responsable="props">
          <q-td :props="props">
            <span v-if="props.row.responsable_id">
              {{ props.row.responsable_id.nombre_completo || props.row.responsable_id }}
            </span>
            <span v-else class="text-grey-6">Sin responsable</span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td v-if="esSupervisor" :props="props" class="text-right">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="edit"
              @click="abrirEditar(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              color="teal"
              icon="person_add"
              @click="abrirAsignarResponsable(props.row)"
            >
              <q-tooltip>Asignar responsable</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ editando ? 'Editar Dependencia' : 'Nueva Dependencia' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form ref="formRef" class="q-gutter-md" @submit.prevent="guardar">
            <q-input
              v-model="form.nombre_dependencia"
              label="Nombre de la dependencia"
              outlined
              dense
              lazy-rules
              :rules="[(val) => (val && val.trim().length > 0) || 'El nombre es obligatorio']"
            />

            <q-toggle
              v-if="editando"
              v-model="form.activo"
              label="Activa"
              color="positive"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" no-caps v-close-popup />
          <q-btn
            color="primary"
            :label="editando ? 'Actualizar' : 'Guardar'"
            unelevated
            no-caps
            :loading="guardando"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogResponsable" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Asignar responsable</div>
          <div class="text-subtitle2 text-grey-7">
            {{ dependenciaSeleccionada?.nombre_dependencia }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="responsableId"
            label="Responsable de área"
            outlined
            dense
            emit-value
            map-options
            :options="responsablesOptions"
            :loading="cargandoResponsables"
            :rules="[(val) => !!val || 'Seleccione un responsable']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" no-caps v-close-popup />
          <q-btn
            color="teal"
            label="Asignar"
            unelevated
            no-caps
            :loading="guardando"
            @click="guardarResponsable"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import {
  listarDependencias,
  crearDependencia,
  actualizarDependencia,
  asignarResponsable
} from '@/services/dependenciaService'
import { listarUsuarios } from '@/services/usuarioService'
import { getRol } from '@/services/authService'
import { getErrorMessage } from '@/services/axios'
import { ROL } from '@/constants/roles'

const $q = useQuasar()

const esSupervisor = getRol() === ROL.SUPERVISOR

const columns = [
  { name: '_id', label: 'ID', field: '_id', align: 'left' },
  { name: 'nombre_dependencia', label: 'Dependencia', field: 'nombre_dependencia', align: 'left', sortable: true },
  { name: 'responsable', label: 'Responsable', field: 'responsable_id', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'right' }
]

const rows = ref([])
const loading = ref(false)
const busqueda = ref('')
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'nombre_dependencia',
  descending: false
})

const dialog = ref(false)
const editando = ref(false)
const guardando = ref(false)
const formRef = ref(null)
const form = ref({ _id: null, nombre_dependencia: '', activo: true })

const dialogResponsable = ref(false)
const cargandoResponsables = ref(false)
const responsableId = ref(null)
const dependenciaSeleccionada = ref(null)
const responsablesOptions = ref([])

const registrosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  if (!texto) return rows.value
  return rows.value.filter((row) =>
    String(row.nombre_dependencia ?? '').toLowerCase().includes(texto)
  )
})

watch(busqueda, () => {
  pagination.value.page = 1
})

async function cargarDatos() {
  loading.value = true
  try {
    const { data } = await listarDependencias()
    rows.value = Array.isArray(data) ? data : data?.data ?? []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudieron cargar las dependencias.')
    })
  } finally {
    loading.value = false
  }
}

function abrirNuevo() {
  form.value = { _id: null, nombre_dependencia: '', activo: true }
  editando.value = false
  dialog.value = true
}

function abrirEditar(row) {
  form.value = {
    _id: row._id,
    nombre_dependencia: row.nombre_dependencia ?? '',
    activo: row.activo ?? true
  }
  editando.value = true
  dialog.value = true
}

async function guardar() {
  const valido = await formRef.value.validate()
  if (!valido) return

  guardando.value = true
  try {
    if (editando.value) {
      await actualizarDependencia(form.value._id, {
        nombre_dependencia: form.value.nombre_dependencia,
        activo: form.value.activo
      })
      $q.notify({ type: 'positive', message: 'Dependencia actualizada correctamente.' })
    } else {
      const { data } = await crearDependencia({ nombre_dependencia: form.value.nombre_dependencia })
      const idNuevo = data?.dependencia?._id || data?._id || ''
      $q.notify({
        type: 'positive',
        message: idNuevo
          ? `Dependencia creada correctamente. ID: ${idNuevo}`
          : 'Dependencia creada correctamente.'
      })
    }
    dialog.value = false
    await cargarDatos()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo guardar la dependencia.')
    })
  } finally {
    guardando.value = false
  }
}

async function abrirAsignarResponsable(row) {
  dependenciaSeleccionada.value = row
  responsableId.value = null
  dialogResponsable.value = true

  cargandoResponsables.value = true
  try {
    const { data } = await listarUsuarios()
    responsablesOptions.value = (Array.isArray(data) ? data : [])
      .filter((u) => u.rol === ROL.RESPONSABLE_AREA)
      .map((u) => ({ label: u.nombre_completo, value: u._id }))
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudieron cargar los responsables.')
    })
  } finally {
    cargandoResponsables.value = false
  }
}

async function guardarResponsable() {
  if (!responsableId.value) {
    $q.notify({ type: 'warning', message: 'Seleccione un responsable.' })
    return
  }

  guardando.value = true
  try {
    await asignarResponsable(dependenciaSeleccionada.value._id, responsableId.value)
    $q.notify({ type: 'positive', message: 'Responsable asignado correctamente.' })
    dialogResponsable.value = false
    await cargarDatos()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo asignar el responsable.')
    })
  } finally {
    guardando.value = false
  }
}

onMounted(cargarDatos)
</script>
