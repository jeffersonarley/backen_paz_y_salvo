<template>
  <q-layout view="hHh lpR fFf" class="app-bg">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-avatar class="q-ml-sm">
          <img class="header-logo" src="../images/logo-sena.png" alt="Logo SENA">
        </q-avatar>

        <q-toolbar-title>
          <div class="text-weight-bold text-subtitle1">GCCON-F-088</div>
          <div class="text-caption">Sistema de Gestión de Firmas Digitales</div>
        </q-toolbar-title>

        <q-btn flat round dense icon="notifications" class="q-mr-sm" title="Notificaciones" @click="router.push('/app/notificaciones')" />

        <q-btn-dropdown flat no-caps color="white" icon="account_circle" :label="auth.nombre || 'usuario'">
          <q-list>
            <q-item clickable @click="router.push('/app/perfil')">
              <q-item-section>
                <q-item-label>Mi perfil</q-item-label>
                <q-item-label caption>{{ auth.rol }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable @click="cerrarSesion">
              <q-item-section>
                <q-item-label class="text-negative">Cerrar sesión</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="250" class="bg-primary">
      <div class="sidenav-user">
        <q-avatar color="white" text-color="primary" size="44px">
          <q-icon name="person" />
        </q-avatar>
        <div class="col">
          <div class="text-white text-weight-bold ellipsis">{{ auth.nombre || 'Usuario' }}</div>
          <div class="text-white text-caption">{{ auth.rol }}</div>
        </div>
      </div>

      <q-list class="sidenav-list">
        <q-item
          v-for="item in menuItems"
          :key="item.path"
          clickable
          :active="route.path === item.path"
          active-class="sidenav-active"
          @click="router.push(item.path)"
        >
          <q-item-section avatar>
            <q-icon :name="item.icono" />
          </q-item-section>
          <q-item-section>
            <span class="text-body1">{{ item.titulo }}</span>
          </q-item-section>
        </q-item>

        <q-separator color="white" class="opacity-30 q-my-sm" />

        <q-item clickable @click="cerrarSesion">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <span class="text-body1">Salir</span>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="page-shell">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const leftDrawerOpen = ref(true)
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const todos = [
  { path: '/app', titulo: 'Inicio', icono: 'home', roles: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'] },
  { path: '/app/supervisores', titulo: 'Supervisores', icono: 'supervisor_account', roles: ['Administrador'] },
  { path: '/app/contratistas', titulo: 'Contratistas', icono: 'badge', roles: ['Administrador', 'Supervisor'] },
  { path: '/app/usuarios', titulo: 'Usuarios', icono: 'group', roles: ['Administrador', 'Supervisor'] },
  { path: '/app/contratos', titulo: 'Contratos', icono: 'description', roles: ['Administrador', 'Supervisor', 'Contratista'] },
  { path: '/app/dependencias', titulo: 'Dependencias', icono: 'business', roles: ['Administrador', 'Supervisor'] },
  { path: '/app/solicitudes', titulo: 'Solicitudes', icono: 'assignment', roles: ['Administrador', 'Supervisor', 'Contratista', 'ResponsableArea'] },
  { path: '/app/reportes', titulo: 'Reportes', icono: 'bar_chart', roles: ['Administrador'] },
  { path: '/app/perfil', titulo: 'Perfil', icono: 'person', roles: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'] },
  { path: '/app/notificaciones', titulo: 'Notificaciones', icono: 'notifications', roles: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'] }
]

const menuItems = computed(() => {
  const rol = auth.rol
  return todos.filter((item) => item.roles.includes(rol))
})

function cerrarSesion() {
  auth.logout()
  window.location.hash = '#/'
  window.location.reload()
}
</script>

<style scoped>
.header-logo {
  filter: brightness(0) invert(1);
  width: 34px;
  height: auto;
}

.sidenav-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidenav-list .q-item {
  color: #ffffff;
  min-height: 48px;
}

.sidenav-active {
  background-color: rgba(255, 255, 255, 0.18);
}

.app-bg {
  background:
    repeating-linear-gradient(
      135deg,
      rgba(57, 169, 0, 0.04) 0px,
      rgba(57, 169, 0, 0.04) 24px,
      rgba(255, 255, 255, 0) 24px,
      rgba(255, 255, 255, 0) 48px
    ),
    linear-gradient(135deg, #edf0ef 0%, #f7f8f7 50%, #e6ebe8 100%);
}

.page-shell {
  min-height: calc(100vh - 56px);
}
</style>
