<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">Gestión de Usuarios</div>

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

        <div class="col-12 col-sm-4">
          <q-select
            v-model="filtroRol"
            outlined
            dense
            label="Filtrar por rol"
            :options="rolesFiltro"
            emit-value
            map-options
            clearable
          />
        </div>

        <div class="col-12 col-sm-4 text-right">
          <q-btn
            color="primary"
            icon="add"
            label="Nuevo Usuario"
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
        no-data-label="No hay usuarios disponibles"
        loading-label="Cargando usuarios..."
      >
        <template #body-cell-rol="props">
          <q-td :props="props">
            <q-badge color="primary" outline :label="rolLabel(props.row.rol)" />
          </q-td>
        </template>

        <template #body-cell-activo="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.activo ? 'positive' : 'negative'"
              :label="props.row.activo ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right">
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
              v-if="esAdmin"
              flat
              round
              dense
              :color="props.row.activo ? 'negative' : 'positive'"
              :icon="props.row.activo ? 'block' : 'check_circle'"
              @click="confirmarCambiarEstado(props.row)"
            >
              <q-tooltip>{{ props.row.activo ? 'Deshabilitar' : 'Habilitar' }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">
            {{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form ref="formRef" class="q-gutter-md" @submit.prevent="guardar">
            <q-input
              v-model="form.nombre_completo"
              label="Nombre completo"
              outlined
              dense
              lazy-rules
              :rules="[(val) => (val && val.trim().length > 0) || 'El nombre es obligatorio']"
            />

            <q-input
              v-if="!editando"
              v-model="form.correo_institucional"
              type="email"
              label="Correo institucional"
              outlined
              dense
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || 'El correo es obligatorio',
                (val) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val) || 'Correo inválido'
              ]"
            />

            <q-input
              v-if="!editando"
              v-model="form.password"
              type="password"
              label="Contraseña"
              outlined
              dense
              lazy-rules
              :rules="[(val) => (val && val.length > 0) || 'La contraseña es obligatoria']"
            />

            <q-select
              v-if="!editando"
              v-model="form.rol"
              label="Rol"
              outlined
              dense
              emit-value
              map-options
              :options="rolesCreables"
              :rules="[(val) => !!val || 'Seleccione un rol']"
            />

            <q-input
              v-model="form.telefono"
              label="Teléfono"
              outlined
              dense
            />

            <q-input
              v-model="form.cargo"
              label="Cargo"
              outlined
              dense
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
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario
} from '@/services/usuarioService'
import { getRol } from '@/services/authService'
import { getErrorMessage } from '@/services/axios'
import { ROL, ROLES_CREABLES_POR_ROL, ROL_LABELS } from '@/constants/roles'

const $q = useQuasar()

const columns = [
  { name: 'nombre_completo', label: 'Nombre', field: 'nombre_completo', align: 'left', sortable: true },
  { name: 'correo_institucional', label: 'Correo', field: 'correo_institucional', align: 'left', sortable: true },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'center', sortable: true },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'right' }
]

const rol = getRol()
const esAdmin = rol === ROL.ADMINISTRADOR

const rolesCreables = computed(() =>
  (ROLES_CREABLES_POR_ROL[rol] || []).map((r) => ({ label: ROL_LABELS[r], value: r }))
)

const rolesFiltro = Object.values(ROL).map((r) => ({ label: ROL_LABELS[r], value: r }))

const rows = ref([])
const loading = ref(false)
const busqueda = ref('')
const filtroRol = ref(null)
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'nombre_completo',
  descending: false
})

const dialog = ref(false)
const editando = ref(false)
const guardando = ref(false)
const formRef = ref(null)

const form = ref({
  _id: null,
  nombre_completo: '',
  correo_institucional: '',
  password: '',
  rol: '',
  telefono: '',
  cargo: ''
})

const registrosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  return rows.value.filter((row) => {
    const coincideTexto =
      !texto ||
      String(row.nombre_completo ?? '').toLowerCase().includes(texto) ||
      String(row.correo_institucional ?? '').toLowerCase().includes(texto)

    const coincideRol = !filtroRol.value || row.rol === filtroRol.value

    return coincideTexto && coincideRol
  })
})

watch([busqueda, filtroRol], () => {
  pagination.value.page = 1
})

function rolLabel(value) {
  return ROL_LABELS[value] || value
}

async function cargarDatos() {
  loading.value = true
  try {
    const { data } = await listarUsuarios()
    rows.value = Array.isArray(data) ? data : data?.data ?? []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudieron cargar los usuarios.')
    })
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    _id: null,
    nombre_completo: '',
    correo_institucional: '',
    password: '',
    rol: '',
    telefono: '',
    cargo: ''
  }
}

function abrirNuevo() {
  resetForm()
  editando.value = false
  dialog.value = true
}

function abrirEditar(row) {
  form.value = {
    _id: row._id,
    nombre_completo: row.nombre_completo ?? '',
    correo_institucional: row.correo_institucional ?? '',
    password: '',
    rol: row.rol ?? '',
    telefono: row.telefono ?? '',
    cargo: row.cargo ?? ''
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
      await actualizarUsuario(form.value._id, {
        nombre_completo: form.value.nombre_completo,
        telefono: form.value.telefono,
        cargo: form.value.cargo
      })
      $q.notify({ type: 'positive', message: 'Usuario actualizado correctamente.' })
    } else {
      await crearUsuario({
        nombre_completo: form.value.nombre_completo,
        correo_institucional: form.value.correo_institucional,
        password: form.value.password,
        rol: form.value.rol,
        telefono: form.value.telefono,
        cargo: form.value.cargo
      })
      $q.notify({ type: 'positive', message: 'Usuario creado correctamente.' })
    }
    dialog.value = false
    await cargarDatos()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo guardar el usuario.')
    })
  } finally {
    guardando.value = false
  }
}

function confirmarCambiarEstado(row) {
  const accion = row.activo ? 'deshabilitar' : 'habilitar'
  $q.dialog({
    title: 'Cambiar estado',
    message: `¿Está seguro que desea ${accion} a "${row.nombre_completo}"?`,
    cancel: true,
    persistent: true,
    ok: { color: 'negative', label: 'Confirmar', noCaps: true }
  }).onOk(async () => {
    try {
      await cambiarEstadoUsuario(row._id, !row.activo)
      $q.notify({ type: 'positive', message: `Usuario ${row.activo ? 'deshabilitado' : 'habilitado'} correctamente.` })
      await cargarDatos()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: getErrorMessage(error, 'No se pudo cambiar el estado del usuario.')
      })
    }
  })
}

onMounted(cargarDatos)
</script>
