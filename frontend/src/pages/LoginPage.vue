<template>
  <q-layout view="lHh LpR lFf">
    <q-page-container>
      <q-page class="login-page flex flex-center bg-primary">
        <q-card class="login-card q-pa-md" style="min-width: 360px">
          <q-card-section class="text-center">
            <q-icon name="school" color="primary" size="56px" />
            <div class="text-h5 text-primary text-weight-bold q-mt-sm">
              Paz y Salvo SENA
            </div>
            <div class="text-subtitle2 text-grey-7">Inicio de sesión</div>
          </q-card-section>

          <q-card-section>
            <q-form ref="formRef" class="q-gutter-md" @submit.prevent="onSubmit">
              <q-select
                v-model="rolSeleccionado"
                label="Rol"
                outlined
                dense
                emit-value
                map-options
                :options="rolesOptions"
                clearable
              >
                <template #prepend>
                  <q-icon name="badge" />
                </template>
              </q-select>

              <q-input
                v-model="form.correo_institucional"
                type="email"
                label="Correo institucional"
                outlined
                dense
                lazy-rules
                autocomplete="username"
                :rules="[
                  (val) => (val && val.length > 0) || 'El correo es obligatorio',
                  (val) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val) || 'Correo inválido'
                ]"
              >
                <template #prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                label="Contraseña"
                outlined
                dense
                lazy-rules
                autocomplete="current-password"
                :rules="[(val) => (val && val.length > 0) || 'La contraseña es obligatoria']"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <q-btn
                type="submit"
                color="primary"
                label="Ingresar"
                class="full-width"
                unelevated
                no-caps
                :loading="loading"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { login } from '@/services/authService'
import { getErrorMessage } from '@/services/axios'
import { ROL, ROL_LABELS } from '@/constants/roles'
import { CUENTAS_DEMO } from '@/constants/demoAccounts'

const $q = useQuasar()
const router = useRouter()

const formRef = ref(null)
const form = ref({
  correo_institucional: '',
  password: ''
})
const showPassword = ref(false)
const loading = ref(false)

const rolesOptions = Object.values(ROL).map((rol) => ({
  label: ROL_LABELS[rol],
  value: rol
}))

const rolSeleccionado = ref(null)

watch(rolSeleccionado, (rol) => {
  const cuenta = CUENTAS_DEMO[rol]
  if (cuenta) {
    form.value.correo_institucional = cuenta.correo
    form.value.password = cuenta.password
  } else {
    form.value.correo_institucional = ''
    form.value.password = ''
  }
})

async function onSubmit() {
  const valido = await formRef.value.validate()
  if (!valido) return

  loading.value = true
  try {
    await login({ ...form.value })
    $q.notify({
      type: 'positive',
      message: 'Inicio de sesión exitoso.'
    })
    router.push({ name: 'dashboard' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'No se pudo iniciar sesión.')
    })
  } finally {
    loading.value = false
  }
}
</script>
