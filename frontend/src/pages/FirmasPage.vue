<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">Firmas de Área</div>

    <q-card flat bordered>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="pendientes" label="Pendientes" />
        <q-tab name="historial" label="Historial" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="pendientes">
          <q-table
            :rows="pendientes"
            :columns="columns"
            row-key="_id"
            :loading="loading"
            flat
            bordered
            no-data-label="No hay firmas pendientes"
            loading-label="Cargando firmas..."
          >
            <template #body-cell-estado="props">
              <q-td :props="props">
                <q-badge color="orange" label="Pendiente" />
              </q-td>
            </template>

            <template #body-cell-acciones="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  dense
                  color="positive"
                  label="Aprobar"
                  no-caps
                  @click="abrirAprobar(props.row)"
                />
                <q-btn
                  flat
                  dense
                  color="negative"
                  label="Rechazar"
                  no-caps
                  @click="abrirRechazar(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="historial">
          <q-table
            :rows="historial"
            :columns="columns"
            row-key="_id"
            :loading="loading"
            flat
            bordered
            no-data-label="No hay historial de firmas"
            loading-label="Cargando historial..."
          >
            <template #body-cell-estado="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.estado === 'Aprobado' ? 'positive' : 'negative'"
                  :label="props.row.estado"
                />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-dialog v-model="dialogAprobar" persistent>
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">Aprobar firma</div>
          <div class="text-subtitle2 text-grey-7">
            Contrato: {{ firmaSeleccionada?.contrato_id?.numero_contrato }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="firmaBase64"
            label="Firma (base64, opcional)"
            type="textarea"
            outlined
            autogrow
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" no-caps v-close-popup />
          <q-btn
            color="positive"
            label="Confirmar aprobación"
            unelevated
            no-caps
            :loading="guardando"
            @click="procesar('Aprobar')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogRechazar" persistent>
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">Rechazar firma</div>
          <div class="text-subtitle2 text-grey-7">
            Contrato: {{ firmaSeleccionada?.contrato_id?.numero_contrato }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="observacionRechazo"
            label="Observación (obligatoria)"
            type="textarea"
            outlined
            autogrow
            lazy-rules
            :rules="[(val) => (val && val.trim().length > 0) || 'La observación es obligatoria']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-8" no-caps v-close-popup />
          <q-btn
            color="negative"
            label="Confirmar rechazo"
            unelevated
            no-caps
            :loading="guardando"
            @click="procesar('Rechazar')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { listarPendientes, listarHistorial, procesarFirma } from '@/services/firmaService'
import { getErrorMessage } from '@/services/axios'

const $q = useQuasar()

const columns = [
  { name: 'contrato', label: 'Contrato', field: (row) => row.contrato_id?.numero_contrato, align: 'left' },
  { name: 'area', label: 'Área', field: (row) => row.area_id?.nombre_dependencia, align: 'left' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'fecha_firma', label: 'Fecha', field: 'fecha_firma', align: 'left' },
  { name: 'acciones', label: 'Acciones', align: 'right' }
]

const tab = ref('pendientes')
const pendientes = ref([])
const historial = ref([])
const loading = ref(false)

const dialogAprobar = ref(false)
const dialogRechazar = ref(false)
const firmaSeleccionada = ref(null)
const firmaBase64 = ref('')
const observacionRechazo = ref('')
const guardando = ref(false)

async function cargarDatos() {
  loading.value = true
  try {
    const [resPend, resHist] = await Promise.allSettled([
      listarPendientes(),
      listarHistorial()
    ])
    if (resPend.status === 'fulfilled') {
      pendientes.value = resPend.value.data || []
    }
    if (resHist.status === 'fulfilled') {
      historial.value = resHist.value.data || []
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudieron cargar las firmas.')
    })
  } finally {
    loading.value = false
  }
}

function abrirAprobar(row) {
  firmaSeleccionada.value = row
  firmaBase64.value = ''
  dialogAprobar.value = true
}

function abrirRechazar(row) {
  firmaSeleccionada.value = row
  observacionRechazo.value = ''
  dialogRechazar.value = true
}

async function procesar(accion) {
  if (accion === 'Rechazar' && !observacionRechazo.value.trim()) {
    $q.notify({ type: 'warning', message: 'Debe indicar una observación.' })
    return
  }

  guardando.value = true
  try {
    await procesarFirma({
      contratoId: firmaSeleccionada.value.contrato_id._id,
      accion,
      observacion_rechazo: accion === 'Rechazar' ? observacionRechazo.value : undefined,
      firma_base64: accion === 'Aprobar' ? firmaBase64.value || undefined : undefined
    })
    $q.notify({
      type: 'positive',
      message: accion === 'Aprobar' ? 'Firma aprobada correctamente.' : 'Firma rechazada correctamente.'
    })
    dialogAprobar.value = false
    dialogRechazar.value = false
    await cargarDatos()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo procesar la firma.')
    })
  } finally {
    guardando.value = false
  }
}

onMounted(cargarDatos)
</script>
