import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDependenciasStore = defineStore('dependencias', () => {
  const dependencias = ref([
    {
      codigo: 'DEP-01',
      nombre: 'Gestión Tecnológica',
      responsable: 'Carlos Mendoza',
      correo: 'tecnologia@sena.edu.co',
      estado: 'Activa',
    },
    {
      codigo: 'DEP-02',
      nombre: 'Recursos Humanos',
      responsable: 'Ana María López',
      correo: 'rrhh@sena.edu.co',
      estado: 'Activa',
    },
    {
      codigo: 'DEP-03',
      nombre: 'Infraestructura y Servicios Generales',
      responsable: 'Roberto Silva',
      correo: 'infraestructura@sena.edu.co',
      estado: 'Inactiva',
    },
  ])

  function agregar(nuevaDependencia) {
    dependencias.value.push(nuevaDependencia)
  }

  function editar(indice, datosActualizados) {
    if (indice !== -1 && indice < dependencias.value.length) {
      dependencias.value[indice] = datosActualizados
    }
  }

  function eliminar(codigo) {
    dependencias.value = dependencias.value.filter((item) => item.codigo !== codigo)
  }

  return {
    dependencias,
    agregar,
    editar,
    eliminar,
  }
})
