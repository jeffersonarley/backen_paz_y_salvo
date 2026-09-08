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

      <q-form @submit.prevent="ingresar" class="q-gutter-y-xs">
        <!-- Selector de Rol -->
        <q-select
          v-model="rolSeleccionado"
          :options="opcionesRoles"
          option-label="label"
          outlined
          dense
          label="Seleccionar Tipo de Usuario / Rol *"
          class="q-mb-md"
          @update:model-value="alCambiarRol"
        >
          <template #prepend>
            <q-icon
              :name="rolSeleccionado ? rolSeleccionado.icon : 'account_circle'"
              color="positive"
            />
          </template>

          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon :name="scope.opt.icon" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.descripcion }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Campo Credencial -->
        <q-input
          v-model="credencial"
          outlined
          dense
          label="Correo o Documento de Identidad *"
          class="q-mb-md"
          :rules="[val => !!val || 'El correo o documento es requerido']"
        >
          <template #prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <!-- Campo Contraseña -->
        <q-input
          v-model="password"
          outlined
          dense
          :type="verPassword ? 'text' : 'password'"
          label="Contraseña *"
          class="q-mb-lg"
          :rules="[val => !!val || 'La contraseña es requerida']"
        >
          <template #prepend>
            <q-icon name="lock" />
          </template>
          <template #append>
            <q-icon
              :name="verPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="verPassword = !verPassword"
            />
          </template>
        </q-input>

        <q-btn
          type="submit"
          color="positive"
          label="Iniciar sesión"
          class="full-width boton"
          unelevated
          :loading="cargando"
        />
      </q-form>

      <div class="texto-footer">
        Servicio Nacional de Aprendizaje - SENA
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import logoSena from '../images/logo-sena.png'

const router = useRouter()

const rolSeleccionado = ref(null)
const credencial = ref('')
const password = ref('')
const verPassword = ref(false)
const cargando = ref(false)

const opcionesRoles = [
  {
    label: 'Administrador',
    value: 'ADMINISTRADOR',
    correo: 'admin@gccon.com',
    pass: 'admin',
    icon: 'admin_panel_settings',
    descripcion: 'Gestión global y supervisores'
  },
  {
    label: 'Supervisor',
    value: 'SUPERVISOR',
    correo: 'supervisor@gccon.com',
    pass: 'super',
    icon: 'supervisor_account',
    descripcion: 'Gestión de contratistas y dependencias'
  },
  {
    label: 'Contratista',
    value: 'CONTRATISTA',
    correo: 'carlos.mendoza@email.com',
    pass: '123',
    icon: 'person',
    descripcion: 'Registro de contrato y solicitud'
  },
  {
    label: 'Responsable de Área',
    value: 'RESPONSABLE_AREA',
    correo: 'responsable@gccon.com',
    pass: '123',
    icon: 'draw',
    descripcion: 'Aprobación y firma electrónica'
  }
]

function alCambiarRol(opcion) {
  if (opcion) {
    credencial.value = opcion.correo
    password.value = opcion.pass
  }
}

function ingresar() {
  if (!credencial.value || !password.value) return
  
  cargando.value = true

  const rolFinal = rolSeleccionado.value ? rolSeleccionado.value.value : 'ADMINISTRADOR'
  const nombreFinal = rolSeleccionado.value ? rolSeleccionado.value.label : 'Usuario'

  const usuarioSesion = {
    nombre: nombreFinal,
    correo: credencial.value,
    rol: rolFinal
  }

  localStorage.setItem('gccon_user', JSON.stringify(usuarioSesion))

  // Notificación opcional (con import directo)
 try {
    Notify.create({
      type: 'positive',
      icon: 'check_circle',
      message: 'Inicio de sesión exitoso',
      position: 'top-right'
    })
  } catch {
    // Si la notificación falla por configuración, continúa con la navegación de todos modos
  }
  // Redirección inmediata al panel principal
  router.push('/app').catch(() => {
    window.location.hash = '#/app'
  })
}
</script>

<style scoped>
.login-page {
  background: #f4f7f4;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 400px;
  padding: 35px 30px;
  border-radius: 18px;
  text-align: center;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
}

.logo {
  display: block;
  width: 95px;
  margin: 0 auto 12px;
}

.titulo {
  color: #39A900;
  margin: 0 0 4px 0;
  font-weight: bold;
  font-size: 1.6rem;
}

.subtitulo {
  color: #757575;
  margin-bottom: 22px;
  font-size: 0.95rem;
}

.boton {
  height: 44px;
  font-weight: bold;
  font-size: 0.95rem;
  border-radius: 8px;
}

.texto-footer {
  margin-top: 25px;
  color: #888;
  font-size: 11px;
}
</style>