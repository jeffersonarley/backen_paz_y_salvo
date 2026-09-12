<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">
      {{ editando ? 'Editar Contrato' : 'Nuevo Contrato' }}
    </div>

    <q-card flat bordered>
      <q-card-section>
        <q-form ref="formRef" class="q-gutter-md" @submit.prevent="guardar">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.numero"
                label="Número de contrato"
                outlined
                dense
                lazy-rules
                :rules="[(val) => (val && val.trim().length > 0) || 'El número es obligatorio']"
              />
            </div>

            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.telefono"
                label="Teléfono"
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
            label="Dependencia"
            outlined
            dense
            emit-value
            map-options
            :options="dependencias"
            :loading="estadoDependencias === 'cargando'"
            :rules="[(val) => !!val || 'Seleccione una dependencia']"
          />

          <q-banner
            v-else-if="estadoDependencias === 'vacio'"
            class="q-mt-sm"
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
            class="q-mt-sm"
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

          <template v-if="!editando">
            <div class="text-subtitle1 text-weight-bold q-mt-sm">Inventario de bienes</div>

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
            <div class="text-subtitle1 text-weight-bold q-mt-sm">Bienes entregados</div>
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

          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn
              flat
              label="Cancelar"
              color="grey-8"
              no-caps
              @click="router.push({ name: 'contratos' })"
            />
            <q-btn
              color="primary"
              :label="editando ? 'Actualizar' : 'Guardar'"
              type="submit"
              unelevated
              no-caps
              :loading="guardando"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  obtenerContrato,
  crearContrato,
  actualizarContrato,
  eliminarBien
} from '@/services/contratoService'
import { listarDependencias } from '@/services/dependenciaService'
import { getErrorMessage } from '@/services/axios'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const estadosBien = ['Bueno', 'Regular', 'Dañado'].map((e) => ({ label: e, value: e }))

const formRef = ref(null)
const guardando = ref(false)
const cargando = ref(false)

const dependencias = ref([])
const estadoDependencias = ref('cargando')

const form = ref({
  numero: '',
  telefono: '',
  dependencia: '',
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
      bienes: []
    }
    bienes.value = data.bienes || []
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

  guardando.value = true
  try {
    if (editando.value) {
      await actualizarContrato(id.value, {
        numero: form.value.numero,
        telefono: form.value.telefono,
        dependencia: form.value.dependencia
      })
      $q.notify({ type: 'positive', message: 'Contrato actualizado correctamente.' })
    } else {
      await crearContrato({
        numero: form.value.numero,
        telefono: form.value.telefono,
        dependencia: form.value.dependencia,
        bienes: form.value.bienes.map((b) => ({
          descripcion: b.descripcion,
          codigo_inventario: b.codigo_inventario,
          cantidad: b.cantidad || 1,
          estado_bien: b.estado_bien || 'Bueno'
        }))
      })
      $q.notify({ type: 'positive', message: 'Contrato creado correctamente.' })
    }
    router.push({ name: 'contratos' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo guardar el contrato.')
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
  cargarRegistro()
})
</script>
