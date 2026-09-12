import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSolicitudesStore = defineStore('solicitudes', () => {
  const solicitudes = ref([
    {
      id: 'SOL-2026-001',
      numeroSolicitud: 'SOL-2026-001',
      documentoContratista: '1098765432',
      contratista: 'Juan Carlos Pérez',
      nombreContratista: 'Juan Carlos Pérez',
      numeroContrato: 'CNT-2025-088',
      dependencia: 'Gestión Tecnológica',
      responsable: 'Supervisor Asignado',
      fecha: '2026-08-15',
      fechaSolicitud: '2026-08-15',
      estado: 'Pendiente', // <-- Actualizado aquí
      firmas: [
        {
          dependenciaCodigo: 'DEP-01',
          dependenciaNombre: 'Gestión Tecnológica',
          firmada: true,
          fechaFirma: '2026-08-16',
        },
        {
          dependenciaCodigo: 'DEP-02',
          dependenciaNombre: 'Recursos Humanos',
          firmada: false,
          fechaFirma: null,
        },
        {
          dependenciaCodigo: 'DEP-03',
          dependenciaNombre: 'Infraestructura',
          firmada: false,
          fechaFirma: null,
        },
      ],
    },
  ])

  function agregarSolicitud(nuevaSolicitud) {
    // Asegurarnos de que tenga un id o numeroSolicitud unificado
    const solicitudAInsertar = {
      ...nuevaSolicitud,
      id: nuevaSolicitud.numeroSolicitud || nuevaSolicitud.id || `SOL-2026-${Date.now()}`,
    }
    solicitudes.value.push(solicitudAInsertar)
  }

  function actualizarSolicitud(idBusqueda, datosActualizados) {
    const index = solicitudes.value.findIndex(
      (s) => (s.id || s.numeroSolicitud || s.solicitud) === idBusqueda,
    )
    if (index !== -1) {
      solicitudes.value[index] = {
        ...solicitudes.value[index],
        ...datosActualizados,
      }
    }
  }

  function eliminarSolicitud(idBusqueda) {
    solicitudes.value = solicitudes.value.filter(
      (s) => (s.id || s.numeroSolicitud || s.solicitud || s.numeroContrato) !== idBusqueda,
    )
  }

  function registrarFirma(idSolicitud, codigoDependencia) {
    const solicitud = solicitudes.value.find((s) => (s.id || s.numeroSolicitud) === idSolicitud)
    if (solicitud) {
      const firma = solicitud.firmas?.find((f) => f.dependenciaCodigo === codigoDependencia)
      if (firma) {
        firma.firmada = true
        firma.fechaFirma = new Date().toISOString().split('T')[0]
      }

      const todasFirmadas = solicitud.firmas?.every((f) => f.firmada)
      if (todasFirmadas) {
        solicitud.estado = 'Firmado'
      }
    }
  }

  function rechazarSolicitud(idSolicitud, observacion) {
    const solicitud = solicitudes.value.find((s) => (s.id || s.numeroSolicitud) === idSolicitud)
    if (solicitud) {
      solicitud.estado = 'Rechazado'
      solicitud.observacionRechazo = observacion
    }
  }

  function obtenerSolicitudPorId(id) {
    return solicitudes.value.find(
      (s) => s.id === id || s.numeroSolicitud === id || s.numeroContrato === id,
    )
  }

  return {
    solicitudes,
    agregarSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
    registrarFirma,
    rechazarSolicitud,
    obtenerSolicitudPorId,
  }
})
