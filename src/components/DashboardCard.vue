<template>
  <q-card 
    class="dashboard-card bg-white" 
    bordered
  >

    <q-card-section class="row items-center justify-between">

      <div>

        <div class="text-grey-7 text-subtitle2">
          {{ titulo }}
        </div>

        <div class="text-h4 text-weight-bold">
          {{ cantidad }}
        </div>

      </div>

      <q-icon
        :name="icono"
        size="55px"
        color="primary"
      />

    </q-card-section>

  </q-card>
</template>

<script setup>

defineProps({
  titulo: String,
  cantidad: Number,
  icono: String
})

</script>

<style scoped>

.dashboard-card{

    border-radius:18px;
    transition:.3s;
    cursor:pointer;

}

.dashboard-card:hover{

    transform:translateY(-6px);
    box-shadow:0 12px 25px rgba(0,0,0,.18);

}

</style>