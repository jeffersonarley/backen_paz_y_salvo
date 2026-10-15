import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from './authStore'
import {
  crearContrato,
  listarContratos,
  misSolicitudes,
  actualizarContrato,
  cancelarContrato,
} from '../services/contratoService'
import { procesarFirma } from '../services/firmaService'

function fechaISO(valor) {
  const d = valor ? new Date(valor) : null
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().split('T')[0] : ''
}

// Estado del backend -> estado mostrado en la UI
function estadoUi(estado) {
  if (estado === 'Firmado' || estado === 'Aprobado') return 'Firmado'
  if (estado === 'Finalizado') return 'Finalizado'
  if (estado === 'Rechazado') return 'Rechazado'
  return 'En revisión'
}

// Trazabilidad del backend -> casilleros de firma de la UI
function mapearFirmas(trazabilidad) {
  if (!Array.isArray(trazabilidad)) return []
  return trazabilidad.map((t) => ({
    id: t._id,
    dependenciaCodigo: String(t.area_id?._id || t.area_id || ''),
    dependenciaNombre: t.area || t.area_id?.nombre_dependencia || '',
    estado: t.estado,
    firmada: t.estado === 'Aprobado',
    fechaFirma: fechaISO(t.fecha_firma),
    observacion: t.observacion_rechazo || '',
    usuario: t.usuario_id?.nombre_completo || '',
  }))
}

function mapearContrato(c) {
  const num = c.numero_contrato || ''
  const nombre = c.nombre_contratista || c.usuario?.nombre_completo || ''
  const fecha = fechaISO(c.createdAt)
  const trazabilidad = Array.isArray(c.trazabilidad) ? c.trazabilidad : c.firmas
  const observacionesAreas = Array.isArray(trazabilidad)
    ? trazabilidad.map((t) => t.observacion_rechazo).filter(Boolean)
    : []

  return {
    _id: c._id,
    id: num || c._id,
    numeroSolicitud: num ? `SOL-${String(num).replace(/\D/g, '').slice(-4).padStart(4, '0')}` : '',
    documentoContratista: c.telefono || '',
    contratista: nombre,
    nombreContratista: nombre,
    numeroContrato: num,
    dependencia:
      c.dependencia?.nombre_dependencia ||
      (typeof c.dependencia === 'string' ? c.dependencia : ''),
    responsable: c.supervisor?.nombre_completo || '',
    fecha,
    fechaSolicitud: fecha,
    estadoBackend: c.estado,
    estado: estadoUi(c.estado),
    observacionRechazo: c.observaciones_supervisor || observacionesAreas[0] || '',
    bienes: Array.isArray(c.bienes) ? c.bienes : [],
    trazabilidad: Array.isArray(trazabilidad) ? trazabilidad : [],
    firmas: mapearFirmas(trazabilidad),
  }
}

function extraerLista(data) {
  if (Array.isArray(data)) return data
  return data?.contratos || data?.data || []
}

