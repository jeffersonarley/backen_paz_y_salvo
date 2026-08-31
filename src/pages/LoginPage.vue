<template>
  <!-- Paso 1: Elije un usuario (rol) -->
  <div v-if="paso === 'seleccion'" class="select-wrap">
    <aside class="select-lado-b">
      <img src="../images/logo-sena.png" alt="SENA" class="select-logo-b">
    </aside>

    <main class="select-lado-c">
      <div class="select-card">
        <h4 class="select-brand">GCCON-F-088</h4>
        <p class="select-brand-sub">Paz y Salvo Contractual</p>

        <div class="select-heading">Iniciar Sesión</div>
        <div class="select-question">Elije un Usuario</div>

        <q-select
          v-model="rolSeleccionado"
          :options="rolesOptions"
          outlined
          dense
          bg-color="white"
          hide-bottom-space
          class="select-dropdown"
          emit-value
          map-options
          :readonly="cargando"
        />

        <q-btn
          color="primary"
          no-caps
          label="CONTINUAR"
          class="full-width continuar"
          @click="continuar"
        />

        <div class="select-footer">© SENA 2026 - Sistema GCCON-F-088</div>
      </div>
    </main>
  </div>

  <!-- Paso 2: credenciales -->
  <div v-else class="login-wrap">
    <div class="login-bg" :style="{ backgroundImage: `url(${loginBg})` }"></div>

    <!-- Columna izquierda: marca institucional -->
    <aside class="lado-info">
      <div class="logo-circle">
        <img src="../images/logo-sena.png" alt="Logo SENA">
      </div>

      <div class="texto-grupo">
        <p class="t1">Programa de Gestión de Firmas GCCON-F-088</p>
        <p class="t2">Ingreso de {{ rolLabel }}</p>
        <a class="link" href="#" @click.prevent="router.push('/recuperar')">Recuperar mi Contraseña</a>
        <a class="link" href="#" @click.prevent>Soporte</a>
      </div>

      <p class="copy">© SENA 2026</p>
    </aside>

    <!-- Columna derecha: formulario -->
    <main class="lado-form">
      <div class="form-card">
        <h4 class="brand">GCCON-F-088</h4>
        <p class="brand-sub">Paz y Salvo Contractual</p>

        <div v-if="errorMsj" class="error-banner">
          <q-icon name="warning_amber" size="sm" />
          <span>{{ errorMsj }}</span>
        </div>

        <div class="campo">
          <label>Correo institucional</label>
          <q-input
            v-model="correo"
            outlined
            dense
            type="email"
            :disable="cargando"
            hide-bottom-space
            bg-color="white"
            class="caja"
            placeholder="Ingresa tu correo institucional"
            :error="Boolean(errores.correo)"
            @keyup.enter="ingresar"
            @input="errores.correo = ''"
          >
            <template #prepend>
              <q-icon name="mail_outline" />
            </template>
          </q-input>
          <div v-if="errores.correo" class="campo-error">{{ errores.correo }}</div>
        </div>

        <div class="campo">
          <label>Contraseña</label>
          <q-input
            v-model="password"
            outlined
            dense
            :type="mostrar ? 'text' : 'password'"
            :disable="cargando"
            hide-bottom-space
            bg-color="white"
            class="caja"
            placeholder="Ingresa tu contraseña"
            :error="Boolean(errores.password)"
            @keyup.enter="ingresar"
            @input="errores.password = ''"
          >
            <template #prepend>
              <q-icon name="lock_outline" />
            </template>
            <template #append>
              <q-icon :name="mostrar ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="mostrar = !mostrar" />
            </template>
          </q-input>
          <div v-if="errores.password" class="campo-error">{{ errores.password }}</div>
        </div>

        <div class="link-olvido" @click="router.push('/recuperar')">¿Olvidó su contraseña?</div>

        <q-btn
          color="primary"
          no-caps
          label="Iniciar Sesión"
          class="full-width boton"
          :loading="cargando"
          @click="ingresar"
        />
      </div>
    </main>

    <q-btn class="back-fab" round unelevated color="primary" icon="arrow_back" @click="volverSeleccion" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import loginBg from '../images/login-bg.jpg'

const router = useRouter()
const auth = useAuthStore()

const roles = [
  { valor: 'Administrador', label: 'Administrador', icono: 'admin_panel_settings' },
  { valor: 'Supervisor', label: 'Supervisor', icono: 'supervisor_account' },
  { valor: 'ResponsableArea', label: 'Responsable de Área', icono: 'badge' },
  { valor: 'Contratista', label: 'Contratista', icono: 'person' }
]

const rolesOptions = roles.map((r) => ({ label: r.label, value: r.valor }))

const paso = ref('seleccion')
const rolSeleccionado = ref('Administrador')
const correo = ref('')
const password = ref('')
const mostrar = ref(false)
const cargando = ref(false)
const errorMsj = ref('')
const errores = ref({ correo: '', password: '' })

const rolLabel = computed(
  () => roles.find((r) => r.valor === rolSeleccionado.value)?.label || rolSeleccionado.value || 'Usuario'
)

function continuar() {
  if (!rolSeleccionado.value) return
  paso.value = 'credenciales'
}

function volverSeleccion() {
  paso.value = 'seleccion'
  errorMsj.value = ''
  errores.value = { correo: '', password: '' }
}

