<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <!-- Encabezado -->
        <div class="row items-center q-mb-md">
          <q-btn icon="arrow_back" flat round dense color="grey-8" to="/solicitudes" class="q-mr-sm" />
          <div>
            <h5 class="text-h5 text-weight-bold q-my-none text-positive">
              Nueva Solicitud de Paz y Salvo
            </h5>
            <div class="text-caption text-grey-7">
              Diligencie la información requerida para el formato GCCON-F-088
            </div>
          </div>
        </div>

        <q-banner dense rounded class="bg-blue-1 text-primary q-mb-md">
          <template #avatar>
            <q-icon name="account_tree" />
          </template>
          <div class="text-weight-bold">
            Una sola solicitud recorrerá secuencialmente todas las áreas activas del sistema.
          </div>
          <div class="text-caption">
            No es necesario registrar una solicitud distinta para cada área.
          </div>
        </q-banner>

        <!-- Formulario Principal -->
        <q-card flat bordered class="q-pa-lg rounded-borders bg-white">
          <q-form @submit.prevent="guardarSolicitud" class="q-gutter-y-md">
            <!-- Datos del Contrato -->
            <div class="text-subtitle1 text-weight-bold text-grey-8 border-bottom q-pb-xs">
              1. Información del Contrato
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.numeroContrato"
                  outlined
                  dense
                  label="Número de Contrato *"
                  placeholder="Ej. CNT-2026-014"
                  :rules="[(val) => !!val || 'El número de contrato es obligatorio']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.contratista"
                  outlined
                  dense
                  label="Nombre del Contratista *"
                  placeholder="Nombre completo del contratista"
                  :rules="[(val) => !!val || 'El nombre del contratista es obligatorio']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="form.dependencia"
                  outlined
                  dense
                  label="Dependencia / Centro *"
                  :options="opcionesDependencias"
                  :rules="[(val) => !!val || 'Seleccione la dependencia']"
                  emit-value
                  map-options
                  option-label="nombre_dependencia"
                  option-value="_id"
                />
              </div>
            </div>

            <q-input
              v-model="form.objeto"
              outlined
              dense
              type="textarea"
              rows="3"
              label="Objeto Contractual *"
              placeholder="Descripción breve del objeto del contrato"
              :rules="[(val) => !!val || 'El objeto contractual es obligatorio']"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.fechaInicio"
                  outlined
                  dense
                  type="date"
                  label="Fecha de Inicio *"
                  stack-label
                  :rules="[(val) => !!val || 'Seleccione la fecha inicial']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.fechaFin"
                  outlined
                  dense
                  type="date"
                  label="Fecha de Terminación *"
                  stack-label
                  :rules="[(val) => !!val || 'Seleccione la fecha final']"
                />
              </div>
            </div>

            <!-- Asignación de Supervisor -->
            <div class="text-subtitle1 text-weight-bold text-grey-8 border-bottom q-pb-xs q-mt-lg">
              2. Asignación de Supervisión
            </div>

            <q-select
              v-model="form.supervisor"
              outlined
              dense
              label="Supervisor Asignado *"
              :options="opcionesSupervisores"
              option-label="nombre_completo"
              option-value="_id"
              :rules="[(val) => !!val || 'Seleccione el supervisor']"
            >
              <template #prepend>
                <q-icon name="supervisor_account" />
              </template>
            </q-select>

            <!-- Documentos adjuntos -->
            <div class="text-subtitle1 text-weight-bold text-grey-8 border-bottom q-pb-xs q-mt-lg">
              3. Soportes Requeridos
            </div>

            <q-file
              v-model="form.adjunto"
              outlined
              dense
              label="Adjuntar Informe Final o Soportes (PDF)"
              accept=".pdf"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <!-- Botones de Acción -->
            <div class="row justify-end q-gutter-sm q-mt-xl">
              <q-btn label="Cancelar" flat color="grey-7" to="/solicitudes" />
              <q-btn
                type="submit"
                color="positive"
                icon="save"
                label="Registrar Solicitud"
                unelevated
                :loading="cargando"
              />
            </div>
          </q-form>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Notify } from 'quasar'
import { useAuthStore } from '../stores/authStore.js'
import { listarDependencias } from '../services/dependenciaService.js'
import { listarPorRol } from '../services/usuarioService.js'
import { crearContrato } from '../services/contratoService.js'
import { getErrorMessage } from '../services/api.js'

const auth = useAuthStore()
const cargando = ref(false)

const form = ref({
  numeroContrato: `CNT-2026-${Math.floor(100 + Math.random() * 900)}`,
  contratista: '',
  dependencia: null,
  objeto: '',
  fechaInicio: '',
  fechaFin: '',
  supervisor: null,
  adjunto: null,
})

const opcionesDependencias = ref([])
const opcionesSupervisores = ref([])

onMounted(async () => {
  if (!form.value.contratista && auth.usuario?.nombre) {
    form.value.contratista = auth.usuario.nombre
  }
  try {
    const [depRes, supRes] = await Promise.allSettled([
      listarDependencias(),
      listarPorRol('Supervisor'),
    ])

    if (depRes.status === 'fulfilled') {
      const deps = Array.isArray(depRes.value) ? depRes.value : depRes.value?.dependencias || depRes.value?.data || []
      if (deps.length > 0) {
        opcionesDependencias.value = deps
      }
    }

    if (supRes.status === 'fulfilled') {
      const sups = Array.isArray(supRes.value) ? supRes.value : supRes.value?.usuarios || supRes.value?.data || []
      if (sups.length > 0) {
        opcionesSupervisores.value = sups
      }
    }
  } catch (err) {
    console.warn('Carga de listas para nueva solicitud:', err.message)
  }
})

async function guardarSolicitud() {
  const router = await import('vue-router').then(m => m.useRouter())
  cargando.value = true

  try {
    await crearContrato({
      numero: form.value.numeroContrato,
      telefono: '3001234567',
      dependencia: form.value.dependencia,
      objeto_contractual: form.value.objeto || '',
      fecha_inicio: form.value.fechaInicio,
      fecha_fin: form.value.fechaFin,
      adjunto_nombre: form.value.adjunto?.name || null,
      bienes: [{
        descripcion: 'Equipo de cómputo y accesorios de oficina',
        codigo_inventario: `INV-${Date.now().toString().slice(-4)}`,
        estado_bien: 'Bueno',
        cantidad: 1,
      }]
    })

    Notify.create({
      type: 'positive',
      message: 'Solicitud creada exitosamente y registrada en MongoDB Atlas.',
      position: 'top-right',
    })
    router.push({ name: 'solicitudes' })
  } catch (err) {
    console.error('Error al registrar solicitud:', err)
    Notify.create({
      type: 'negative',
      message: 'Error al registrar solicitud: ' + getErrorMessage(err),
      position: 'top-right',
    })
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 2px solid #e0e0e0;
}
</style>