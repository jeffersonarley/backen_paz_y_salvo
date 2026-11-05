import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useContratistasStore = defineStore('contratistas', () => {
  const contratistas = ref([])
  const cargando = ref(false)
  async function cargarContratistas() {
    cargando.value = true
    try {
      const resp = await api.get('/usuarios?rol=Contratista')
      const lista = Array.isArray(resp.data) ? resp.data : resp.data?.usuarios || []
      if (Array.isArray(lista)) {
        const desdeAtlas = lista.map((u, idx) => ({
          _id: (u._id || u.id || `con_${idx}`).toString(),
          id: (u._id || u.id || `con_${idx}`).toString(),
          documento: u.documento || '',
          nombre: u.nombre_completo || u.nombre,
          numeroContrato: u.numero_contrato || u.contrato || '',
          correo: u.correo_institucional || u.correo,
          telefono: u.telefono || '',
          cargo: u.cargo || '',
          supervisor: u.supervisor || u.supervisor_id?.nombre_completo || '',
          supervisor_id: u.supervisor_id?._id || u.supervisor_id || null,
          dependencia:
            u.dependencia || u.dependencia_id?.nombre_dependencia || '',
          dependencia_id: u.dependencia_id?._id || u.dependencia_id || null,
          password: '',
        }))

        contratistas.value = desdeAtlas
      }
    } catch (err) {
      console.warn('Cargando contratistas locales:', err.message)
    } finally {
      cargando.value = false
    }
  }

  // Cargar inmediatamente
  cargarContratistas()

  async function agregar(nuevoContratista) {
    try {
      await api.post('/usuarios', {
        nombre: nuevoContratista.nombre,
        nombre_completo: nuevoContratista.nombre,
        correo: nuevoContratista.correo,
        correo_institucional: nuevoContratista.correo,
        documento: nuevoContratista.documento,
        telefono: nuevoContratista.telefono,
        numero_contrato: nuevoContratista.numeroContrato,
        contrato: nuevoContratista.numeroContrato,
        supervisor: nuevoContratista.supervisor,
        supervisor_id: nuevoContratista.supervisor_id,
        dependencia: nuevoContratista.dependencia,
        dependencia_id: nuevoContratista.dependencia_id,
        cargo: nuevoContratista.cargo || 'Contratista',
        password: nuevoContratista.password,
        rol: 'Contratista',
      })
      await cargarContratistas()
    } catch (err) {
      console.error('Error al guardar contratista en Atlas:', err)
      throw err
    }
  }

  async function editar(indice, datosActualizados) {
    if (indice !== -1 && indice < contratistas.value.length) {
      contratistas.value[indice] = datosActualizados
      try {
        const idParaApi = datosActualizados._id || datosActualizados.id
        if (idParaApi) {
          await api.put(`/usuarios/${idParaApi}`, {
            nombre_completo: datosActualizados.nombre,
            telefono: datosActualizados.telefono,
            numero_contrato: datosActualizados.numeroContrato,
            contrato: datosActualizados.numeroContrato,
            supervisor: datosActualizados.supervisor,
            supervisor_id: datosActualizados.supervisor_id,
            dependencia: datosActualizados.dependencia,
            dependencia_id: datosActualizados.dependencia_id,
            cargo: datosActualizados.cargo,
          })
        }
      } catch (err) {
        console.warn('Actualización de contratista en Atlas falló, guardado local:', err.message)
      }
    }
  }

  async function eliminar(documento) {
    const itemEncontrado = contratistas.value.find((item) => item.documento === documento)
    contratistas.value = contratistas.value.filter((item) => item.documento !== documento)

    try {
      const idParaBorrar = itemEncontrado?._id || itemEncontrado?.id || documento
      await api.delete(`/usuarios/${idParaBorrar}`)
    } catch (err) {
      console.error('Error al eliminar contratista en Atlas:', err)
    }
  }

  return {
    contratistas,
    cargando,
    cargarContratistas,
    agregar,
    editar,
    eliminar,
  }
})
