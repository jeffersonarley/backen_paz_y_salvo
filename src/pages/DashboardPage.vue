<template>

  <q-page class="q-pa-lg">

   <div class="text-h4 text-primary text-weight-bold">
  👋 Bienvenido
</div>

<div class="text-h6 q-mt-sm">
  Sistema GCCON-F-088
</div>

<div class="text-grey">
  Paz y Salvo Contractual
</div>

<div class="text-grey q-mb-xl">
  {{ fechaActual }}
</div>

    <div class="row q-col-gutter-lg">

      <div class="col-12 col-sm-6 col-md-3">

        <DashboardCard
          titulo="Usuarios"
          :cantidad="0"
          icono="groups"
        />

      </div>

      <div class="col-12 col-sm-6 col-md-3">

        <DashboardCard
          titulo="Contratistas"
          :cantidad="0"
          icono="badge"
        />

      </div>

      <div class="col-12 col-sm-6 col-md-3">

        <DashboardCard
          titulo="Dependencias"
          :cantidad="0"
          icono="business"
        />

      </div>

      <div class="col-12 col-sm-6 col-md-3">

        <DashboardCard
          titulo="Firmas"
          :cantidad="0"
          icono="draw"
        />

      </div>

    </div>
     <div class="q-mt-xl">

  <q-card flat bordered>

    <q-card-section>

      <div class="text-h6">
        Actividad reciente
      </div>

      <div class="text-grey q-mt-md">
        No existen solicitudes registradas por el momento.
      </div>

    </q-card-section>

  </q-card>

</div> 
  </q-page>

</template>

<script setup>

import DashboardCard from '../components/DashboardCard.vue'

const fecha = new Date()

const fechaActual = fecha.toLocaleDateString('es-CO', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})
</script>