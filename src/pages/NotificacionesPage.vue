<template>
  <q-page class="q-pa-lg">
    <div class="text-h4 text-weight-bold text-grey-9 q-mb-lg">Notificaciones</div>

    <q-card flat bordered class="bg-white q-pa-md">
      <q-list v-if="items.length" separator>
        <q-item v-for="(n, i) in items" :key="i" dense>
          <q-item-section avatar>
            <div class="notif-icono" :style="{ background: n.bg, color: n.color }">
              <q-icon :name="n.icono" size="24px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-body1">{{ n.titulo }}</q-item-label>
            <q-item-label caption>{{ n.descripcion }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <span class="text-caption text-grey-6">{{ n.cuando }}</span>
          </q-item-section>
        </q-item>
      </q-list>
      <div v-else class="text-grey-6 q-pa-lg text-center">No hay notificaciones por el momento.</div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const items = ref([])

onMounted(cargar)

async function cargar() {
  const tareas = []
  if (['Administrador', 'Supervisor'].includes(auth.rol)) {
    tareas.push(api.get('/api/usuarios').catch(() => []))
  }
  const url = auth.rol === 'Contratista' ? '/api/contratos/mis-solicitudes' : '/api/contratos'
  tareas.push(api.get(url).catch(() => []))

  const [usuariosResp, contratosResp] = await Promise.all(tareas)
  const contratos = contratosResp?.data || []

  const lista = []

  contratos.forEach((c) => {
    if (c.estado === 'Pendiente de Firmas' || c.estado === 'EnProceso') {
      lista.push({
        icono: 'assignment',
        bg: '#fff8e1',
        color: '#f9a825',
        titulo: 'Nueva solicitud asignada',
        descripcion: `Solicitud ${c.numero_contrato} asignada para su trámite`,
        cuando: hace(c.createdAt)
      })
    }
    if (c.estado === 'Finalizado') {
      lista.push({
        icono: 'check_circle',
        bg: '#e8f5e9',
        color: '#2e7d32',
        titulo: 'Solicitud firmada',
        descripcion: `La solicitud ${c.numero_contrato} ha sido firmada`,
        cuando: hace(c.updatedAt)
      })
    }
    if (c.estado === 'Rechazado') {
      lista.push({
        icono: 'edit_note',
        bg: '#fff3e0',
        color: '#ef6c00',
        titulo: 'Observación registrada',
        descripcion: `Se registró una observación en la solicitud ${c.numero_contrato}`,
        cuando: hace(c.updatedAt)
      })
    }
  })

  const usuarios = usuariosResp?.data || []
  usuarios.forEach((u) => {
    lista.push({
      icono: 'group_add',
      bg: '#eee',
      color: '#333',
      titulo: 'Nuevo usuario creado',
      descripcion: `Se ha creado el usuario ${u.correo_institucional}`,
      cuando: hace(u.createdAt)
    })
  })

  items.value = lista.filter((n) => n.cuando !== '−').slice(0, 12)
}

function hace(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const dif = Date.now() - d.getTime()
  if (Number.isNaN(dif)) return '—'
  const min = Math.floor(dif / 60000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `hace ${hrs} h`
  return new Date(fecha).toLocaleDateString('es-CO')
}
</script>

<style scoped>
.notif-icono {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
