<template>
  <q-card class="stat-card bg-white" bordered>
    <q-card-section class="row items-center q-gutter-md">
      <div class="stat-icon" :style="{ background: iconBg, color: iconColor }">
        <q-icon :name="icono" size="30px" />
      </div>
      <div>
        <div class="stat-label text-grey-7">{{ titulo }}</div>
        <div class="stat-value text-weight-800">{{ cantidad }}</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
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
