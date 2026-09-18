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
            nombre: 'Ing. Carlos Supervisor',
            correo: 'supervisor@gccon.com',
            telefono: '3101234567',
            cargo: 'Supervisor de Contratos TIC',
            password: '123',
          },
          {
            documento: '1097654321',
            nombre: 'Dra. Ana María Gómez',
            correo: 'agomez@sena.edu.co',
            telefono: '3187654321',
            cargo: 'Supervisora Senior de Contratación',
            password: '123',
          },
          {
            documento: '1096543219',
            nombre: 'Ing. Fernando Ramírez',
            correo: 'f.ramirez@sena.edu.co',
            telefono: '3209876543',
            cargo: 'Supervisor de Infraestructura y Obras',
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
