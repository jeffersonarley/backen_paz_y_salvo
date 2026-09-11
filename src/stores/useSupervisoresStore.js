import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSupervisoresStore = defineStore('supervisores', () => {
  const guardados = localStorage.getItem('supervisores_f088')

  const supervisores = ref(
    guardados
      ? JSON.parse(guardados)
      : [
          {
            documento: '1098765432',
            nombre: 'Ana María Gómez',
            correo: 'agomez@sena.edu.co',
            telefono: '3101234567',
            password: '123',
          },
        ],
  )

  watch(
    supervisores,
    (nuevos) => {
      localStorage.setItem('supervisores_f088', JSON.stringify(nuevos))
    },
    { deep: true },
  )

  function agregar(nuevo) {
    supervisores.value.push({ ...nuevo })
  }

  function editar(index, datos) {
    if (index !== -1 && index < supervisores.value.length) {
      supervisores.value[index] = { ...datos }
    }
  }

  function eliminar(documento) {
    supervisores.value = supervisores.value.filter((s) => s.documento !== documento)
  }

  return {
    supervisores,
    agregar,
    editar,
    eliminar,
  }
})
