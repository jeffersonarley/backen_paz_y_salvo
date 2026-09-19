<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="row items-center q-mb-md">
          <q-btn
            icon="arrow_back"
            flat
            round
            dense
            color="grey-8"
            :to="{ name: 'contratos' }"
            class="q-mr-sm"
          />
          <div>
            <div class="text-h5 text-weight-bold q-my-none text-positive">
              {{ editando ? 'Editar Solicitud de Paz y Salvo' : 'Nueva Solicitud de Paz y Salvo' }}
            </div>
            <div class="text-caption text-grey-7">
              Diligencie la información requerida para el formato GCCON-F-088
            </div>
          </div>
        </div>

        <q-card flat bordered class="q-pa-lg rounded-borders bg-white">
          <q-form ref="formRef" class="q-gutter-y-md" @submit.prevent="guardar">
              <!-- 1. Información del Contrato -->
              <div class="text-subtitle1 text-weight-bold text-grey-8 border-bottom q-pb-xs">
                1. Información del Contrato
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.numero"
                    label="Número de Contrato *"
                    outlined
                    dense
                    placeholder="Ej. C-2026-014"
                    lazy-rules
                    :rules="[(val) => (val && val.trim().length > 0) || 'El número es obligatorio']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.telefono"
                    label="Teléfono de contacto *"
                    outlined
                    dense
                    lazy-rules
                    :rules="[(val) => (val && val.trim().length > 0) || 'El teléfono es obligatorio']"
                  />
                </div>
              </div>

              <q-select
                v-if="estadoDependencias === 'ok'"
                v-model="form.dependencia"
                label="Dependencia / Centro *"
                outlined
                dense
                emit-value
                map-options
                :options="dependencias"
                :loading="estadoDependencias === 'cargando'"
                :rules="[(val) => !!val || 'Seleccione la dependencia']"
              />

              <q-banner
                v-else-if="estadoDependencias === 'vacio'"
                rounded
                color="warning"
              >
                <template #avatar>
                  <q-icon name="warning" color="white" />
                </template>
                No hay dependencias disponibles. Contacte al supervisor para que cree una dependencia antes de registrar un contrato.
              </q-banner>

              <q-banner
                v-else-if="estadoDependencias === 'error'"
                rounded
                color="negative"
              >
                <template #avatar>
                  <q-icon name="error" color="white" />
                </template>
                No se pudieron cargar las dependencias.
                <template #action>
                  <q-btn
                    flat
                    dense
                    color="white"
                    label="Reintentar"
                    no-caps
                    @click="cargarDependencias"
                  />
                </template>
              </q-banner>

              <q-input
                v-model="form.objeto"
                label="Objeto Contractual *"
                outlined
                dense
                type="textarea"
                rows="3"
                placeholder="Descripción breve del objeto del contrato"
                lazy-rules
                :rules="[(val) => (val && val.trim().length > 0) || 'El objeto contractual es obligatorio']"
              />

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.fechaInicio"
                    label="Fecha de Inicio *"
                    outlined
                    dense
                    type="date"
                    stack-label
                    lazy-rules
                    :rules="[(val) => !!val || 'Seleccione la fecha inicial']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.fechaFin"
                    label="Fecha de Terminación *"
                    outlined
                    dense
                    type="date"
                    stack-label
                    lazy-rules
                    :rules="[(val) => !form.fechaInicio || (val && val >= form.fechaInicio) || 'La fecha final no puede ser anterior a la inicial']"
                  />
                </div>
              </div>

              <!-- 2. Asignación de Supervisión -->
              <div class="text-subtitle1 text-weight-bold text-grey-8 border-bottom q-pb-xs q-mt-lg">
                2. Asignación de Supervisión
              </div>

              <q-select
                v-model="form.supervisor"
                label="Supervisor Asignado *"
                outlined
                dense
                emit-value
                map-options
                :options="supervisores"
                :loading="cargandoSupervisores"
                :disable="!editando"
                :rules="editando ? [(val) => !!val || 'Seleccione el supervisor'] : []"
              >
                <template #prepend>
                  <q-icon name="supervisor_account" />
                </template>
                <template v-if="!editando" #after>
                  <q-icon name="lock" size="18px" class="q-pl-xs text-grey-5" />
                </template>
              </q-select>
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ editando ? 'Supervisor asignado al contrato.' : 'El supervisor se asigna automáticamente cuando se registra la solicitud.' }}
              </div>

              <!-- 3. Inventario de bienes -->
              <div class="text-subtitle1 text-weight-bold text-grey-8 border-bottom q-pb-xs q-mt-lg">
                3. Inventario de bienes
              </div>

              <template v-if="!editando">
                <div
                  v-for="(bien, i) in form.bienes"
                  :key="i"
                  class="row q-col-gutter-sm items-center"
                >
                  <div class="col-12 col-sm-4">
                    <q-input
                      v-model="bien.descripcion"
                      label="Descripción"
                      outlined
                      dense
                      lazy-rules
                      :rules="[(val) => (val && val.trim().length > 0) || 'Requerida']"
                    />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input
                      v-model="bien.codigo_inventario"
                      label="Código inventario"
                      outlined
                      dense
                      lazy-rules
                      :rules="[(val) => (val && val.trim().length > 0) || 'Requerido']"
                    />
                  </div>
                  <div class="col-6 col-sm-2">
                    <q-input
                      v-model.number="bien.cantidad"
                      type="number"
                      label="Cantidad"
                      outlined
                      dense
                      min="1"
                    />
                  </div>
                  <div class="col-6 col-sm-2">
                    <q-select
                      v-model="bien.estado_bien"
                      label="Estado"
                      outlined
                      dense
                      emit-value
                      map-options
                      :options="estadosBien"
                    />
                  </div>
                  <div class="col-12 col-sm-1">
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="remove_circle_outline"
                      @click="quitarBien(i)"
                    />
                  </div>
                </div>

                <q-btn
                  flat
                  dense
                  color="primary"
                  icon="add"
                  label="Agregar bien"
                  no-caps
                  @click="agregarBien"
                />
              </template>

              <template v-else>
                <q-list dense bordered>
                  <q-item v-for="bien in bienes" :key="bien._id">
                    <q-item-section>
                      <q-item-label>{{ bien.descripcion }}</q-item-label>
                      <q-item-label caption>
                        Código: {{ bien.codigo_inventario }} · Cantidad: {{ bien.cantidad }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        flat
                        round
                        dense
                        color="negative"
                        icon="delete"
                        @click="confirmarEliminarBien(bien)"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item v-if="bienes.length === 0">
                    <q-item-section class="text-grey-6">Sin bienes registrados</q-item-section>
                  </q-item>
                </q-list>
              </template>

              <!-- 4. Soportes Requeridos -->
              <div class="text-subtitle1 text-weight-bold text-grey-8 border-bottom q-pb-xs q-mt-lg">
                4. Soportes Requeridos
              </div>

              <q-file
                v-model="form.adjunto"
                label="Adjuntar Informe Final o Soportes (PDF)"
                outlined
                dense
                accept=".pdf"
                :disable="editando"
                clearable
              >
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
              <div class="text-caption text-grey-6">
                Se registra el nombre del archivo como soporte del trámite; el documento físico /
                informado se entrega en la supervisión.
              </div>

              <!-- Acciones -->
              <div class="row justify-end q-gutter-sm q-mt-xl">
                <q-btn
                  flat
                  label="Cancelar"
                  color="grey-7"
                  no-caps
                  @click="router.push({ name: 'contratos' })"
                />
                <q-btn
                  color="positive"
                  :label="editando ? 'Actualizar Solicitud' : 'Registrar Solicitud'"
                  icon="save"
                  type="submit"
                  unelevated
                  no-caps
                  :loading="guardando"
                />
              </div>
            </q-form>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import api, { getErrorMessage } from '@/services/axios'
import {
  obtenerContrato,
  crearContrato,
  actualizarContrato,
  eliminarBien
} from '@/services/contratoService'
import { listarDependencias } from '@/services/dependenciaService'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const estadosBien = ['Bueno', 'Regular', 'Dañado'].map((e) => ({ label: e, value: e }))

const formRef = ref(null)
const guardando = ref(false)
const cargando = ref(false)

const dependencias = ref([])
const estadoDependencias = ref('cargando')

const supervisores = ref([])
const cargandoSupervisores = ref(false)

const form = ref({
  numero: '',
  telefono: '',
  dependencia: '',
  objeto: '',
  fechaInicio: '',
  fechaFin: '',
  supervisor: '',
  adjunto: null,
  bienes: []
})

const bienes = ref([])

const id = computed(() => route.params.id)
const editando = computed(() => Boolean(id.value))

function nuevoBien() {
  return { descripcion: '', codigo_inventario: '', cantidad: 1, estado_bien: 'Bueno' }
}

function agregarBien() {
  form.value.bienes.push(nuevoBien())
}

function quitarBien(i) {
  form.value.bienes.splice(i, 1)
}

async function cargarDependencias() {
  estadoDependencias.value = 'cargando'
  try {
    const { data } = await listarDependencias()
    const lista = Array.isArray(data) ? data : data?.data ?? []
    dependencias.value = lista.map((d) => ({ label: d.nombre_dependencia, value: d._id }))
    estadoDependencias.value = dependencias.value.length > 0 ? 'ok' : 'vacio'
  } catch {
    estadoDependencias.value = 'error'
  }
}

async function cargarSupervisores() {
  cargandoSupervisores.value = true
  try {
    const { data } = await api.get('/usuarios?rol=Supervisor')
    supervisores.value = (Array.isArray(data) ? data : []).map((s) => ({
      label: s.nombre_completo || s.nombre,
      value: s._id
    }))
  } catch {
    supervisores.value = []
  } finally {
    cargandoSupervisores.value = false
  }
}

function haySupervisor(j) {
  return supervisores.value.some((s) => s.value === j)
}

async function asignarSupervisorNuevo() {
  if (!auth.id) return
  try {
    const { data } = await api.get(`/usuarios/${auth.id}`)
    const supId = data.supervisor_id || null
    if (supId && haySupervisor(supId)) {
      form.value.supervisor = supId
    }
  } catch {
    // Si no se puede confirmar el supervisor, se deja en blanco (se asigna al registrar).
  }
}

async function cargarRegistro() {
  if (!id.value) return
  cargando.value = true
  try {
    const { data } = await obtenerContrato(id.value)
    const contrato = data.contrato || {}
    form.value = {
      numero: contrato.numero_contrato ?? '',
      telefono: contrato.telefono ?? '',
      dependencia: contrato.dependencia?._id || contrato.dependencia || '',
      objeto: contrato.objeto_contractual ?? '',
      fechaInicio: contrato.fecha_inicio ? contrato.fecha_inicio.slice(0, 10) : '',
      fechaFin: contrato.fecha_fin ? contrato.fecha_fin.slice(0, 10) : '',
      supervisor: contrato.supervisor?._id || contrato.supervisor || '',
      adjunto: null,
      bienes: []
    }
    bienes.value = data.bienes || []
    await cargarSupervisores()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo cargar el contrato.')
    })
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  const valido = await formRef.value.validate()
  if (!valido) return

  if (!form.value.bienes.length) {
    $q.notify({
      type: 'warning',
      message: 'Debe incluir al menos un bien en el inventario.'
    })
    return
  }

  guardando.value = true
  try {
    if (editando.value) {
      await actualizarContrato(id.value, {
        numero: form.value.numero,
        telefono: form.value.telefono,
        dependencia: form.value.dependencia,
        objeto_contractual: form.value.objeto,
        fecha_inicio: form.value.fechaInicio || null,
        fecha_fin: form.value.fechaFin || null
      })
      $q.notify({ type: 'positive', message: 'Solicitud actualizada correctamente.' })
    } else {
      await crearContrato({
        numero: form.value.numero,
        telefono: form.value.telefono,
        dependencia: form.value.dependencia,
        objeto_contractual: form.value.objeto,
        fecha_inicio: form.value.fechaInicio || null,
        fecha_fin: form.value.fechaFin || null,
        adjunto_nombre: form.value.adjunto?.name || null,
        bienes: form.value.bienes.map((b) => ({
          descripcion: b.descripcion,
          codigo_inventario: b.codigo_inventario,
          cantidad: b.cantidad || 1,
          estado_bien: b.estado_bien || 'Bueno'
        }))
      })
      $q.notify({ type: 'positive', message: 'Solicitud registrada exitosamente.' })
    }
    router.push({ name: 'contratos' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo guardar la solicitud.')
    })
  } finally {
    guardando.value = false
  }
}

function confirmarEliminarBien(bien) {
  $q.dialog({
    title: 'Eliminar bien',
    message: `¿Está seguro que desea eliminar el bien "${bien.descripcion}"?`,
    cancel: true,
    persistent: true,
    ok: { color: 'negative', label: 'Eliminar', noCaps: true }
  }).onOk(async () => {
    try {
      await eliminarBien(id.value, bien._id)
      $q.notify({ type: 'positive', message: 'Bien eliminado correctamente.' })
      await cargarRegistro()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: getErrorMessage(error, 'No se pudo eliminar el bien.')
      })
    }
  })
}

onMounted(() => {
  cargarDependencias()
  if (editando.value) {
    cargarRegistro()
  } else {
    cargarSupervisores().then(asignarSupervisorNuevo)
    if (form.value.bienes.length === 0) agregarBien()
  }
})
</script>

<style scoped>
.border-bottom {
  border-bottom: 2px solid #e0e0e0;
}
</style>