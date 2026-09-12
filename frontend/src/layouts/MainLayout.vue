<template>
  <q-layout view="lHh LpR lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menú"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title class="text-weight-bold">
          Paz y Salvo SENA
        </q-toolbar-title>

        <q-btn-dropdown
          flat
          dense
          no-caps
          :label="nombreUsuario"
          icon="account_circle"
        >
          <q-list>
            <q-item clickable v-close-popup @click="onLogout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>Cerrar sesión</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="240"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header>Navegación</q-item-label>

          <q-item
            v-for="link in menu"
            :key="link.name"
            clickable
            v-ripple
            :to="{ name: link.name }"
            active-class="text-primary"
          >
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>{{ link.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { logout, getUsuario, getRol } from '@/services/authService'
import { ROL } from '@/constants/roles'

const $q = useQuasar()
const router = useRouter()

const leftDrawerOpen = ref(false)

const menu = computed(() => {
  const rol = getRol()
  const items = [
    { name: 'dashboard', label: 'Panel Principal', icon: 'dashboard' },
    { name: 'contratos', label: 'Contratos', icon: 'assignment' }
  ]

  if (rol === ROL.CONTRATISTA) {
    items.push({ name: 'contrato-nuevo', label: 'Nuevo Contrato', icon: 'add_circle_outline' })
  }
  if ([ROL.ADMINISTRADOR, ROL.SUPERVISOR].includes(rol)) {
    items.push({ name: 'usuarios', label: 'Usuarios', icon: 'people' })
  }
  if ([ROL.ADMINISTRADOR, ROL.SUPERVISOR].includes(rol)) {
    items.push({ name: 'dependencias', label: 'Dependencias', icon: 'apartment' })
  }
  if ([ROL.ADMINISTRADOR, ROL.RESPONSABLE_AREA].includes(rol)) {
    items.push({ name: 'firmas', label: 'Firmas', icon: 'draw' })
  }

  return items
})

const nombreUsuario = computed(() => {
  const usuario = getUsuario()
  return usuario?.nombre || usuario?.correo || 'Usuario'
})

function onLogout() {
  $q.dialog({
    title: 'Cerrar sesión',
    message: '¿Está seguro que desea cerrar la sesión?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    logout()
    router.push({ name: 'login' })
  })
}
</script>
