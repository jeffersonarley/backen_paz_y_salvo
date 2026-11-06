import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useDependenciasStore = defineStore('dependencias', () => {
  const dependencias = ref([])
  const cargando = ref(false)

  const normalizarResponsable = (r) => ({
    id: String(r?._id || r?.id || ''),
    _id: String(r?._id || r?.id || ''),
    nombre: r?.nombre_completo || r?.nombre || 'Responsable',
    correo: r?.correo_institucional || r?.correo || '',
    rol: r?.rol || '',
  })

  async function cargarDependencias() {
    cargando.value = true
    try {
      const resp = await api.get('/dependencias')
      const lista = Array.isArray(resp.data) ? resp.data : resp.data?.dependencias || []
      if (Array.isArray(lista)) {
        const desdeAtlas = lista.map((d, idx) => {
          const responsables = Array.isArray(d.responsables_ids)
            ? d.responsables_ids.map(normalizarResponsable).filter((r) => r.id)
            : []
          const principal = d.responsable_id ? normalizarResponsable(d.responsable_id) : null
          const todos = [...responsables]
          if (principal && !todos.some((r) => r.id === principal.id)) {
            todos.unshift(principal)
          }
          return {
            _id: d._id?.toString() || `dep_${idx}`,
            id: d._id?.toString() || `dep_${idx}`,
            _idReal: d._id?.toString() || null,
            codigo: d.codigo || `DEP-${String(idx + 1).padStart(2, '0')}`,
            nombre: d.nombre_dependencia || d.nombre || 'Área Dependencia',
            responsables: todos,
            responsable: todos[0]?.nombre || 'Sin responsable asignado',
            responsable_id: todos[0]?.id || null,
            correo: todos[0]?.correo || '',
            estado: d.activo === false ? 'Inactiva' : 'Activa',
          }
        })

        dependencias.value = desdeAtlas
      }
    } catch (err) {
      console.warn('Cargando dependencias locales en fallback:', err.message)
    } finally {
      cargando.value = false
    }
  }

  // Cargar inmediatamente
  cargarDependencias()

  async function agregar(nuevaDependencia) {
    const idsResponsables = (nuevaDependencia.responsables || [])
      .map((r) => r?.id || r?._id || r)
      .filter(Boolean)

    try {
      await api.post('/dependencias', {
        nombre_dependencia: nuevaDependencia.nombre || nuevaDependencia.nombre_dependencia,
        codigo: nuevaDependencia.codigo,
        responsable_ids: idsResponsables,
        correo: nuevaDependencia.correo,
        activo: nuevaDependencia.estado !== 'Inactivo' && nuevaDependencia.estado !== 'Inactiva',
      })
      await cargarDependencias()
      return { ok: true }
    } catch (err) {
      console.warn('Registro de dependencia en fallback local:', err.message)
      const itemAInsertar = {
        ...nuevaDependencia,
        _id: `dep_${Date.now()}`,
      }
      dependencias.value.unshift(itemAInsertar)
      return { ok: false, mensaje: err.response?.data?.mensaje || err.message }
    }
  }

  async function editar(indiceOId, datosActualizados) {
    const idx =
      typeof indiceOId === 'number'
        ? indiceOId
        : dependencias.value.findIndex(
            (d) =>
              d._id === indiceOId ||
              d._idReal === indiceOId ||
              d.id === indiceOId ||
              d.codigo === indiceOId,
          )

    const actual = idx !== -1 ? dependencias.value[idx] : null
    const idAtlas =
      actual?._idReal ||
      actual?._id ||
      actual?.id ||
      (typeof indiceOId === 'string' && indiceOId.length === 24 ? indiceOId : null)

    if (idx !== -1) {
      dependencias.value[idx] = { ...actual, ...datosActualizados }
    }

    if (idAtlas && idAtlas.length === 24) {
      try {
        await api.put(`/dependencias/${idAtlas}`, {
          nombre_dependencia:
            datosActualizados.nombre || datosActualizados.nombre_dependencia || actual?.nombre,
          activo:
            datosActualizados.estado !== 'Inactivo' && datosActualizados.estado !== 'Inactiva',
        })

        const idsResponsables = (datosActualizados.responsables || [])
          .map((r) => r?.id || r?._id || r)
          .filter(Boolean)

        if (idsResponsables.length > 0) {
          await api.put(`/dependencias/${idAtlas}/responsables`, {
            responsable_ids: idsResponsables,
          })
        }

        await cargarDependencias()
        return { ok: true }
      } catch (err) {
        console.warn('Error al editar dependencia en Atlas:', err.message)
        await cargarDependencias()
        return { ok: false, mensaje: err.response?.data?.mensaje || err.message }
      }
    }
    await cargarDependencias()
    return { ok: true }
  }

  async function eliminar(codigoOId) {
    const dep = dependencias.value.find(
      (item) =>
        item._id === codigoOId ||
        item._idReal === codigoOId ||
        item.id === codigoOId ||
        (codigoOId && item._id?.toString() === String(codigoOId)) ||
        item.codigo === codigoOId,
    )
    if (!dep) return { ok: false, mensaje: 'No se encontró la dependencia a actualizar.' }

    const nuevoEstado =
      dep.estado === 'Inactiva' || dep.estado === 'Inactivo' ? 'Activa' : 'Inactiva'
    dep.estado = nuevoEstado
    const idAtlas = dep?._idReal || dep?._id || dep?.id

    if (idAtlas && idAtlas.length === 24) {
      try {
        try {
          await api.delete(`/dependencias/${idAtlas}`)
        } catch {
          await api.put(`/dependencias/${idAtlas}`, {
            nombre_dependencia: dep.nombre || dep.nombre_dependencia,
            activo: nuevoEstado === 'Activa',
          })
        }
        await cargarDependencias()
        return { ok: true }
      } catch (err) {
        console.warn('Error al actualizar estado de dependencia en Atlas:', err.message)
        await cargarDependencias()
        return { ok: false, mensaje: err.response?.data?.mensaje || err.message }
      }
    }

    await cargarDependencias()
    return { ok: true }
  }

  return {
    dependencias,
    cargando,
    cargarDependencias,
    agregar,
    editar,
    eliminar,
  }
})
