<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        
        <!-- Encabezado -->
        <div class="row items-center q-mb-md">
          <q-btn
            icon="arrow_back"
            flat
            round
            dense
            color="grey-8"
            to="/app"
            class="q-mr-sm"
          />
          <div>
            <h5 class="text-h5 text-weight-bold q-my-none text-positive">
              Nueva Solicitud de Paz y Salvo
            </h5>
            <div class="text-caption text-grey-7">
              Diligencie la información requerida para el formato GCCON-F-088
            </div>
          </div>
        </div>

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
                  placeholder="Ej. C-2026-014"
                  :rules="[val => !!val || 'El número de contrato es obligatorio']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.dependencia"
                  outlined
                  dense
                  label="Dependencia / Centro *"
                  :options="opcionesDependencias"
                  :rules="[val => !!val || 'Seleccione la dependencia']"
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
              :rules="[val => !!val || 'El objeto contractual es obligatorio']"
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
                  :rules="[val => !!val || 'Seleccione la fecha inicial']"
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
                  :rules="[val => !!val || 'Seleccione la fecha final']"
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
              option-label="nombre"
              option-value="id"
              :rules="[val => !!val || 'Seleccione el supervisor']"
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
              <q-btn
                label="Cancelar"
                flat
                color="grey-7"
                to="/app"
              />
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'

const router = useRouter()
const cargando = ref(false)

const form = ref({
  numeroContrato: '',
  dependencia: null,
  objeto: '',
  fechaInicio: '',
  fechaFin: '',
  supervisor: null,
  adjunto: null
})

const opcionesDependencias = [
  'Centro de Comercio y Servicios',
  'Centro Industrial y del Desarrollo Tecnológico',
  'Despacho de Dirección Regional',
  'Subdirección Centro Agroturístico'
]

const opcionesSupervisores = [
  { id: 1, nombre: 'Ing. María Alejandra Gómez - Supervisor Técnico' },
  { id: 2, nombre: 'Arq. Roberto Carlos Silva - Supervisor Infraestructura' },
  { id: 3, nombre: 'Lic. Claudia Patricia Ruiz - Supervisora Administrativa' }
]

function guardarSolicitud() {
  cargando.value = true

  // Obtener usuario en sesión
  const user = JSON.parse(localStorage.getItem('gccon_user') || '{}')

  // Crear objeto de solicitud
  const nuevaSolicitud = {
    id: `REQ-${Date.now().toString().slice(-4)}`,
    numeroContrato: form.value.numeroContrato,
    dependencia: form.value.dependencia,
    objeto: form.value.objeto,
    fechaInicio: form.value.fechaInicio,
    fechaFin: form.value.fechaFin,
    supervisor: form.value.supervisor ? form.value.supervisor.nombre : '',
    solicitante: user.nombre || 'Contratista',
    estado: 'Pendiente',
    fechaCreacion: new Date().toLocaleDateString('es-CO')
  }

  // Guardar en localStorage para persistencia temporal
  const solicitudes = JSON.parse(localStorage.getItem('gccon_solicitudes') || '[]')
  solicitudes.unshift(nuevaSolicitud)
  localStorage.setItem('gccon_solicitudes', JSON.stringify(solicitudes))

  setTimeout(() => {
    cargando.value = false
    try {
      Notify.create({
        type: 'positive',
        message: 'Solicitud creada exitosamente',
        position: 'top-right'
      })
    } catch {
      // Ignorar si notify no está disponible
    }
    router.push('/app')
  }, 600)
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 2px solid #e0e0e0;
}
</style>