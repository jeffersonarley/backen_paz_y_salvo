<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-primary text-weight-bold">Plantillas de Paz y Salvo</div>
        <div class="text-subtitle2 text-grey-7">
          Selecciona la plantilla de dependencias y firmantes que aplica a cada contrato GCCON-F-088
        </div>
      </div>

      <q-select
        v-model="plantillaPredeterminada"
        :options="opcionesPlantilla"
        option-label="label"
        emit-value
        map-options
        outlined
        dense
        style="min-width: 340px"
        label="Plantilla predeterminada (Coordinador)"
        @update:model-value="guardarPredeterminada"
      >
        <template #prepend>
          <q-icon name="tune" color="primary" />
        </template>
      </q-select>
    </div>

    <q-banner rounded dense class="bg-blue-1 text-primary q-mb-md">
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>
      <div class="text-caption">
        <strong>Plantillas y firmantes:</strong> La plantilla define qué dependencias firman en cada
        contrato y quiénes son los responsables autorizados. Cada contratista verá en su certificado la
        plantilla que usted (como Coordinador/Supervisor) haya seleccionado y configurado.
      </div>
    </q-banner>

    <q-table
      title="Contratos bajo mi coordinación"
      :rows="contratos"
      :columns="columns"
      row-key="_id"
      flat
      bordered
      :loading="cargando"
      no-data-label="No hay contratos asignados"
    >
      <template #body-cell-plantilla="props">
        <q-td :props="props">
          <q-badge color="teal-1" text-color="teal-9" class="q-pa-xs text-weight-bold">
            {{ nombrePlantilla(props.row.plantilla_tipo) }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn
            unelevated
            dense
            color="primary"
            icon="assignment_turned_in"
            label="Configurar Plantilla y Firmantes"
            class="q-px-sm text-caption"
            @click="abrirPlantilla(props.row)"
          >
            <q-tooltip>Configurar dependencias aplicables y responsables autorizados</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo de configuración de plantilla y firmantes -->
    <q-dialog v-model="dialogo" persistent>
      <q-card style="min-width: 950px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-primary text-weight-bold">
              Plantilla y firmantes — {{ contratoSeleccionado?.numero_contrato || contratoSeleccionado?.numeroContrato }}
            </div>
            <div class="text-caption text-grey-7">
              Contratista: {{ contratoSeleccionado?.nombre_contratista || contratoSeleccionado?.contratista }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup @click="cerrarDialogo" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-select
            v-model="tipoSeleccionado"
            :options="opcionesPlantilla"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            label="Plantilla que aplica al contrato"
            @update:model-value="alCambiarTipoPlantilla"
            hint="Al cambiar la plantilla se ajustan las dependencias aplicables; puede modificarlas una a una"
            class="q-mb-md"
          />

          <q-table
            flat
            bordered
            dense
            :rows="filas"
            :columns="columnasFilas"
            row-key="id_fila"
            no-data-label="No hay filas de dependencias"
            :pagination="{ rowsPerPage: 15 }"
          >
            <template #body-cell-aplica="props">
              <q-td :props="props">
                <q-toggle
                  v-model="props.row.aplica"
                  color="positive"
                  :label="props.row.aplica ? 'Aplica' : 'N/A'"
                />
              </q-td>
            </template>

            <template #body-cell-encargado="props">
              <q-td :props="props">
                <div v-if="props.row.encargados && props.row.encargados.length" class="column q-gutter-y-xs">
                  <div
                    v-for="enc in props.row.encargados"
                    :key="enc.id"
                    class="user-tag row items-center no-wrap cursor-pointer"
                  >
                    <div
                      class="user-avatar text-weight-bold"
                      :style="avatarStyle(enc.nombre, enc.rol)"
                    >
                      {{ obtenerIniciales(enc.nombre) }}
                    </div>
                    <span class="user-name text-weight-medium text-grey-9 q-ml-xs">
                      {{ enc.nombre }}
                    </span>
                    <span
                      v-if="enc.rol === 'Supervisor'"
                      class="user-role-badge q-ml-xs"
                    >
                      Coord.
                    </span>
                    <q-tooltip class="bg-dark text-white shadow-3" :offset="[4, 4]">
                      <div class="text-weight-bold">{{ enc.nombre }}</div>
                      <div class="text-caption text-positive">
                        {{ enc.rol === 'Supervisor' ? 'Coordinador (Supervisor)' : 'Responsable de Área' }}
                      </div>
                      <div v-if="enc.correo" class="text-caption text-grey-4">{{ enc.correo }}</div>
                    </q-tooltip>
                  </div>
                </div>
                <div v-else class="text-caption text-grey-5 text-italic row items-center">
                  <q-icon name="person_off" size="14px" class="q-mr-xs text-grey-4" />
                  Sin responsable asignado
                </div>
              </q-td>
            </template>

            <template #body-cell-responsables="props">
              <q-td :props="props">
                <q-select
                  v-model="props.row.responsables"
                  :options="opcionesUsuarios"
                  option-label="etiqueta"
                  option-value="id"
                  multiple
                  use-chips
                  outlined
                  dense
                  emit-value
                  map-options
                  :disable="!props.row.aplica"
                  placeholder="Seleccione los responsables que firman"
                  @update:model-value="actualizarEncargadosDeFila(props.row)"
                >
                  <template #prepend>
                    <q-icon name="people" color="primary" />
                  </template>
                  <template #selected-item="scope">
                    <div class="user-chip-selected row items-center no-wrap q-mr-xs q-my-xs">
                      <div
                        class="user-avatar text-weight-bold"
                        :style="avatarStyle(scope.opt.nombre, scope.opt.rol)"
                      >
                        {{ obtenerIniciales(scope.opt.nombre) }}
                      </div>
                      <span class="text-weight-medium q-ml-xs user-chip-text">{{ scope.opt.nombre }}</span>
                      <q-icon
                        name="cancel"
                        size="16px"
                        class="cursor-pointer q-ml-xs text-grey-6 hover-delete"
                        @click.stop="scope.removeAtIndex(scope.index)"
                      />
                    </div>
                  </template>
                </q-select>
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" @click="cerrarDialogo" :disable="guardando" />
          <q-btn
            unelevated
            color="positive"
            icon="save"
            label="Guardar Plantilla y Firmantes"
            @click="guardarPlantilla"
            :loading="guardando"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore.js'

const $q = useQuasar()
const auth = useAuthStore()

const contratos = ref([])
const cargando = ref(false)
const guardando = ref(false)
const dialogo = ref(false)
const contratoSeleccionado = ref(null)
const tipoSeleccionado = ref('COMPLETA')
const filas = ref([])
const plantillaPredeterminada = ref('COMPLETA')

const definicionesPlantilla = [
  {
    label: 'Plantilla Completa Institucional (14 Dependencias)',
    value: 'COMPLETA',
    filasAplica: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  },
  {
    label: 'Servicios Profesionales / Apoyo a la Gestión (7 Dependencias)',
    value: 'SERVICIOS_PROFESIONALES',
    filasAplica: [1, 2, 3, 4, 6, 7, 14],
  },
  {
    label: 'Instructores y Formación Profesional (7 Dependencias)',
    value: 'INSTRUCTORES',
    filasAplica: [1, 3, 4, 8, 9, 13, 14],
  },
  {
    label: 'Plantilla Personalizada (Configuración a Medida)',
    value: 'PERSONALIZADA',
    filasAplica: null,
  },
]

const opcionesPlantilla = definicionesPlantilla.map((p) => ({ label: p.label, value: p.value }))

const opcionesUsuarios = ref([])

const columns = [
  { name: 'numero_contrato', label: 'Contrato', field: (row) => row.numero_contrato || row.numeroContrato, align: 'left', sortable: true },
  { name: 'nombre_contratista', label: 'Contratista', field: (row) => row.nombre_contratista || row.contratista, align: 'left', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center', sortable: true },
  { name: 'plantilla', label: 'Plantilla Seleccionada', field: (row) => row.plantilla_tipo || row.plantillaTipo || 'COMPLETA', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
]

const columnasFilas = [
  { name: 'aplica', label: 'Firma Requerida', field: 'aplica', align: 'center' },
  { name: 'dependenciaSimple', label: 'Dependencia GCCON-F-088', field: 'dependenciaSimple', align: 'left' },
  { name: 'encargado', label: 'Responsable al frente (Firma autorizada)', field: 'encargado', align: 'left' },
  { name: 'responsables', label: 'Editar persona encargada', field: 'responsables', align: 'left' },
]

function nombrePlantilla(tipo) {
  return definicionesPlantilla.find((p) => p.value === tipo)?.label || 'Plantilla Completa Institucional'
}

async function cargarUsuarios() {
  const opciones = []
  const vistos = new Set()
  for (const rol of ['ResponsableArea', 'Supervisor']) {
    try {
      const resp = await api.get(`/usuarios?rol=${rol}`)
      const lista = Array.isArray(resp.data) ? resp.data : resp.data?.usuarios || []
      lista.forEach((u) => {
        const id = String(u._id || u.id || '')
        if (!id || vistos.has(id)) return
        vistos.add(id)
        const nombre = u.nombre_completo || u.nombre || 'Usuario'
        const etiqueta = `${nombre} — ${rol === 'Supervisor' ? 'Coordinador' : 'Responsable de Área'}`
        opciones.push({
          id,
          value: id,
          label: etiqueta,
          etiqueta,
          nombre,
          correo: u.correo_institucional || u.correo || '',
          rol: u.rol,
        })
      })
    } catch {
      // continuar
    }
  }
  opcionesUsuarios.value = opciones
}

async function cargarContratos() {
  cargando.value = true
  try {
    const resp = await api.get('/contratos')
    const lista = Array.isArray(resp.data) ? resp.data : resp.data?.contratos || []
    if (lista.length > 0) {
      contratos.value = lista
    } else {
      // Intentar cargar solicitudes del store si contratos api está vacío
      const respSol = await api.get('/solicitudes').catch(() => null)
      contratos.value = Array.isArray(respSol?.data) ? respSol.data : []
    }
  } catch (err) {
    console.warn('Error al cargar contratos:', err.message)
  } finally {
    cargando.value = false
  }
}

// Calcula los responsables visibles de cada fila (persona encargada de firmar esa dependencia)
function calcularEncargados(filasList) {
  const opciones = new Map(opcionesUsuarios.value.map((u) => [String(u.id), u]))
  return (filasList || []).map((fila) => {
    const ids = (fila.responsables || []).map((r) => String(r.id || r._id || r)).filter(Boolean)
    const nombres = (fila.nombres || []).filter(Boolean)
    const encargados = ids.map((id, i) => {
      const opcion = opciones.get(id)
      return {
        id,
        nombre: opcion?.nombre || nombres[i] || id,
        correo: opcion?.correo || '',
      }
    })
    return { ...fila, encargados }
  })
}

const filasRespaldo = [
  { id_fila: 1, id: 1, dependenciaSimple: '01. Gestión Tecnológica (TIC)', responsables: [], aplica: true },
  { id_fila: 2, id: 2, dependenciaSimple: '02. Almacén e Inventarios', responsables: [], aplica: true },
  { id_fila: 3, id: 3, dependenciaSimple: '03. Biblioteca y Archivo', responsables: [], aplica: true },
  { id_fila: 4, id: 4, dependenciaSimple: '04. Bienestar al Aprendiz', responsables: [], aplica: true },
  { id_fila: 5, id: 5, dependenciaSimple: '05. Agencia Pública de Empleo (APE)', responsables: [], aplica: true },
  { id_fila: 6, id: 6, dependenciaSimple: '06. Infraestructura y Mantenimiento', responsables: [], aplica: true },
  { id_fila: 7, id: 7, dependenciaSimple: '07. Seguridad y Salud en el Trabajo (SST)', responsables: [], aplica: true },
  { id_fila: 8, id: 8, dependenciaSimple: '08. Sennova e Innovación', responsables: [], aplica: true },
  { id_fila: 9, id: 9, dependenciaSimple: '09. Relaciones Corporativas e Internacionales', responsables: [], aplica: true },
  { id_fila: 10, id: 10, dependenciaSimple: '10. Fondo Emprender', responsables: [], aplica: true },
  { id_fila: 11, id: 11, dependenciaSimple: '11. Administración Educativa', responsables: [], aplica: true },
  { id_fila: 12, id: 12, dependenciaSimple: '12. Producción de Centros', responsables: [], aplica: true },
  { id_fila: 13, id: 13, dependenciaSimple: '13. Calidad y SIGA', responsables: [], aplica: true },
  { id_fila: 14, id: 14, dependenciaSimple: '14. Coordinación Académica / Supervisor', responsables: [], aplica: true },
]

async function abrirPlantilla(contrato) {
  contratoSeleccionado.value = contrato
  dialogo.value = true
  guardando.value = false
  const idContrato = contrato._id || contrato.id

  try {
    let resp = null
    if (idContrato) {
      resp = await api.get(`/contratos/${idContrato}/plantilla`).catch(() => null)
    }
    if (!resp) {
      resp = await api.get('/plantillas/filas').catch(() => null)
    }

    const tipo = resp?.data?.tipo || resp?.data?.plantilla_tipo || contrato.plantilla_tipo || 'COMPLETA'
    tipoSeleccionado.value = tipo

    const rawFilas = resp?.data?.filas && resp.data.filas.length > 0 ? resp.data.filas : filasRespaldo
    filas.value = calcularEncargados(
      rawFilas.map((fila) => ({
        ...fila,
        responsables: (fila.responsables || []).map((r) => String(r.id || r._id || r)),
        aplica: fila.aplica !== false,
      })),
    )
  } catch {
    filas.value = calcularEncargados(filasRespaldo.map((f) => ({ ...f })))
  }
}

function alCambiarTipoPlantilla(nuevoTipo) {
  const def = definicionesPlantilla.find((p) => p.value === nuevoTipo)
  if (def && Array.isArray(def.filasAplica)) {
    filas.value.forEach((fila) => {
      fila.aplica = def.filasAplica.includes(fila.id_fila || fila.id)
    })
  }
}

function actualizarEncargadosDeFila(fila) {
  const opciones = new Map(opcionesUsuarios.value.map((u) => [String(u.id), u]))
  const ids = (fila.responsables || []).map((r) => String(r.id || r._id || r)).filter(Boolean)
  fila.encargados = ids.map((id) => {
    const opcion = opciones.get(id)
    return {
      id,
      nombre: opcion?.nombre || id,
      correo: opcion?.correo || '',
    }
  })
}

async function guardarPlantilla() {
  if (!contratoSeleccionado.value) return
  guardando.value = true
  try {
    const payload = {
      plantilla_tipo: tipoSeleccionado.value,
      filas: filas.value.map((fila) => ({
        id_fila: fila.id_fila || fila.id,
        id: fila.id_fila || fila.id,
        dependencia_id: fila.dependencia_id,
        dependenciaSimple: fila.dependenciaSimple,
        dependencia_nombre: fila.dependencia_nombre || fila.dependenciaSimple,
        responsables: fila.responsables || [],
        encargados: fila.encargados || [],
        aplica: fila.aplica !== false,
        marca: fila.aplica !== false ? 'X' : 'N/A',
      })),
    }

    const idContrato = contratoSeleccionado.value._id || contratoSeleccionado.value.id
    if (idContrato) {
      await api.put(`/contratos/${idContrato}/plantilla`, payload).catch((e) => console.warn(e))
    }

    // Persistencia en localStorage como respaldo para el contratista
    const numContrato = contratoSeleccionado.value.numero_contrato || contratoSeleccionado.value.numeroContrato
    if (numContrato) {
      localStorage.setItem(`plantilla_firmas_${numContrato.toLowerCase().trim()}`, JSON.stringify(payload.filas))
      localStorage.setItem(`plantilla_tipo_${numContrato.toLowerCase().trim()}`, tipoSeleccionado.value)
    }
    if (idContrato) {
      localStorage.setItem(`plantilla_firmas_${idContrato}`, JSON.stringify(payload.filas))
      localStorage.setItem(`plantilla_tipo_${idContrato}`, tipoSeleccionado.value)
    }

    await cargarContratos()
    $q.notify({
      type: 'positive',
      message: 'Plantilla y firmantes guardados exitosamente. El contratista verá esta plantilla en su certificado.',
      icon: 'check_circle',
    })
    dialogo.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.mensaje || 'No se pudo guardar la plantilla.',
    })
  } finally {
    guardando.value = false
  }
}

async function guardarPredeterminada(tipo) {
  try {
    await api.put('/plantillas/predeterminada', { plantilla_tipo: tipo }).catch(() => null)
    if (typeof auth.actualizarUsuario === 'function') {
      auth.actualizarUsuario({ plantilla_predeterminada: tipo })
    }
    $q.notify({
      type: 'positive',
      message: 'Plantilla predeterminada del coordinador actualizada.',
    })
  } catch (err) {
    console.warn('Error al guardar plantilla predeterminada:', err)
  }
}

function cerrarDialogo() {
  dialogo.value = false
}

onMounted(() => {
  plantillaPredeterminada.value = auth.usuario?.plantilla_predeterminada || 'COMPLETA'
  cargarUsuarios()
  cargarContratos()
})

function obtenerIniciales(nombre) {
  if (!nombre) return 'U'
  const partes = String(nombre).trim().split(/\s+/)
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function avatarStyle(nombre, rol) {
  if (rol === 'Supervisor') {
    return {
      backgroundColor: '#e0e7ff',
      color: '#3730a3',
      border: '1px solid #c7d2fe',
    }
  }

  const palettes = [
    { bg: '#e8f5e9', text: '#1b5e20', border: '#c8e6c9' }, // Verde SENA suave
    { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }, // Celeste cielo
    { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }, // Ámbar dorado
    { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' }, // Púrpura elegante
    { bg: '#ffe4e6', text: '#9f1239', border: '#fecdd3' }, // Rosa suave
    { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }, // Gris pizarra
  ]

  let hash = 0
  const str = String(nombre || 'X')
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const color = palettes[Math.abs(hash) % palettes.length]

  return {
    backgroundColor: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`,
  }
}
</script>

<style scoped>
.user-tag {
  display: inline-flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 3px 10px 3px 4px;
  max-width: fit-content;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.user-tag:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.user-avatar {
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  letter-spacing: -0.3px;
  flex-shrink: 0;
}

.user-name {
  font-size: 12.5px;
  line-height: 1.2;
  color: #1e293b;
  white-space: nowrap;
}

.user-role-badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 6px;
  background: #e0e7ff;
  color: #3730a3;
  line-height: 1.2;
  border: 1px solid #c7d2fe;
}

.user-chip-selected {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 2px 6px 2px 3px;
}

.user-chip-text {
  font-size: 12px;
  color: #1e293b;
}

.hover-delete:hover {
  color: #dc2626 !important;
}
</style>