export const useSolicitudesStore = defineStore('solicitudes', () => {
  const auth = useAuthStore()

  // El store inicia vacío: los datos solo provienen del backend
  const solicitudes = ref([])
  const cargando = ref(false)

  // Al cambiar de usuario (login/logout) se descarta lo cargado para no mezclar información
  watch(
    () => auth.usuario?.id,
    () => {
      solicitudes.value = []
    },
  )

  function buscar(idBusqueda) {
    return solicitudes.value.find(
      (s) =>
        s._id === idBusqueda ||
        s.id === idBusqueda ||
        s.numeroSolicitud === idBusqueda ||
        s.numeroContrato === idBusqueda,
    )
  }

  // Reemplaza (o agrega) un contrato devuelto por el backend dentro del estado
  function aplicarContrato(contrato) {
    if (!contrato?._id) return null
    const nuevo = mapearContrato(contrato)
    const idx = solicitudes.value.findIndex((s) => s._id === nuevo._id)
    if (idx >= 0) {
      // El backend de mutaciones no siempre devuelve bienes/trazabilidad: se conservan los previos
      const previo = solicitudes.value[idx]
      solicitudes.value[idx] = {
        ...nuevo,
        dependencia: nuevo.dependencia || previo.dependencia,
        responsable: nuevo.responsable || previo.responsable,
        bienes: nuevo.bienes.length ? nuevo.bienes : previo.bienes,
        trazabilidad: nuevo.trazabilidad.length ? nuevo.trazabilidad : previo.trazabilidad,
        firmas: nuevo.firmas.length ? nuevo.firmas : previo.firmas,
      }
      return solicitudes.value[idx]
    }
    solicitudes.value.unshift(nuevo)
    return solicitudes.value[0]
  }

  async function cargarSolicitudes() {
    cargando.value = true
    try {
      const data = auth.rolUsuario === 'Contratista' ? await misSolicitudes() : await listarContratos()
      solicitudes.value = extraerLista(data).map(mapearContrato)
    } catch (err) {
      console.warn('No se pudieron cargar las solicitudes:', err.response?.data?.mensaje || err.message)
      solicitudes.value = []
    } finally {
      cargando.value = false
    }
    return solicitudes.value
  }

  async function agregarSolicitud(nuevaSolicitud) {
    const payload = {
      numero: nuevaSolicitud.numero || nuevaSolicitud.numeroContrato,
      telefono: nuevaSolicitud.telefono || nuevaSolicitud.documentoContratista,
      dependencia: nuevaSolicitud.dependencia,
      objeto_contractual: nuevaSolicitud.objeto_contractual,
      fecha_inicio: nuevaSolicitud.fecha_inicio,
      fecha_fin: nuevaSolicitud.fecha_fin,
      adjunto_nombre: nuevaSolicitud.adjunto_nombre,
      bienes: nuevaSolicitud.bienes,
    }
    try {
      const resp = await crearContrato(payload)
      await cargarSolicitudes()
      return resp?.contrato || resp
    } catch (err) {
      throw new Error(err.response?.data?.mensaje || err.message || 'Error al registrar el contrato')
    }
  }

  async function actualizarSolicitud(idBusqueda, datosActualizados) {
    const item = buscar(idBusqueda)
    if (!item) return null
    try {
      const resp = await actualizarContrato(item._id, datosActualizados)
      return aplicarContrato(resp?.contrato) || item
    } catch (err) {
      throw new Error(err.response?.data?.mensaje || err.message || 'Error al actualizar el contrato')
    }
  }

  // Cambio de estado = acción de firma (Aprobar / Rechazar) procesada por el backend
  async function cambiarEstado(idBusqueda, nuevoEstado, motivo = '', firmaBase64 = null) {
    const item = buscar(idBusqueda)
    if (!item) return null
    const accion = nuevoEstado === 'Rechazado' ? 'Rechazar' : 'Aprobar'
    try {
      const resp = await procesarFirma(
        item._id,
        accion,
        firmaBase64 || undefined,
        accion === 'Rechazar' ? motivo : undefined,
      )
      // El backend es la fuente de verdad: se recarga estado y trazabilidad
      await cargarSolicitudes()
      return buscar(item._id) || resp?.contrato || null
    } catch (err) {
      throw new Error(err.response?.data?.mensaje || err.message || 'Error al procesar la firma')
    }
  }

  async function eliminarSolicitud(idBusqueda) {
    const item = buscar(idBusqueda)
    if (!item) return null
    try {
      await cancelarContrato(item._id)
      solicitudes.value = solicitudes.value.filter((s) => s._id !== item._id)
      return item
    } catch (err) {
      throw new Error(err.response?.data?.mensaje || err.message || 'Error al eliminar el contrato')
    }
  }

  async function registrarFirma(idSolicitud, firmaBase64 = null) {
    return cambiarEstado(idSolicitud, 'Aprobado', '', firmaBase64)
  }

  async function rechazarSolicitudConDictamen(idSolicitud, observacion, bienesFaltantes = []) {
    const item = buscar(idSolicitud)
    if (!item) return null
    try {
      await procesarFirma(item._id, 'Rechazar', undefined, observacion)
      await cargarSolicitudes()
      const actualizado = buscar(item._id)
      if (actualizado) actualizado.bienesFaltantes = bienesFaltantes
      return actualizado || null
    } catch (err) {
      throw new Error(err.response?.data?.mensaje || err.message || 'Error al rechazar la solicitud')
    }
  }

  async function rechazarSolicitud(idSolicitud, observacion) {
    return rechazarSolicitudConDictamen(idSolicitud, observacion)
  }

  function obtenerSolicitudPorId(id) {
    return buscar(id)
  }

  function obtenerPorCodigo(codigo) {
    return buscar(codigo)
  }

  return {
    solicitudes,
    cargando,
    cargarSolicitudes,
    agregarSolicitud,
    actualizarSolicitud,
    cambiarEstado,
    eliminarSolicitud,
    registrarFirma,
    rechazarSolicitud,
    rechazarSolicitudConDictamen,
    obtenerSolicitudPorId,
    obtenerPorCodigo,
  }
})