function limpiarErrores() {
  errores.value = { correo: '', password: '' }
  errorMsj.value = ''
}

async function ingresar() {
  limpiarErrores()
  let hayError = false
  if (!correo.value.trim()) {
    errores.value.correo = 'El correo es obligatorio'
    hayError = true
  }
  if (!password.value) {
    errores.value.password = 'La contraseña es obligatoria'
    hayError = true
  }
  if (hayError) {
    errorMsj.value = 'Completa todos los campos obligatorios.'
    return
  }
  cargando.value = true
  try {
    await auth.login({
      correo_institucional: correo.value.trim(),
      password: password.value
    })
    router.push('/app')
  } catch (error) {
    const msg = error.mensaje || error.response?.data?.mensaje || 'El correo o la contraseña son incorrectos.'
    const esBloqueo = /intento|bloquead/i.test(msg)
    errorMsj.value = esBloqueo
      ? 'Ha superado el número máximo de intentos. Intente nuevamente más tarde.'
      : 'El correo o la contraseña son incorrectos'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
/* ---------- Paso 1: selector de usuario ---------- */
.select-wrap {
  min-height: 100vh;
  display: flex;
  background:
    radial-gradient(circle at 80% 30%, rgba(122, 117, 117, 0.6), rgba(255, 255, 255, 0) 50%),
    linear-gradient(135deg, #eef1f0 0%, #f6f8f7 45%, #e7ecea 100%);
}

.select-lado-b {
  flex: 0 0 26%;
  background: linear-gradient(160deg, #46b900 0%, #39a900 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.select-logo-b {
  width: 180px;
  height: auto;
  filter: brightness(0) invert(1);
}

.select-lado-c {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.select-card {
  width: 100%;
  max-width: 720px;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 24px;
  padding: 48px 80px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
  text-align: center;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.select-brand {
  color: #2f8c00;
  font-size: 34px;
  font-weight: 700;
  margin: 0;
}

.select-brand-sub {
  color: #4a4a4a;
  font-size: 18px;
  margin: 6px 0 30px;
}

.select-heading {
  font-size: 26px;
  font-weight: 700;
  color: #1b1b1b;
}

.select-question {
  color: #6b7280;
  font-size: 17px;
  margin: 10px 0 22px;
}

.select-dropdown :deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
  min-height: 54px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
}

.select-dropdown :deep(.q-field__control) {
  background: #ffffff;
  font-size: 18px;
}

.continuar {
  margin-top: 32px;
  height: 52px;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 16px;
  border-radius: 10px;
}

.select-footer {
  margin-top: 34px;
  color: #1b1b1b;
  font-size: 14px;
}

@media (max-width: 860px) {
  .select-lado-b {
    display: none;
  }

  .select-card {
    padding: 40px 28px;
  }

  .select-wrap {
    padding: 24px;
  }
}

/* ---------- Paso 2: credenciales ---------- */
.login-wrap {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
}

.login-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.login-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(252, 252, 252, 0.337);
  backdrop-filter: blur(26px) brightness(1.08);
}

.lado-info {
  position: relative;
  z-index: 2;
  flex: 1 1 32%;
  display: flex;
  flex-direction: column;
  padding: 48px 40px;
  background: #52b122;
}

.logo-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-circle img {
  width: 105px;
  height: auto;
}

.texto-grupo {
  margin-top: auto;
  margin-bottom: auto;
}

.t1 {
  font-size: 23px;
  font-weight: 500;
  color: #1b1b1b;
  line-height: 1.4;
  margin: 0;
}

.t2 {
  font-size: 19px;
  color: #1b1b1b;
  margin: 18px 0 26px;
}

.link {
  display: block;
  color: #6d4aff;
  font-size: 16px;
  margin-bottom: 16px;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.copy {
  color: #1b1b1b;
  font-size: 14px;
}

.lado-form {
  position: relative;
  z-index: 2;
  flex: 1 1 68%;
  padding: 20px;
  display: flex;
}

.form-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 24px;
  padding: 0 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
}

.brand {
  color: #2f8c00;
  font-size: 36px;
  font-weight: 700;
  margin: 0;
  text-align: center;
}

.brand-sub {
  color: #4a4a4a;
  font-size: 18px;
  margin: 8px 0 40px;
  text-align: center;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fdecea;
  color: #c62828;
  border: 1px solid #f5c6c0;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  margin-bottom: 22px;
}

.campo {
  margin-bottom: 26px;
}

.campo label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #2b2b2b;
  margin-bottom: 10px;
  letter-spacing: 0.4px;
  text-align: left;
}

.campo-error {
  color: #e53935;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  margin-top: 8px;
}

.caja :deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
  min-height: 54px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
}

.caja :deep(.q-field__control) {
  background: #ffffff;
}

.link-olvido {
  color: #1565c0;
  font-size: 14px;
  text-align: right;
  margin: -12px 0 18px;
  cursor: pointer;
}

.link-olvido:hover {
  text-decoration: underline;
}

.boton {
  margin-top: 6px;
  height: 54px;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.8px;
  border-radius: 10px;
}

.back-fab {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 3;
  width: 58px;
  height: 58px;
}

@media (max-width: 860px) {
  .lado-info {
    display: none;
  }

  .lado-form {
    padding: 14px;
  }

  .form-card {
    padding: 0 32px;
  }
}
</style>