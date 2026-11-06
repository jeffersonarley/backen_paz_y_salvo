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

      <template #body-cell-responsables="props">
        <q-td :props="props">
          <div v-if="(props.row.responsables || []).length" class="column q-gutter-xs">
            <q-chip
              v-for="resp in props.row.responsables"
              :key="resp.id || resp._id"
              dense
              size="sm"
              color="teal-1"
              text-color="teal-9"
              icon="badge"
              class="q-ma-none"
            >
              {{ resp.nombre }}
              <q-tooltip>
                {{ resp.rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área' }}
                <br />
                {{ resp.correo }}
              </q-tooltip>
            </q-chip>
          </div>
          <span v-else class="text-caption text-grey-6">Sin responsables asignados</span>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn flat round dense color="primary" icon="edit" @click="editarDependencia(props.row)">
            <q-tooltip>Editar Dependencia y Responsables</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            :color="props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva' ? 'positive' : 'negative'"
            :icon="props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva' ? 'check_circle' : 'domain_disabled'"
            @click="eliminarDependencia(props.row)"
          >
            <q-tooltip>{{
              props.row.estado === 'Inactivo' || props.row.estado === 'Inactiva'
                ? `Activar dependencia: ${props.row.nombre || props.row.nombre_dependencia}`
                : `Desactivar dependencia: ${props.row.nombre || props.row.nombre_dependencia}`
            }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo Formulario Creación / Edición -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 540px; max-width: 90vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-primary text-weight-bold">
            {{ editando ? 'Editar Dependencia' : 'Nueva Dependencia' }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cancelar" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="guardarDependencia">
          <q-card-section class="q-gutter-y-sm">
            <q-banner dense rounded class="bg-green-1 text-positive q-mb-sm">
              <template #avatar>
                <q-icon name="verified_user" color="positive" />
              </template>
              <div class="text-caption">
                <strong>Destinatarios oficiales:</strong> Toda solicitud o paz y salvo vinculado a esta
                dependencia va dirigido a los responsables asignados para su revisión y firma oficial.
              </div>
            </q-banner>

            <q-input
              v-model="dependencia.codigo"
              label="Código de la Dependencia *"
              outlined
              dense
              :disable="editando"
              :rules="[(val) => !!val || 'El código es obligatorio']"
            >
              <template #prepend>
                <q-icon name="tag" color="grey-7" />
              </template>
            </q-input>

            <!-- Nombre de la Dependencia con sugerencias estándar -->
            <q-select
              v-model="dependencia.nombre"
              label="Nombre de la Dependencia *"
              outlined
              dense
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              new-value-mode="add-unique"
              :options="filtroNombresDependencias"
              option-label="nombre"
              option-value="nombre"
              emit-value
              map-options
              @filter="filtrarNombresDependencias"
              @update:model-value="onSeleccionarNombreDependencia"
              :rules="[(val) => !!val || 'El nombre es obligatorio']"
              hint="Elija un área estándar (ej. Coordinación Académica, TIC, Almacén) o escriba un nombre personalizado"
            >
              <template #prepend>
                <q-icon name="business" color="primary" />
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar
                      :icon="scope.opt.icono || 'business'"
                      color="primary"
                      text-color="white"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.descripcion }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Responsables: pueden ser varios por dependencia -->
            <q-select
              v-model="responsablesSeleccionados"
              label="Responsables de la Dependencia *"
              outlined
              dense
              multiple
              use-chips
              :options="opcionesResponsables"
              option-label="etiqueta"
              @update:model-value="onSeleccionarResponsables"
              :rules="[
                (val) => (val && val.length > 0) || 'Debe asignar al menos un responsable',
              ]"
              hint="Cada dependencia puede tener varios responsables (Coordinador o Responsable de Área); cualquiera de ellos puede firmar"
            >
              <template #prepend>
                <q-icon name="badge" color="primary" />
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon
                      :name="scope.opt.rol === 'Supervisor' ? 'supervisor_account' : 'person'"
                      :color="scope.opt.rol === 'Supervisor' ? 'indigo' : 'primary'"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>
                      {{ scope.opt.rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área' }} — {{ scope.opt.correo }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-model="dependencia.estado"
              :options="['Activa', 'Inactiva']"
              label="Estado de la Dependencia"
              outlined
              dense
            >
              <template #prepend>
                <q-icon
                  name="circle"
                  :color="dependencia.estado === 'Activa' ? 'positive' : 'grey-7'"
                />
              </template>
            </q-select>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" color="grey-8" @click="cancelar" />
            <q-btn
              unelevated
              type="submit"
              color="positive"
              :label="editando ? 'Actualizar Dependencia' : 'Guardar Dependencia'"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo Confirmar Cambio de Estado (Activar / Desactivar) -->
    <q-dialog v-model="dialogoEliminar">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="esInactivaSeleccionada ? 'check_circle' : 'domain_disabled'"
            :color="esInactivaSeleccionada ? 'positive' : 'negative'"
            text-color="white"
            class="q-mr-sm"
          />
          <span class="text-h6">
            {{ esInactivaSeleccionada ? 'Activar Dependencia' : 'Desactivar Dependencia' }}
          </span>
        </q-card-section>

        <q-card-section class="q-pt-none text-body1">
          ¿Está seguro de {{ esInactivaSeleccionada ? 'activar' : 'desactivar' }} la dependencia
          <strong>{{ nombreEliminar }}</strong
          >?
          <div class="text-caption text-grey-7 q-mt-xs">
            {{
              esInactivaSeleccionada
                ? 'Al activarla, aparecerá disponible para firmas y revisión en el formato GCCON-F-088.'
                : 'Al desactivarla, no se exigirán firmas para esta área en los nuevos trámites.'
            }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            :color="esInactivaSeleccionada ? 'positive' : 'negative'"
            :label="esInactivaSeleccionada ? 'Activar Dependencia' : 'Desactivar Dependencia'"
            @click="confirmarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useDependenciasStore } from '../stores/useDependenciasStore.js'
import api from '../services/api'

const store = useDependenciasStore()
const $q = useQuasar()

const filtro = ref('')
const dialogo = ref(false)
const dialogoEliminar = ref(false)
const editando = ref(false)
const indiceEditar = ref(null)
const codigoEliminar = ref('')
const responsablesSeleccionados = ref([])

// Catálogo de dependencias sugeridas institucionales SENA
const nombresDependenciasSugeridas = [
  {
    nombre: 'Coordinación Académica',
    descripcion: 'Coordinación y supervisión de contratos formativos y académicos',
    icono: 'school',
  },
  {
    nombre: 'Gestión Tecnológica (TIC)',
    descripcion: 'Equipos de cómputo, conectividad y sistemas de información',
    icono: 'devices',
  },
  {
    nombre: 'Almacén e Inventarios',
    descripcion: 'Recepción y control de bienes devolutivos y de consumo',
    icono: 'inventory_2',
  },
  {
    nombre: 'Biblioteca y Archivo',
    descripcion: 'Préstamo de material bibliográfico, libros y documentos',
    icono: 'menu_book',
  },
  {
    nombre: 'Bienestar al Aprendiz y Comunidad',
    descripcion: 'Servicios de apoyo, elementos deportivos y de bienestar',
    icono: 'favorite',
  },
  {
    nombre: 'Recursos Humanos / Talento Humano',
    descripcion: 'Paz y salvo contractual y vinculación de personal',
    icono: 'people',
  },
  {
    nombre: 'Infraestructura y Servicios Generales',
    descripcion: 'Herramientas, llaves y mantenimiento de instalaciones',
    icono: 'handyman',
  },
  {
    nombre: 'Agencia Pública de Empleo (APE)',
    descripcion: 'Gestión y colocación de empleo institucional',
    icono: 'work',
  },
  {
    nombre: 'Sennova',
    descripcion: 'Investigación, desarrollo tecnológico e innovación',
    icono: 'science',
  },
  {
    nombre: 'Administración Educativa',
    descripcion: 'Certificaciones, matrículas y archivo académico',
    icono: 'folder_shared',
  },
]

const filtroNombresDependencias = ref([...nombresDependenciasSugeridas])

function filtrarNombresDependencias(val, update) {
  if (val === '') {
    update(() => {
      filtroNombresDependencias.value = nombresDependenciasSugeridas
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filtroNombresDependencias.value = nombresDependenciasSugeridas.filter(
      (v) =>
        v.nombre.toLowerCase().includes(needle) || v.descripcion.toLowerCase().includes(needle),
    )
  })
}

function onSeleccionarNombreDependencia(val) {
  if (!val) return
  const nombreTexto = typeof val === 'object' ? val.nombre : val
  dependencia.value.nombre = nombreTexto
}

const opcionesResponsables = ref([])

async function cargarResponsables() {
  const opciones = []
  const vistos = new Set()

  const roles = ['ResponsableArea', 'Supervisor']
  for (const rol of roles) {
    try {
      const resp = await api.get(`/usuarios?rol=${rol}`)
      const lista = Array.isArray(resp.data) ? resp.data : resp.data?.usuarios || []
      lista.forEach((u) => {
        const id = String(u._id || u.id || '')
        if (!id || vistos.has(id)) return
        vistos.add(id)
        const nombre = u.nombre_completo || u.nombre || 'Usuario'
        const correo = u.correo_institucional || u.correo || ''
        opciones.push({
          id,
          _id: id,
          nombre,
          correo,
          rol: u.rol,
          etiqueta: `${nombre} — ${u.rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área'} (${correo || 'sin correo'})`,
        })
      })
    } catch {
      // continuar con el siguiente rol
    }
  }

  opcionesResponsables.value = opciones
}

onMounted(() => {
  cargarResponsables()
})

function onSeleccionarResponsables(val) {
  const seleccionados = Array.isArray(val) ? val : val ? [val] : []
  responsablesSeleccionados.value = seleccionados

  dependencia.value.responsables = seleccionados
  dependencia.value.responsable = seleccionados[0]?.nombre || ''
  dependencia.value.correo = seleccionados[0]?.correo || ''
  dependencia.value.responsable_id = seleccionados[0]?.id || seleccionados[0]?._id || null
}

const dependenciaSeleccionadaEliminar = ref(null)

const esInactivaSeleccionada = computed(() => {
  const d =
    dependenciaSeleccionadaEliminar.value ||
    store.dependencias.find(
      (item) =>
        item._idReal === codigoEliminar.value ||
        item._id === codigoEliminar.value ||
        item.codigo === codigoEliminar.value,
    )
  return d ? d.estado === 'Inactiva' || d.estado === 'Inactivo' : false
})

const nombreEliminar = computed(() => {
  if (dependenciaSeleccionadaEliminar.value) {
    const nom =
      dependenciaSeleccionadaEliminar.value.nombre ||
      dependenciaSeleccionadaEliminar.value.nombre_dependencia
    if (nom) return nom
  }
  const cod = codigoEliminar.value
  const d = store.dependencias.find(
    (item) =>
      item._idReal === cod ||
      item._id === cod ||
      item.id === cod ||
      item.codigo === cod,
  )
  return d?.nombre || d?.nombre_dependencia || 'la dependencia'
})

const dependencia = ref({
  codigo: '',
  nombre: '',
  responsable: '',
  responsable_id: null,
  responsables: [],
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
    name: 'responsables',
    label: 'Responsables',
    field: 'responsables',
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

async function guardarDependencia() {
  const existeCodigo = store.dependencias.some((item, index) => {
    return (
      item.codigo === dependencia.value.codigo &&
      item._idReal !== indiceEditar.value &&
      item._id !== indiceEditar.value &&
      index !== indiceEditar.value
    )
  })

  if (existeCodigo) {
    $q.notify({
      type: 'negative',
      message: 'Ya existe una dependencia con ese código.',
    })
    return
  }

  if (!responsablesSeleccionados.value.length) {
    $q.notify({
      type: 'negative',
      message: 'Debe asignar al menos un responsable a la dependencia.',
    })
    return
  }

  const resultado = editando.value
    ? await store.editar(indiceEditar.value, { ...dependencia.value })
    : await store.agregar({ ...dependencia.value })

  if (resultado && resultado.ok === false) {
    $q.notify({
      type: 'negative',
      message: resultado.mensaje || 'No se pudo guardar la dependencia.',
    })
    return
  }

  $q.notify({
    type: 'positive',
    message: editando.value
      ? 'Dependencia y responsables actualizados correctamente.'
      : 'Dependencia registrada con sus responsables exitosamente.',
  })

  limpiarFormulario()
}

function nuevaDependencia() {
  limpiarFormulario()
  const siguienteNum = (store.dependencias.length + 1).toString().padStart(2, '0')
  dependencia.value.codigo = `DEP-${siguienteNum}`

  if (nombresDependenciasSugeridas.length > 0) {
    const primeraSugerencia = nombresDependenciasSugeridas[0]
    dependencia.value.nombre = primeraSugerencia.nombre
    onSeleccionarNombreDependencia(primeraSugerencia.nombre)
  }
  dialogo.value = true
}

function editarDependencia(fila) {
  dependencia.value = { ...fila }
  const actuales = fila.responsables || []
  responsablesSeleccionados.value = actuales.length
    ? actuales
        .map((r) =>
          opcionesResponsables.value.find(
            (op) => String(op.id) === String(r.id || r._id) || op.nombre === r.nombre,
          ) || r,
        )
        .filter(Boolean)
    : []
  dependencia.value.responsables = responsablesSeleccionados.value
  indiceEditar.value =
    fila._idReal || fila._id || fila.id || store.dependencias.findIndex((item) => item.codigo === fila.codigo)
  editando.value = true
  dialogo.value = true
}

function eliminarDependencia(item) {
  if (typeof item === 'object' && item !== null) {
    dependenciaSeleccionadaEliminar.value = { ...item }
    codigoEliminar.value = item._idReal || item._id || item.id || item.codigo || ''
  } else {
    codigoEliminar.value = item
    const encontrada =
      store.dependencias.find(
        (d) => d._idReal === item || d._id === item || d.id === item || d.codigo === item,
      ) || null
    dependenciaSeleccionadaEliminar.value = encontrada ? { ...encontrada } : null
  }
  dialogoEliminar.value = true
}

async function confirmarEliminar() {
  const eraInactiva = esInactivaSeleccionada.value
  const nombreDep = nombreEliminar.value
  const resultado = await store.eliminar(codigoEliminar.value)
  codigoEliminar.value = ''
  dependenciaSeleccionadaEliminar.value = null
  dialogoEliminar.value = false

  if (resultado && resultado.ok === false) {
    $q.notify({
      type: 'negative',
      message: resultado.mensaje || 'No se pudo actualizar el estado de la dependencia.',
    })
    return
  }

  $q.notify({
    type: 'info',
    message: eraInactiva
      ? `Dependencia "${nombreDep}" activada correctamente.`
      : `Dependencia "${nombreDep}" desactivada correctamente.`,
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
    responsable_id: null,
    responsables: [],
    correo: '',
    estado: 'Activa',
  }
  responsablesSeleccionados.value = []
  dialogo.value = false
  editando.value = false
  indiceEditar.value = null
}
</script>
