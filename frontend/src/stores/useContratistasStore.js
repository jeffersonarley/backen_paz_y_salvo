import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/axios'

export const useContratistasStore = defineStore('contratistas', () => {
  const contratistas = ref([])
  const cargando = ref(false)

  function mapear(u) {
    const id = u._id || u.id
    return {
      _id: id,
      id,
      documento: u.documento || u.telefono || '',
      nombre: u.nombre_completo || u.nombre,
      correo: u.correo_institucional || u.correo,
      telefono: u.telefono || '',
      cargo: u.cargo || ''
    }
  }

  async function cargarContratistas() {
    cargando.value = true
    try {
      const { data } = await api.get('/usuarios?rol=Contratista')
      contratistas.value = (Array.isArray(data) ? data : []).map(mapear)
    } catch (error) {
      throw error
    } finally {
      cargando.value = false
    }
  }

  async function agregar(nuevo) {
    await api.post('/usuarios', {
      nombre_completo: nuevo.nombre,
      correo_institucional: nuevo.correo,
      telefono: nuevo.telefono,
      cargo: nuevo.cargo || 'Contratista',
      password: nuevo.password,
      rol: 'Contratista'
    })
    await cargarContratistas()
  }

  async function editar(usuario) {
    if (!usuario._id) return
    await api.patch(`/usuarios/${usuario._id}`, {
      nombre_completo: usuario.nombre,
      cargo: usuario.cargo || 'Contratista'
    })
    await cargarContratistas()
  }

  async function eliminar(documento) {
    const objetivo = contratistas.value.find((item) => item.documento === documento)
    if (!objetivo?._id) return
    await api.delete(`/usuarios/${objetivo._id}`)
    await cargarContratistas()
  }

  return {
    contratistas,
    cargando,
    cargarContratistas,
    agregar,
    editar,
    eliminar
  }
})