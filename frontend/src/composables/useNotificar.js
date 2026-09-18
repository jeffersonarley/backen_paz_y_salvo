/**
 * @fileoverview /composables/useNotificar.js
 * Composable = funcion que empieza por "use" y encapsula logica reutilizable de
 * la Composition API. Solo se puede llamar DENTRO de <script setup> (o de otro
 * composable), porque usa useQuasar(), que necesita el contexto del componente.
 *
 * Centraliza como se le avisa al usuario para que todas las pantallas
 * (Solicitudes, Contratistas, Usuarios, etc.) muestren los mensajes igual,
 * en vez de repetir Notify.create({...}) en cada archivo.
 */
import { useQuasar } from 'quasar'

export function useNotificar() {
  const $q = useQuasar()

  /**
   * Mensaje de exito (verde).
   * @param {string} mensaje - normalmente el "msg" que devuelve el backend
   */
  const notificarOk = (mensaje) => {
    $q.notify({ type: 'positive', message: mensaje, icon: 'check_circle' })
  }

  /**
   * Mensaje de error (rojo).
   * Acepta tanto un texto plano como el objeto de error de axios
   * (error.response.data.msg / .errors), para no obligar a cada pantalla a
   * desarmarlo a mano.
   *
   * @param {string|Error|{response?: {data?: {msg?: string, errors?: Array}}}} error
   */
  const notificarError = (error) => {
    if (typeof error === 'string') {
      $q.notify({ type: 'negative', message: error, icon: 'error' })
      return
    }

    const data = error?.response?.data
    const detalle = Array.isArray(data?.errors)
      ? data.errors.map((e) => e.msg || e.message || e).join(' · ')
      : ''

    $q.notify({
      type: 'negative',
      icon: 'error',
      message: data?.msg || error?.message || 'Ocurrió un error inesperado',
      caption: detalle,
      timeout: detalle ? 5000 : 3000,
    })
  }

  /**
   * Aviso informativo (azul).
   * @param {string} mensaje
   */
  const notificarInfo = (mensaje) => {
    $q.notify({ type: 'info', message: mensaje, icon: 'info' })
  }

  return { notificarOk, notificarError, notificarInfo }
}
