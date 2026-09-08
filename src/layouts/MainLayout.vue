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
          <img class="header-logo" src="../images/logo-sena.png" alt="Logo SENA">
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
        <q-item-label header class="text-primary text-weight-bold">
          MENÚ PRINCIPAL
        </q-item-label>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'dashboard' }"
          exact
          active-class="text-primary text-weight-bold bg-green-1"
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'usuarios' }"
          active-class="text-primary text-weight-bold bg-green-1"
        >
          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>
          <q-item-section>Usuarios</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'contratistas' }"
          active-class="text-primary text-weight-bold bg-green-1"
        >
          <q-item-section avatar>
            <q-icon name="description" />
          </q-item-section>
          <q-item-section>Contratistas</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'dependencias' }"
          active-class="text-primary text-weight-bold bg-green-1"
        >
          <q-item-section avatar>
            <q-icon name="business" />
          </q-item-section>
          <q-item-section>Dependencias</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'solicitudes' }"
          active-class="text-primary text-weight-bold bg-green-1"
        >
          <q-item-section avatar>
            <q-icon name="assignment" />
          </q-item-section>
          <q-item-section>Solicitudes</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'firmas' }"
          active-class="text-primary text-weight-bold bg-green-1"
        >
          <q-item-section avatar>
            <q-icon name="draw" />
          </q-item-section>
          <q-item-section>Firmas</q-item-section>
        </q-item>

        <q-separator class="q-my-sm" />

        <q-item
          clickable
          v-ripple
          :to="{ name: 'perfil' }"
          active-class="text-primary text-weight-bold bg-green-1"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const leftDrawerOpen = ref(true)
const router = useRouter()

function cerrarSesion() {
  localStorage.clear()
  sessionStorage.clear()
  router.push('/')
}
</script>

<style scoped>
.header-logo {
  filter: brightness(0) invert(1);
  width: 36px;
  height: auto;
}

/* Reglas definitivas para impresión y PDF */

</style>