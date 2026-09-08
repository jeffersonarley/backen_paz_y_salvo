import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSolicitudesStore = defineStore('solicitudes', () => {
  const solicitudes = ref([
    {
      id: 'SOL-2026-001',
      documentoContratista: '1098765432',
      nombreContratista: 'Juan Carlos Pérez',
      numeroContrato: 'CNT-2025-088',
      fechaSolicitud: '2026-08-15',
      estado: 'En Trámite',
      firmas: [
        { dependenciaCodigo: 'DEP-01', dependenciaNombre: 'Gestión Tecnológica', firmada: true, fechaFirma: '2026-08-16' },
        { dependenciaCodigo: 'DEP-02', dependenciaNombre: 'Recursos Humanos', firmada: false, fechaFirma: null },
        { dependenciaCodigo: 'DEP-03', dependenciaNombre: 'Infraestructura', firmada: false, fechaFirma: null }
      ]
    }
  ])

  function agregarSolicitud(nuevaSolicitud) {
    solicitudes.value.push(nuevaSolicitud)
  }

  function registrarFirma(idSolicitud, codigoDependencia) {
    const solicitud = solicitudes.value.find(s => s.id === idSolicitud)
    if (solicitud) {
      const firma = solicitud.firmas.find(f => f.dependenciaCodigo === codigoDependencia)
      if (firma) {
        firma.firmada = true
        firma.fechaFirma = new Date().toISOString().split('T')[0]
      }
      
      const todasFirmadas = solicitud.firmas.every(f => f.firmada)
      if (todasFirmadas) {
        solicitud.estado = 'Aprobado'
      }
    }
  }

  return {
    solicitudes,
    agregarSolicitud,
    registrarFirma
  }
})