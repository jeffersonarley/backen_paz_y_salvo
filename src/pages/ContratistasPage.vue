<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 text-weight-bold text-grey-9">Contratistas</div>
      <q-btn v-if="puedeCrear" no-caps unelevated color="primary" icon="add" label="Nuevo contratista" @click="abrirNuevo" />
    </div>

    <q-card flat bordered class="bg-white q-pa-md">
      <div class="row q-mb-md">
        <q-input v-model="filtro" outlined dense clearable style="width:340px" placeholder="Buscar contratista...">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <q-table :rows="rows" :columns="columns" :filter="filtro" row-key="id" flat bordered :loading="cargando" no-data-label="Sin contratistas." hide-bottom>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge class="q-px-sm" :color="props.row.activo ? 'green-1' : 'red-1'" :text-color="props.row.activo ? 'green-9' : 'red-8'">
              {{ props.row.activo ? 'Activo' : 'Inactivo' }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props">
            <q-btn flat round color="grey-7" icon="edit" size="sm" @click="abrirEditar(props.row)" />
            <q-btn flat round :color="props.row.activo ? 'grey-7' : 'positive'" :icon="props.row.activo ? 'lock' : 'lock_open'" size="sm" @click="alternarEstado(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="min-width:500px">
        <q-card-section>
          <div class="text-h6 text-grey-9">{{ editando ? 'Editar contratista' : 'Nuevo contratista' }}</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="form.nombre_completo" label="Nombre completo" outlined dense class="q-mb-md" :disable="procesando" />
          <q-input v-model="form.correo_institucional" label="Correo institucional" outlined dense type="email" class="q-mb-md" :disable="procesando || editando" />
          <q-input v-if="!editando" v-model="form.password" label="Contraseña" outlined dense type="password" :disable="procesando" />
          <q-input v-model="form.telefono" label="Teléfono" outlined dense :disable="procesando" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup @click="dialogo = false" />
          <q-btn no-caps unelevated color="primary" label="Guardar" :loading="procesando" @click="guardar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const $q = useQuasar()
const auth = useAuthStore()
const puedeCrear = computed(() => auth.rol === 'Supervisor')

const rows = ref([])
const filtro = ref('')
const cargando = ref(false)
const procesando = ref(false)
const dialogo = ref(false)
const editando = ref(false)
const idEditar = ref(null)
const form = ref(defaultForm())

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

function defaultForm() {
  return { nombre_completo: '', correo_institucional: '', password: '', telefono: '', cargo: '' }
}

onMounted(cargar)

async function cargar() {
  cargando.value = true
  try {
    const { data } = await api.get('/api/usuarios')
    rows.value = data.filter((u) => u.rol === 'Contratista').map(mapa)
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudieron cargar los contratistas.' })
  } finally {
    cargando.value = false
  }
}

function mapa(u) {
  return {
    id: u._id,
    nombre: u.nombre_completo,
    correo: u.correo_institucional,
    telefono: u.telefono || '',
    activo: u.activo !== false
  }
}

function abrirNuevo() {
  editando.value = false
  idEditar.value = null
  form.value = defaultForm()
  dialogo.value = true
}

function abrirEditar(fila) {
  editando.value = true
  idEditar.value = fila.id
  form.value = { ...defaultForm(), nombre_completo: fila.nombre, correo_institucional: fila.correo, telefono: fila.telefono }
  dialogo.value = true
}

async function guardar() {
  if (!form.value.nombre_completo || !form.value.correo_institucional) {
    $q.notify({ type: 'warning', message: 'Nombre y correo son obligatorios.' })
    return
  }
  procesando.value = true
  try {
    if (editando.value) {
      await api.patch(`/api/usuarios/${idEditar.value}`, {
        nombre_completo: form.value.nombre_completo,
        telefono: form.value.telefono,
        cargo: form.value.cargo
      })
    } else {
      if (!form.value.password) {
        $q.notify({ type: 'warning', message: 'La contraseña es obligatoria.' })
        return
      }
      await api.post('/api/usuarios', {
        nombre_completo: form.value.nombre_completo,
        correo_institucional: form.value.correo_institucional,
        password: form.value.password,
        rol: 'Contratista',
        telefono: form.value.telefono,
        cargo: form.value.cargo
      })
    }
    $q.notify({ type: 'positive', message: 'Guardado correctamente.' })
    dialogo.value = false
    await cargar()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudo guardar.' })
  } finally {
    procesando.value = false
  }
}

async function alternarEstado(fila) {
  try {
    const { data } = await api.patch(`/api/usuarios/estado/${fila.id}`, { activo: !fila.activo })
    $q.notify({ type: 'positive', message: data.mensaje })
    await cargar()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.mensaje || 'No se pudo cambiar el estado.' })
  }
}
</script>
