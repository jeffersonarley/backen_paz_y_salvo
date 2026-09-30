import api from './api'

// Servicios para Firmas
export async function procesarFirma(contratoId, accion, firma_base64, observacion_rechazo) {
  const { data } = await api.post('/firmas/procesar', {
    contratoId,
    accion,
    firma_base64,
    observacion_rechazo,
  })
  return data
}

export async function listarPendientes() {
  const { data } = await api.get('/firmas/pendientes')
  return data
}

export async function listarHistorial() {
  const { data } = await api.get('/firmas/historial')
  return data
}