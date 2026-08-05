import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDependenciasStore = defineStore('dependencias', () => {

  const dependencias = ref([])

  function agregar(dependencia) {
    dependencias.value.push(dependencia)
  }

  function editar(index, dependencia) {
    dependencias.value[index] = dependencia
  }

  function eliminar(codigo) {
    dependencias.value = dependencias.value.filter(
      d => d.codigo !== codigo
    )
  }

  return {
    dependencias,
    agregar,
    editar,
    eliminar
  }

}, {
  persist: true
})