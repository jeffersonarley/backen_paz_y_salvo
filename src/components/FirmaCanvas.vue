<template>
  <div class="firma-canvas">
    <q-toolbar class="q-pa-none q-mb-sm">
      <q-space />
      <q-btn
        flat
        dense
        no-caps
        color="grey-7"
        icon="cleaning_services"
        label="Limpiar"
        @click="limpiar"
      />
    </q-toolbar>

    <canvas
      ref="canvasRef"
      class="lienzo"
      @pointerdown="iniciarTrazo"
      @pointermove="dibujarTrazo"
      @pointerup="terminarTrazo"
      @pointerleave="terminarTrazo"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const canvasRef = ref(null)
let ctx = null
let dibujando = false
let ultimoPunto = null

const DPI_X = window.devicePixelRatio || 1

onMounted(() => {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')

  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * DPI_X
  canvas.height = rect.height * DPI_X
  ctx.scale(DPI_X, DPI_X)

  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#1d1d1d'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, rect.width, rect.height)
})

function obtenerPosicion(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function iniciarTrazo(event) {
  dibujando = true
  ultimoPunto = obtenerPosicion(event)
  event.preventDefault()
}

function dibujarTrazo(event) {
  if (!dibujando) return
  const punto = obtenerPosicion(event)
  ctx.beginPath()
  ctx.moveTo(ultimoPunto.x, ultimoPunto.y)
  ctx.lineTo(punto.x, punto.y)
  ctx.stroke()
  ultimoPunto = punto
  event.preventDefault()
}

function terminarTrazo() {
  dibujando = false
  ultimoPunto = null
}

function limpiar() {
  const rect = canvasRef.value.getBoundingClientRect()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, rect.width, rect.height)
}

function exportarBase64() {
  return canvasRef.value.toDataURL('image/png')
}

defineExpose({ limpiar, exportarBase64 })
</script>

<style scoped>
.firma-canvas {
  width: 100%;
}

.lienzo {
  width: 100%;
  height: 220px;
  border: 2px dashed #c0c4cc;
  border-radius: 8px;
  background: #ffffff;
  touch-action: none;
  cursor: crosshair;
}
</style>
