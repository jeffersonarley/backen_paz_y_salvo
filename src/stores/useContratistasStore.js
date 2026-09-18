import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useContratistasStore = defineStore('contratistas', () => {
  const contratistas = ref([
    {
      documento: '1098765432',
      nombre: 'Juan Carlos Pérez Gómez',
      correo: 'juan.perez@correo.com',
      telefono: '3101234567',
      cargo: 'Desarrollador Full-Stack Senior',
      password: '123',
    },
    {
      documento: '1095432189',
      nombre: 'Laura Andrea Contratista',
      correo: 'contratista@gccon.com',
      telefono: '3157654321',
      cargo: 'Especialista en Soporte Informático',
      password: '123',
    },
    {
      documento: '1094321765',
      nombre: 'María Fernanda Gómez Ruiz',
      correo: 'maria.gomez@correo.com',
      telefono: '3207654321',
      cargo: 'Instructora Contratista en Telemática',
      password: '123',
    },
    {
      documento: '1097890123',
      nombre: 'Carlos Eduardo Mendoza',
      correo: 'carlos.mendoza@email.com',
      telefono: '3119876543',
      cargo: 'Consultor en Redes y Telecomunicaciones',
      password: '123',
    },
    {
      documento: '1096543210',
      nombre: 'Diego Morales Castro',
      correo: 'diego.morales@correo.com',
      telefono: '3171234567',
      cargo: 'Técnico de Mantenimiento de Hardware',
      password: '123',
    },
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
    contratistas.value = contratistas.value.filter((item) => item.documento !== documento)
  }

  return {
    contratistas,
    agregar,
    editar,
    eliminar,
  }
})
