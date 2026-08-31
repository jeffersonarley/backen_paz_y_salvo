<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 text-weight-bold text-grey-9 q-mb-lg">Reportes</div>

    <div class="row q-col-gutter-lg q-mb-xl">
      <div v-for="card in tarjetas" :key="card.titulo" class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-white q-pa-md">
          <div class="text-grey-7">{{ card.titulo }}</div>
          <div class="text-h4 text-weight-bold">{{ card.cantidad }}</div>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="bg-white">
      <q-card-section class="text-h6">Contratos por estado</q-card-section>
      <q-card-section class="q-pt-none">
        <q-table :rows="rows" :columns="columns" row-key="estado" flat bordered hide-bottom :loading="cargando" no-data-label="Sin contratos." />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const rows = ref([])
const cargando = ref(false)
const total = ref(0)

const columns = [
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left' },
  { name: 'cantidad', label: 'Cantidad', field: 'cantidad', align: 'center' }
]

const tarjetas = [
  { titulo: 'Total contratos', cantidad: 0 },
  { titulo: 'Finalizados', cantidad: 0 },
  { titulo: 'En proceso', cantidad: 0 },
  { titulo: 'Rechazados', cantidad: 0 }
]

onMounted(cargar)

async function cargar() {
  cargando.value = true
  try {
    const { data } = await api.get('/api/contratos')
    const conteo = {}
    data.forEach((c) => {
      conteo[c.estado] = (conteo[c.estado] || 0) + 1
    })
    rows.value = Object.entries(conteo).map(([estado, cantidad]) => ({ estado, cantidad }))
    total.value = data.length
    tarjetas[0].cantidad = data.length
    tarjetas[1].cantidad = conteo['Finalizado'] || 0
    tarjetas[2].cantidad = (conteo['EnProceso'] || 0) + (conteo['Pendiente de Firmas'] || 0)
    tarjetas[3].cantidad = conteo['Rechazado'] || 0
  } catch {
    // La vista de reportes es informativa; si no hay permisos se muestra vacío.
  } finally {
    cargando.value = false
  }
}
</script>
