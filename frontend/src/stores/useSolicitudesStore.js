import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import {
  listarContratos,
  misSolicitudes,
  crearContrato,
  actualizarContrato,
  evaluarContrato,
  cancelarContrato,
} from '../services/contratoService'
import { procesarFirma } from '../services/firmaService'

/*
 * Store de solicitudes (contratos / paz y salvo).
 * - Inicia vacío: NO existen datos simulados. Todo proviene del backend.
 * - Contratista -> GET /contratos/mis-solicitudes; resto de roles -> GET /contratos.
 * - Ante error o respuesta vacía el estado queda en blanco.
 * - Las mutaciones llaman al backend y luego recargan para traer la trazabilidad real.
 */

const fechaCorta = (valor) => {
  if (!valor) return null
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

// Rol sin importar el formato ('Contratista', 'CONTRATISTA', 'RESPONSABLE_AREA', 'ResponsableArea'...)
const rolDe = (auth) =>
  String(auth?.rolUsuario || auth?.usuario?.rol || '')
    .toUpperCase()
    .replace(/[\s_-]+/g, '')

const mensajeError = (err, porDefecto) =>
  err?.response?.data?.mensaje || err?.mensaje || err?.message || porDefecto

// Estado del backend -> etiqueta que usa la interfaz
function estadoParaUI(estadoBackend) {
  if (estadoBackend === 'Aprobado') return 'Firmado'
  if (['Firmado', 'Finalizado', 'Rechazado'].includes(estadoBackend)) return estadoBackend
  return 'En revisión'
}

function normalizarFirmas(trazabilidad) {
  return (Array.isArray(trazabilidad) ? trazabilidad : []).map((t) => {
    const area = t.area_id && typeof t.area_id === 'object' ? t.area_id : null
    const pendiente = t.estado === 'Pendiente'
    return {
      _id: t._id,
      dependenciaCodigo: String(area?._id || t.area_id || ''),
      dependenciaNombre: t.area || area?.nombre_dependencia || '',
      estado: t.estado,
      firmada: t.estado === 'Aprobado',
      fechaFirma: pendiente ? null : fechaCorta(t.fecha || t.fecha_firma || t.createdAt),
      observacion: t.observacion_rechazo || '',
      hash: t.hash_verificacion || '',
      firmante: t.usuario_id?.nombre_completo || '',
    }
  })
}

function normalizarContrato(c) {
  const idMongo = String(c._id || '')
  const numero = c.numero_contrato || ''
  const trazabilidad = Array.isArray(c.trazabilidad) ? c.trazabilidad : c.firmas || []
  const firmas = normalizarFirmas(trazabilidad)
  const rechazoArea = firmas.find((f) => f.estado === 'Rechazado' && f.observacion)
  const fecha = fechaCorta(c.createdAt)
  const dependencia =
    c.dependencia?.nombre_dependencia ||
    (typeof c.dependencia === 'string' ? c.dependencia : '') ||
    ''
  const nombre = c.nombre_contratista || c.usuario?.nombre_completo || ''

  return {
    _id: idMongo,
    id: numero || idMongo,
    numeroSolicitud: idMongo ? `SOL-${idMongo.slice(-6).toUpperCase()}` : '',
    numeroContrato: numero,
    contratista: nombre,
    nombreContratista: nombre,
    documentoContratista: c.documento_contratista || c.usuario?.documento || '—',
    correo: c.correo_contratista || '',
    telefono: c.telefono || '',
    dependencia,
    responsable: c.supervisor?.nombre_completo || '',
    objeto: c.objeto_contractual || '',
    fechaInicio: fechaCorta(c.fecha_inicio),
    fechaFin: fechaCorta(c.fecha_fin),
    fecha,
    fechaSolicitud: fecha,
    estado: estadoParaUI(c.estado),
    estadoBackend: c.estado,
    observacionRechazo: rechazoArea?.observacion || c.observaciones_supervisor || '',
    observaciones_supervisor: c.observaciones_supervisor || '',
    bienes: Array.isArray(c.bienes) ? c.bienes : [],
    firmas,
    trazabilidad,
  }
}

function extraerLista(data) {
  if (Array.isArray(data)) return data
  return data?.contratos || data?.data || []
}

export const useSolicitudesStore = defineStore('solicitudes', () => {
  // Sin seed: el store inicia completamente vacío.
  const solicitudes = ref([])
  const cargando = ref(false)
  const error = ref('')

  let ultimaCarga = 0 // descarta respuestas viejas si hay cargas simultáneas
  let usuarioCargado = null // para no mostrar datos del usuario anterior

  function limpiar() {
    solicitudes.value = []
    error.value = ''
    usuarioCargado = null
  }

  function buscar(id) {
    if (!id) return undefined
    return solicitudes.value.find(
      (s) =>
        s._id === id ||
        s.id === id ||
        s.numeroSolicitud === id ||
        s.numeroContrato === id ||
        s.solicitud === id,
    )
  }

  function requerir(id) {
    const item = buscar(id)
    if (!item || !item._id) throw new Error('La solicitud no existe o aún no está registrada.')
    return item
  }

  async function cargarSolicitudes() {
    const auth = useAuthStore()
    const actual = auth.usuario?.id || auth.usuario?._id || null
    if (usuarioCargado !== actual) limpiar() // cambió la sesión: no arrastrar datos ajenos

    const turno = ++ultimaCarga
    cargando.value = true
    error.value = ''
    try {
      const data = rolDe(auth) === 'CONTRATISTA' ? await misSolicitudes() : await listarContratos()
      if (turno !== ultimaCarga) return
      const lista = extraerLista(data)
      solicitudes.value = Array.isArray(lista) ? lista.map(normalizarContrato) : []
      usuarioCargado = actual
    } catch (err) {
      if (turno !== ultimaCarga) return
      solicitudes.value = [] // jamás datos simulados
      error.value = mensajeError(err, 'No se pudieron cargar las solicitudes.')
      console.warn('Cargar solicitudes:', error.value)
    } finally {
      if (turno === ultimaCarga) cargando.value = false
    }
  }

  // Tras cada mutación se recarga para traer estado y trazabilidad reales del backend.
  async function refrescar() {
    await cargarSolicitudes()
  }

  async function agregarSolicitud(nueva) {
    const auth = useAuthStore()
    const payload = {
      numero: String(nueva.numeroContrato || nueva.numero || '').trim(),
      telefono: String(nueva.telefono || auth.usuario?.telefono || '').trim(),
      dependencia: nueva.dependencia,
      objeto_contractual: nueva.objeto || nueva.objeto_contractual || undefined,
      fecha_inicio: nueva.fechaInicio || nueva.fecha_inicio || undefined,
      fecha_fin: nueva.fechaFin || nueva.fecha_fin || undefined,
      bienes: Array.isArray(nueva.bienes) ? nueva.bienes : [],
    }
    try {
      const resp = await crearContrato(payload)
      await refrescar()
      return resp
    } catch (err) {
      throw new Error(mensajeError(err, 'No se pudo registrar el contrato.'))
    }
  }

  async function actualizarSolicitud(id, datos = {}) {
    const item = requerir(id)
    // Solo campos que el backend permite editar (Contratista, contrato en Borrador).
    const payload = {}
    if (datos.numeroContrato !== undefined) payload.numero = datos.numeroContrato
    if (datos.telefono !== undefined) payload.telefono = datos.telefono
    if (datos.dependencia !== undefined) payload.dependencia = datos.dependencia
    if (datos.objeto !== undefined) payload.objeto_contractual = datos.objeto
    if (datos.fechaInicio !== undefined) payload.fecha_inicio = datos.fechaInicio
    if (datos.fechaFin !== undefined) payload.fecha_fin = datos.fechaFin
    if (Object.keys(payload).length === 0) return item

    try {
      await actualizarContrato(item._id, payload)
      await refrescar()
      return buscar(item._id)
    } catch (err) {
      throw new Error(mensajeError(err, 'No se pudo actualizar la solicitud.'))
    }
  }

  // Aprobar/rechazar según quién actúa: el área firma; el supervisor evalúa.
  async function aprobarRechazar(item, aprobar, observacion = '', firmaBase64) {
    const auth = useAuthStore()
    const rol = rolDe(auth)
    const enFirmas = item.estadoBackend === 'Pendiente de Firmas'
    const comoArea = rol === 'RESPONSABLEAREA' || (rol === 'ADMINISTRADOR' && enFirmas)

    if (comoArea) {
      const base64 = firmaBase64 ? String(firmaBase64).replace(/^data:image\/\w+;base64,/, '') : undefined
      return procesarFirma(item._id, aprobar ? 'Aprobar' : 'Rechazar', base64, observacion || undefined)
    }
    if (rol === 'SUPERVISOR' || rol === 'ADMINISTRADOR') {
      return evaluarContrato(item._id, {
        aprobado: aprobar,
        observaciones_supervisor: observacion || undefined,
      })
    }
    throw new Error('Tu rol no puede realizar esta acción sobre la solicitud.')
  }

  async function cambiarEstado(id, nuevoEstado, motivo = '') {
    const item = requerir(id)
    const aprobar = nuevoEstado !== 'Rechazado'
    try {
      await aprobarRechazar(item, aprobar, motivo)
      await refrescar()
      return buscar(item._id)
    } catch (err) {
      throw new Error(mensajeError(err, 'No se pudo cambiar el estado de la solicitud.'))
    }
  }

  // Firma de aprobación del área (envía la imagen de la firma al backend).
  async function firmarSolicitud(id, firmaBase64) {
    const item = requerir(id)
    try {
      const resp = await aprobarRechazar(item, true, '', firmaBase64)
      await refrescar()
      return resp
    } catch (err) {
      throw new Error(mensajeError(err, 'No se pudo registrar la firma.'))
    }
  }

  async function rechazarSolicitudConDictamen(id, observacion, bienesFaltantes = []) {
    const item = requerir(id)
    const faltantes = (bienesFaltantes || [])
      .map((b) => b.descripcion || b.nombre || b.codigo_inventario)
      .filter(Boolean)
    // El backend no tiene campo para bienes faltantes: se anexan a la observación.
    const texto = (
      faltantes.length ? `${observacion}\nBienes faltantes: ${faltantes.join(', ')}` : observacion
    ).slice(0, 1000)
    try {
      await aprobarRechazar(item, false, texto)
      await refrescar()
      return buscar(item._id)
    } catch (err) {
      throw new Error(mensajeError(err, 'No se pudo registrar el dictamen de rechazo.'))
    }
  }

  // Eliminar = cancelar el contrato (backend: solo el Contratista dueño, en Borrador).
  async function eliminarSolicitud(id) {
    const item = requerir(id)
    try {
      await cancelarContrato(item._id)
      await refrescar()
    } catch (err) {
      throw new Error(mensajeError(err, 'No se pudo eliminar la solicitud.'))
    }
  }

  function obtenerSolicitudPorId(id) {
    return buscar(id)
  }

  return {
    solicitudes,
    cargando,
    error,
    cargarSolicitudes,
    agregarSolicitud,
    actualizarSolicitud,
    cambiarEstado,
    firmarSolicitud,
    eliminarSolicitud,
    rechazarSolicitudConDictamen,
    obtenerSolicitudPorId,
    limpiar,
  }
})
