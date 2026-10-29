import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useDependenciasStore = defineStore('dependencias', () => {
  const dependencias = ref([])
  const cargando = ref(false)

  // Respaldo local (solo se usa si la API no responde). No incluye responsables ficticios.
  const dependenciasBase = [
    {
      _id: 'DEP-01',
      codigo: 'DEP-01',
      nombre: 'Gestión Tecnológica (TIC)',
      responsables: [],
      responsable: 'Sin responsable asignado',
      correo: '',
      estado: 'Activa',
    },
    {
      _id: 'DEP-02',
      codigo: 'DEP-02',
      nombre: 'Almacén e Inventarios',
      responsables: [],
      responsable: 'Sin responsable asignado',
      correo: '',
      estado: 'Activa',
    },
    {
      _id: 'DEP-03',
      codigo: 'DEP-03',
      nombre: 'Recursos Humanos / Talento Humano',
      responsables: [],
      responsable: 'Sin responsable asignado',
      correo: '',
      estado: 'Activa',
    },
    {
      _id: 'DEP-04',
      codigo: 'DEP-04',
      nombre: 'Infraestructura y Servicios Generales',
      responsables: [],
      responsable: 'Sin responsable asignado',
      correo: '',
      estado: 'Activa',
    },
    {
      _id: 'DEP-05',
      codigo: 'DEP-05',
      nombre: 'Biblioteca y Archivo',
      responsables: [],
      responsable: 'Sin responsable asignado',
      correo: '',
      estado: 'Activa',
    },
    {
      _id: 'DEP-06',
      codigo: 'DEP-06',
      nombre: 'Bienestar al Aprendiz y Comunidad',
      responsables: [],
      responsable: 'Sin responsable asignado',
      correo: '',
      estado: 'Activa',
    },
    {
      _id: 'DEP-07',
      codigo: 'DEP-07',
      nombre: 'Coordinación Académica y Formación',
      responsables: [],
      responsable: 'Sin responsable asignado',
      correo: '',
      estado: 'Activa',
    },
  ]

  dependencias.value = [...dependenciasBase]

  const normalizarResponsable = (r) => ({
    id: String(r?._id || r?.id || ''),
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

        // Si la API responde, se muestran solo las dependencias reales (sin datos de ejemplo)
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
      .map((r) => r?.id || r)
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

  async function editar(indice, datosActualizados) {
    if (indice !== -1 && indice < dependencias.value.length) {
      const actual = dependencias.value[indice]
      dependencias.value[indice] = { ...actual, ...datosActualizados }

      const idAtlas = actual?._idReal || actual?._id || actual?.id
      if (idAtlas && idAtlas.length === 24) {
        try {
          await api.put(`/dependencias/${idAtlas}`, {
            nombre_dependencia:
              datosActualizados.nombre || datosActualizados.nombre_dependencia || actual.nombre,
            activo:
              datosActualizados.estado !== 'Inactivo' && datosActualizados.estado !== 'Inactiva',
          })

          const idsResponsables = (datosActualizados.responsables || [])
            .map((r) => r?.id || r)
            .filter(Boolean)

          await api.put(`/dependencias/${idAtlas}/responsables`, {
            responsable_ids: idsResponsables,
          })

          await cargarDependencias()
          return { ok: true }
        } catch (err) {
          console.warn('Error al editar dependencia en Atlas:', err.message)
          await cargarDependencias()
          return { ok: false, mensaje: err.response?.data?.mensaje || err.message }
        }
      }
      return { ok: true }
    }
    return { ok: false }
  }

  async function eliminar(codigoOId) {
    // Se busca primero por el id real de la base de datos: el "codigo" es un indice
    // de la tabla y puede cambiar de posicion al recargar (podria alternar otra dependencia)
    const dep = dependencias.value.find(
      (item) =>
        item._id === codigoOId ||
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
