import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDependenciasStore = defineStore('dependencias', () => {
  const dependencias = ref([
    {
      codigo: 'DEP-01',
      nombre: 'Gestión Tecnológica (TIC)',
      responsable: 'Ing. Roberto TIC',
      correo: 'area.tic@gccon.com',
      estado: 'Activa',
    },
    {
      codigo: 'DEP-02',
      nombre: 'Almacén e Inventarios',
      responsable: 'Lic. Martha Almacén',
      correo: 'area.almacen@gccon.com',
      estado: 'Activa',
    },
    {
      codigo: 'DEP-03',
      nombre: 'Recursos Humanos / Talento Humano',
      responsable: 'Dra. Claudia Ramos',
      correo: 'rrhh@sena.edu.co',
      estado: 'Activa',
    },
    {
      codigo: 'DEP-04',
      nombre: 'Infraestructura y Servicios Generales',
      responsable: 'Ing. Fernando Ramírez',
      correo: 'infraestructura@sena.edu.co',
      estado: 'Activa',
    },
    {
      codigo: 'DEP-05',
      nombre: 'Biblioteca y Archivo',
      responsable: 'Lic. Jorge Biblioteca',
      correo: 'biblioteca@sena.edu.co',
      estado: 'Activa',
    },
    {
      codigo: 'DEP-06',
      nombre: 'Bienestar al Aprendiz y Comunidad',
      responsable: 'Dra. Patricia Valenzuela',
      correo: 'bienestar@sena.edu.co',
      estado: 'Activa',
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
