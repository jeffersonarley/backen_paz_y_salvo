import api from './axios'

/**
 * Módulo de Firmas (ResponsableArea / Admin).
 * GET   /api/firmas/pendientes
 * GET   /api/firmas/historial
 * POST  /api/firmas/procesar
 */
export function listarPendientes() {
  return api.get('/firmas/pendientes')
}

export function listarHistorial() {
  return api.get('/firmas/historial')
}

export function procesarFirma(payload) {
  return api.post('/firmas/procesar', payload)
}
