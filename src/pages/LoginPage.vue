<template>
  <q-page class="login-page">

    <q-card class="login-card">

      <img
        :src="logoSena"
        class="logo"
        alt="Logo SENA"
      >

      <h4 class="titulo">
        Sistema GCCON-F-088
      </h4>

      <p class="subtitulo">
        Paz y Salvo Contractual
      </p>

      <q-input
        outlined
        label="Documento de identidad"
        class="q-mb-md"
      >
        <template #prepend>
          <q-icon name="badge" />
        </template>
      </q-input>

      <q-input
        outlined
        type="password"
        label="Contraseña"
        class="q-mb-lg"
      >
        <template #prepend>
          <q-icon name="lock" />
        </template>
      </q-input>

      <q-btn
        color="positive"
        label="Iniciar sesión"
        class="full-width boton"
        @click="ingresar"
      />

      <div class="texto-footer">
        Servicio Nacional de Aprendizaje - SENA
      </div>

    </q-card>

  </q-page>
</template>

<script setup>
import logoSena from '../images/logo-sena.png'
import { useRouter } from 'vue-router'

const router = useRouter()

function ingresar() {
  router.push('/app')
}
</script>

<style scoped>

.login-page{
    background:#f4f7f4;
    height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
}

.login-card{
    width:420px;
    padding:40px;
    border-radius:18px;
    text-align:center;
    box-shadow:0 15px 40px rgba(0,0,0,.15);
}

.logo{
    display: block;
    width:120px;
    margin:0 auto 20px;
}

.titulo{
    color:#39A900;
    margin-bottom:8px;
    font-weight:bold;
}

.subtitulo{
    color:#757575;
    margin-bottom:30px;
}

.boton{
    height:45px;
    font-weight:bold;
}

.texto-footer{
    margin-top:25px;
    color:#888;
    font-size:12px;
}

</style>