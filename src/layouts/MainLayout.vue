<template>
  <q-layout view="lHh Lpr lFf">

    <!-- Barra superior -->
    <q-header elevated class="bg-primary text-white">

      <q-toolbar>

        <q-btn
          flat
          dense
          round
          icon="menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-avatar class="q-ml-md">
          <img src="../images/logo-sena.png" alt="Logo SENA">
        </q-avatar>

        <q-toolbar-title>

          <div class="text-weight-bold">
            GCCON-F-088
          </div>

          <div class="text-caption">
            Paz y Salvo Contractual
          </div>

        </q-toolbar-title>

        <q-btn
          flat
          round
          icon="account_circle"
        />

      </q-toolbar>

    </q-header>

    <!-- Menú lateral -->

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="250"
    >

      <q-list>

        <q-item-label
          header
          class="text-primary"
        >
          MENÚ
        </q-item-label>

        <q-item 
          clickable
          @click="router.push('/app')"
        >

          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>

          <q-item-section>
            Dashboard
          </q-item-section>

        </q-item>

        <q-item
          clickable
          @click="router.push('/app/usuarios')"
          >

          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>

          <q-item-section>
            Usuarios
          </q-item-section>

        </q-item>
        <q-item
  clickable
  @click="router.push('/app/supervisores')"
>

  <q-item-section avatar>
    <q-icon name="supervisor_account" />
  </q-item-section>

  <q-item-section>
    Supervisores
  </q-item-section>

</q-item>

        <q-item
          clickable
          @click="router.push('/app/contratistas')"
          >

          <q-item-section avatar>
            <q-icon name="description" />
          </q-item-section>

          <q-item-section>
            Contratistas
          </q-item-section>

        </q-item>

        <q-item
          clickable
          @click="router.push('/app/dependencias')"
          >

          <q-item-section avatar>
            <q-icon name="business" />
          </q-item-section>

          <q-item-section>
            Dependencias
          </q-item-section>

        </q-item>

        <q-item 
          clickable
           @click="router.push('/app/firmas')"
          >

          <q-item-section avatar>
            <q-icon name="draw" />
          </q-item-section>

          <q-item-section>
            Firmas
          </q-item-section>

        </q-item>

        <q-item
          clickable
          @click="router.push('/app/perfil')"
         >

          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>

          <q-item-section>
            Perfil
          </q-item-section>

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
</script>