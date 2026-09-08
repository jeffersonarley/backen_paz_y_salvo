import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useContratistasStore = defineStore('contratistas', () => {
  const contratistas = ref([
    {
      documento: '1098765432',
      nombre: 'Juan Carlos Pérez',
      correo: 'juan.perez@correo.com',
      telefono: '3101234567',
      password: 'password123'
    },
    {
      documento: '1095432189',
      nombre: 'María Fernanda Gómez',
      correo: 'maria.gomez@correo.com',
      telefono: '3207654321',
      password: 'password123'
    }
  ])

  function agregar(nuevoContratista) {
    contratistas.value.push(nuevoContratista)
  }

  function editar(indice, datosActualizados) {
    if (indice !== -1 && indice < contratistas.value.length) {
      contratistas.value[indice] = datosActualizados
    }
  }

  function eliminar(documento) {
    contratistas.value = contratistas.value.filter(
      item => item.documento !== documento
    )
  }

  return {
    contratistas,
    agregar,
    editar,
    eliminar
  }
})
