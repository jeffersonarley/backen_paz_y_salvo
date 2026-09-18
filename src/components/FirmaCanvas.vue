<template>
  <div class="firma-canvas" @paste="alPegar">
    <q-toolbar class="q-pa-none q-mb-sm row items-center q-gutter-xs">
      <q-btn
        dense
        color="primary"
        icon="content_paste"
        label="Pegar Firma (Ctrl+V)"
        class="q-px-sm"
        @click="pegarPortapapeles"
      >
        <q-tooltip>Pegar imagen desde el portapapeles</q-tooltip>
      </q-btn>

      <q-btn
        flat
        dense
        color="secondary"
        icon="upload_file"
        label="Subir Imagen"
        class="q-px-sm"
        @click="seleccionarArchivo"
      >
        <q-tooltip>Cargar archivo de imagen (PNG o JPG)</q-tooltip>
      </q-btn>

      <q-space />

      <q-btn
        flat
        dense
        color="grey-7"
        icon="cleaning_services"
        label="Limpiar"
        @click="limpiar"
      />
    </q-toolbar>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="alSeleccionarArchivo"
    />

    <!-- Vista previa de imagen cargada o pegada -->
    <div v-if="imagenPegada" class="contenedor-preview-imagen">
      <img :src="imagenPegada" alt="Firma cargada" class="imagen-firma-cargada" />
      <div class="badge-firma-ok">
        <q-icon name="check_circle" color="positive" size="18px" class="q-mr-xs" />
        Firma cargada correctamente
      </div>
      <q-btn
        round
        dense
        color="negative"
        icon="delete"
        size="sm"
        class="btn-quitar-imagen"
        @click="limpiar"
      >
        <q-tooltip>Eliminar firma y volver a cargar o dibujar</q-tooltip>
      </q-btn>
    </div>

    <!-- Lienzo interactivo de dibujo cuando no hay imagen cargada -->
    <div v-else class="contenedor-lienzo" @click="enfocarCanvas">
      <canvas
        ref="canvasRef"
        class="lienzo"
        tabindex="0"
        @pointerdown="iniciarTrazo"
        @pointermove="dibujarTrazo"
        @pointerup="terminarTrazo"
        @pointerleave="terminarTrazo"
        @paste="alPegar"
      />
      <div v-if="!tieneTrazo" class="guia-pegar pointer-events-none">
        <q-icon name="content_paste" size="32px" color="primary" class="q-mb-xs" />
        <div class="text-subtitle2 text-primary text-weight-bold">
          Pega tu firma con Ctrl + V o usa los botones de arriba
        </div>
        <div class="text-caption text-grey-7">
          Puedes subir una imagen (PNG/JPG) o dibujar a mano con el ratón
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const canvasRef = ref(null)
const fileInputRef = ref(null)
const imagenPegada = ref(null)
const tieneTrazo = ref(false)

let ctx = null
let dibujando = false
let ultimoPunto = null

const DPI_X = window.devicePixelRatio || 1

onMounted(() => {
  nextTick(() => {
    inicializarCanvas()
  })
  window.addEventListener('paste', alPegar)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', alPegar)
})

function inicializarCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')

  const rect = canvas.getBoundingClientRect()
  const width = rect.width > 0 ? rect.width : 480
  const height = rect.height > 0 ? rect.height : 220

  canvas.width = width * DPI_X
  canvas.height = height * DPI_X
  ctx.scale(DPI_X, DPI_X)

  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#1d1d1d'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
}

function enfocarCanvas() {
  if (canvasRef.value) {
    canvasRef.value.focus()
  }
}

function obtenerPosicion(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function iniciarTrazo(event) {
  dibujando = true
  tieneTrazo.value = true
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
  imagenPegada.value = null
  tieneTrazo.value = false
  nextTick(() => {
    if (canvasRef.value) {
      inicializarCanvas()
    }
  })
}

function cargarDataUrl(dataUrl) {
  imagenPegada.value = dataUrl
}

async function pegarPortapapeles() {
  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const reader = new FileReader()
            reader.onload = (e) => cargarDataUrl(e.target.result)
            reader.readAsDataURL(blob)
            return
          }
        }
      }
    }
    seleccionarArchivo()
  } catch {
    seleccionarArchivo()
  }
}

function alPegar(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (blob) {
        const reader = new FileReader()
        reader.onload = (evt) => {
          cargarDataUrl(evt.target.result)
        }
        reader.readAsDataURL(blob)
        e.preventDefault()
        return
      }
    }
  }
}

function seleccionarArchivo() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function alSeleccionarArchivo(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    cargarDataUrl(evt.target.result)
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function exportarBase64() {
  if (imagenPegada.value) {
    return imagenPegada.value
  }
  if (canvasRef.value) {
    return canvasRef.value.toDataURL('image/png')
  }
  return ''
}

defineExpose({ limpiar, cargarDataUrl, pegarPortapapeles, seleccionarArchivo, exportarBase64 })
</script>

<style scoped>
.firma-canvas {
  width: 100%;
}

.contenedor-preview-imagen {
  position: relative;
  width: 100%;
  height: 220px;
  border: 2px solid #2e7d32;
  border-radius: 8px;
  background: #f4fbf4;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
}

.imagen-firma-cargada {
  max-width: 90%;
  max-height: 140px;
  object-fit: contain;
  display: block;
}

.badge-firma-ok {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #2e7d32;
  display: flex;
  align-items: center;
}

.btn-quitar-imagen {
  position: absolute;
  top: 8px;
  right: 8px;
}

.contenedor-lienzo {
  position: relative;
  width: 100%;
  cursor: crosshair;
}

.lienzo {
  width: 100%;
  height: 220px;
  border: 2px dashed #90caf9;
  border-radius: 8px;
  background: #ffffff;
  touch-action: none;
  display: block;
}

.lienzo:focus {
  outline: 2px solid #1976d2;
  border-color: #1976d2;
}

.guia-pegar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.6);
  padding: 12px;
}
</style>
