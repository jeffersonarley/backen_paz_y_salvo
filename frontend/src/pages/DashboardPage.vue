<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-md">Panel Principal</div>

    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-3">
        <q-card class="q-pa-md" flat bordered>
          <q-skeleton type="QToolbar" />
          <q-skeleton type="text" class="q-mt-sm" />
        </q-card>
      </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="card in cards"
        :key="card.key"
        class="col-12 col-sm-6 col-md-3"
      >
        <q-card class="metric-card q-pa-md" flat bordered>
          <q-card-section class="row items-center no-wrap">
            <q-icon :name="card.icon" :color="card.color" size="48px" class="q-mr-md" />
            <div>
              <div class="text-h4 text-weight-bold">{{ card.value ?? '—' }}</div>
              <div class="text-subtitle2 text-grey-7">{{ card.label }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="cards.length === 0" class="col-12">
        <q-banner class="bg-grey-2 text-grey-8">
          No hay indicadores disponibles para tu rol.
        </q-banner>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { getDashboardStats } from '@/services/dashboardService'
import { getRol } from '@/services/authService'
import { getErrorMessage } from '@/services/axios'

const $q = useQuasar()

const loading = ref(false)
const cards = ref([])

async function cargar() {
  loading.value = true
  try {
    cards.value = await getDashboardStats(getRol())
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudieron cargar los indicadores.')
    })
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>
