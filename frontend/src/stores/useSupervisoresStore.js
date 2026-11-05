import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useSupervisoresStore = defineStore('supervisores', () => {
  const supervisores = ref([])
  const cargando = ref(false)
  async function cargarSupervisores() {
    cargando.value = true
    try {
      const resp = await api.get('/usuarios?rol=Supervisor')
      const lista = Array.isArray(resp.data) ? resp.data : resp.data?.usuarios || []
      if (Array.isArray(lista)) {
        const desdeAtlas = lista.map((u, idx) => ({
          _id: (u._id || u.id || `sup_${idx}`).toString(),
          id: (u._id || u.id || `sup_${idx}`).toString(),
          documento: u.documento || '',
          nombre: u.nombre_completo || u.nombre,
          correo: u.correo_institucional || u.correo,
          telefono: u.telefono || '',
          cargo: u.cargo || '',
          dependencia:
            u.dependencia_id?.nombre_dependencia || u.dependencia || '',
          dependencia_id: u.dependencia_id?._id || u.dependencia_id || null,
          apoyo_supervision_id:
            u.apoyo_supervision_id?._id || u.apoyo_supervision_id || null,
          apoyo_supervision: u.apoyo_supervision_id?.nombre_completo || '',
          plantilla_predeterminada: u.plantilla_predeterminada || '',
          password: '',
        }))

        // Solo los supervisores reales de la base de datos
        supervisores.value = desdeAtlas
      }
    } catch (err) {
      console.warn('Cargando supervisores locales:', err.message)
    } finally {
      cargando.value = false
    }
  }

  // Cargar inmediatamente
  cargarSupervisores()

  async function agregar(nuevo) {
    try {
      await api.post('/usuarios', {
        nombre: nuevo.nombre,
        nombre_completo: nuevo.nombre,
        correo: nuevo.correo,
        correo_institucional: nuevo.correo,
        documento: nuevo.documento,
        telefono: nuevo.telefono,
        cargo: nuevo.cargo || 'Coordinador de Contratos',
        dependencia: nuevo.dependencia_nombre || nuevo.dependencia,
        dependencia_id: nuevo.dependencia_id || nuevo.dependencia || null,
        apoyo_supervision_id: nuevo.apoyo_supervision_id || null,
        password: nuevo.password,
        rol: 'Supervisor',
      })
      await cargarSupervisores()
    } catch (err) {
      console.error('Error al guardar supervisor en Atlas:', err)
      throw err
    }
  }

  async function editar(index, datos) {
    if (index !== -1 && index < supervisores.value.length) {
      supervisores.value[index] = { ...datos }
      try {
        const idParaApi = datos._id || datos.id
        if (idParaApi && idParaApi.length === 24) {
          await api.put(`/usuarios/${idParaApi}`, {
            nombre_completo: datos.nombre,
            telefono: datos.telefono,
            cargo: datos.cargo,
            dependencia: datos.dependencia_nombre || datos.dependencia,
            dependencia_id: datos.dependencia_id || datos.dependencia || null,
            apoyo_supervision_id: datos.apoyo_supervision_id || null,
          })
        }
      } catch (err) {
        console.warn('Actualización de supervisor en Atlas falló, guardado local:', err.message)
      }
    }
  }

  async function eliminar(documento) {
    const sup = supervisores.value.find((item) => item.documento === documento)
    supervisores.value = supervisores.value.filter((s) => s.documento !== documento)

    try {
      const idParaBorrar = sup?._id || sup?.id || documento
      await api.delete(`/usuarios/${idParaBorrar}`)
    } catch (err) {
      console.error('Error al eliminar supervisor en Atlas:', err)
    }
  }

  return {
    supervisores,
    cargando,
    cargarSupervisores,
    agregar,
    editar,
    eliminar,
  }
})
