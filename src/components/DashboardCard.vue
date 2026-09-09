<template>
<<<<<<< HEAD
  <q-card 
    class="dashboard-card bg-white shadow-1" 
    flat
    bordered
  >
    <q-card-section class="row items-center justify-between no-wrap q-pa-md">
      <div>
        <div class="text-grey-7 text-subtitle2 text-weight-medium">
          {{ titulo }}
        </div>

        <div class="text-h4 text-weight-bold text-grey-9 q-mt-xs">
          {{ cantidad }}
        </div>
      </div>

      <div class="icon-container flex flex-center rounded-borders">
        <q-icon
          :name="icono"
          size="32px"
          color="primary"
        />
      </div>
=======
  <q-card class="stat-card bg-white" bordered>
    <q-card-section class="row items-center q-gutter-md">
      <div class="stat-icon" :style="{ background: iconBg, color: iconColor }">
        <q-icon :name="icono" size="30px" />
      </div>
      <div>
        <div class="stat-label text-grey-7">{{ titulo }}</div>
        <div class="stat-value text-weight-800">{{ cantidad }}</div>
      </div>
>>>>>>> origin/frontend-juanpablo
    </q-card-section>
  </q-card>
</template>

<script setup>
<<<<<<< HEAD
defineProps({
  titulo: {
    type: String,
    default: 'Métrica'
  },
  cantidad: {
    type: Number,
    default: 0
  },
  icono: {
    type: String,
    default: 'analytics'
  }
})
</script>

<style scoped>
.dashboard-card {
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12) !important;
}

.icon-container {
  width: 56px;
  height: 56px;
  background-color: rgba(57, 169, 0, 0.1);
  border-radius: 12px;
}
</style>
=======
import { computed } from 'vue'

const props = defineProps({
  titulo: String,
  cantidad: { type: Number, default: 0 },
  icono: String,
  color: { type: String, default: 'green' }
})

const paleta = {
  green: ['#e8f5e9', '#2e7d32'],
  yellow: ['#fff8e1', '#f9a825'],
  blue: ['#e3f2fd', '#1976d2'],
  purple: ['#f3e5f5', '#8e24aa'],
  orange: ['#fff3e0', '#ef6c00'],
  red: ['#ffebee', '#d32f2f']
}

const iconBg = computed(() => paleta[props.color]?.[0] || paleta.green[0])
const iconColor = computed(() => paleta[props.color]?.[1] || paleta.green[1])
</script>

<style scoped>
.stat-card {
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-label {
  font-size: 14px;
}

.stat-value {
  font-size: 28px;
  line-height: 1.1;
}
</style>
>>>>>>> origin/frontend-juanpablo
