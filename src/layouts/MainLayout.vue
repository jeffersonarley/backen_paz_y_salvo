<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Barra superior (con print-hide para que no salga al imprimir) -->
    <q-header elevated class="bg-primary text-white print-hide">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Abrir menú"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-avatar class="q-ml-md">
          <img class="header-logo" src="../images/logo-sena.png" alt="Logo SENA" />
        </q-avatar>

        <q-toolbar-title>
          <div class="text-weight-bold">GCCON-F-088</div>
          <div class="text-caption">Paz y Salvo Contractual</div>
        </q-toolbar-title>

        <!-- Botón de Usuario con Menú Desplegable -->
        <q-btn flat round icon="account_circle">
          <q-menu auto-close>
            <q-list style="min-width: 150px">
              <q-item clickable :to="{ name: 'perfil' }">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>Mi Perfil</q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable @click="cerrarSesion">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative text-weight-bold">
                  Cerrar Sesión
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Menú lateral (con print-hide para que desaparezca al imprimir) -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="250"
      class="bg-grey-1 print-hide"
    >
      <q-list padding>
        <q-item-label header class="text-primary text-weight-bold"> MENÚ PRINCIPAL </q-item-label>

        <q-item
          v-for="item in menuItems"
          :key="item.name"
          clickable
          v-ripple
          :to="item.to"
          :exact="item.exact"
          active-class="text-primary text-weight-bold bg-green-1"
          @click="cerrarDrawerEnMovil"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>

        <q-separator class="q-my-sm" />

        <q-item
          clickable
          v-ripple
          :to="{ name: 'perfil' }"
          active-class="text-primary text-weight-bold bg-green-1"
          @click="cerrarDrawerEnMovil"
        >
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>Perfil</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Contenido -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore.js'

const normalizarRol = (valor) =>
  String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

const $q = useQuasar()
const leftDrawerOpen = ref($q.screen.gt.sm)
const router = useRouter()
const auth = useAuthStore()

// Reacciona en vivo si la pantalla cambia de tamaño (p. ej. al usar
// las DevTools en modo responsivo, o al rotar/redimensionar la ventana)
watch(
  () => $q.screen.gt.sm,
  (esPantallaGrande) => {
    leftDrawerOpen.value = esPantallaGrande
  }
)

const menuBase = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    to: { name: 'dashboard' },
    icon: 'dashboard',
    exact: true,
    roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
  },
  {
    name: 'usuarios',
    label: 'Usuarios',
    to: { name: 'usuarios' },
    icon: 'people',
    exact: false,
    roles: ['ADMINISTRADOR'],
  },
  {
    name: 'contratistas',
    label: 'Contratistas',
    to: { name: 'contratistas' },
    icon: 'description',
    exact: false,
    roles: ['ADMINISTRADOR', 'SUPERVISOR'],
  },
  {
    name: 'dependencias',
    label: 'Dependencias',
    to: { name: 'dependencias' },
    icon: 'business',
    exact: false,
    roles: ['ADMINISTRADOR', 'SUPERVISOR'],
  },
  {
    name: 'solicitudes',
    label: 'Solicitudes',
    to: { name: 'solicitudes' },
    icon: 'assignment',
    exact: false,
    roles: ['ADMINISTRADOR', 'SUPERVISOR', 'CONTRATISTA', 'RESPONSABLE_AREA'],
  },
  {
    name: 'firmas',
    label: 'Firmas',
    to: { name: 'firmas' },
    icon: 'draw',
    exact: false,
    roles: ['ADMINISTRADOR', 'SUPERVISOR', 'RESPONSABLE_AREA'],
  },
]

const menuItems = computed(() => {
  const rolActual = normalizarRol(auth.usuario?.rol)
  if (!rolActual) return []

  return menuBase.filter((item) => item.roles.some((rol) => normalizarRol(rol) === rolActual))
})

function cerrarSesion() {
  auth.logout()
  router.push('/login')
}

function cerrarDrawerEnMovil() {
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = false
  }
}
</script>

<style scoped>
.header-logo {
  filter: brightness(0) invert(1);
  width: 34px;
  height: auto;
}

/* Reglas definitivas para impresión y PDF */
</style>
