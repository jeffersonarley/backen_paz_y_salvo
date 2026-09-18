import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSolicitudesStore = defineStore('solicitudes', () => {
  const solicitudes = ref([
    {
      id: 'SOL-2026-001',
      numeroSolicitud: 'SOL-2026-001',
      documentoContratista: '1098765432',
      contratista: 'Juan Carlos Pérez Gómez',
      nombreContratista: 'Juan Carlos Pérez Gómez',
      numeroContrato: 'CNT-2025-088',
      dependencia: 'Gestión Tecnológica',
      responsable: 'Ing. Carlos Supervisor',
      fecha: '2026-08-15',
      fechaSolicitud: '2026-08-15',
      estado: 'Pendiente',
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
          dependenciaNombre: 'Almacén e Inventarios',
          firmada: false,
          fechaFirma: null,
        },
      ],
    },
    {
      id: 'SOL-2026-002',
      numeroSolicitud: 'SOL-2026-002',
      documentoContratista: '1095432189',
      contratista: 'Laura Andrea Contratista',
      nombreContratista: 'Laura Andrea Contratista',
      numeroContrato: 'CNT-2026-014',
      dependencia: 'Almacén e Inventarios',
      responsable: 'Lic. Martha Almacén',
      fecha: '2026-09-02',
      fechaSolicitud: '2026-09-02',
      estado: 'Firmado',
      firmas: [
        {
          dependenciaCodigo: 'DEP-01',
          dependenciaNombre: 'Gestión Tecnológica',
          firmada: true,
          fechaFirma: '2026-09-03',
        },
        {
          dependenciaCodigo: 'DEP-02',
          dependenciaNombre: 'Almacén e Inventarios',
          firmada: true,
          fechaFirma: '2026-09-04',
        },
        {
          dependenciaCodigo: 'DEP-03',
          dependenciaNombre: 'Recursos Humanos',
          firmada: true,
          fechaFirma: '2026-09-04',
        },
      ],
    },
    {
      id: 'SOL-2026-003',
      numeroSolicitud: 'SOL-2026-003',
      documentoContratista: '1094321765',
      contratista: 'María Fernanda Gómez Ruiz',
      nombreContratista: 'María Fernanda Gómez Ruiz',
      numeroContrato: 'CNT-2026-029',
      dependencia: 'Recursos Humanos',
      responsable: 'Dra. Ana María Gómez',
      fecha: '2026-09-10',
      fechaSolicitud: '2026-09-10',
      estado: 'En revisión',
      firmas: [
        {
          dependenciaCodigo: 'DEP-01',
          dependenciaNombre: 'Gestión Tecnológica',
          firmada: false,
          fechaFirma: null,
        },
        {
          dependenciaCodigo: 'DEP-02',
          dependenciaNombre: 'Almacén e Inventarios',
          firmada: false,
          fechaFirma: null,
        },
      ],
    },
    {
      id: 'SOL-2026-004',
      numeroSolicitud: 'SOL-2026-004',
      documentoContratista: '1097890123',
      contratista: 'Carlos Eduardo Mendoza',
      nombreContratista: 'Carlos Eduardo Mendoza',
      numeroContrato: 'CNT-2026-042',
      dependencia: 'Gestión Tecnológica',
      responsable: 'Ing. Carlos Supervisor',
      fecha: '2026-09-12',
      fechaSolicitud: '2026-09-12',
      estado: 'Finalizado',
      firmas: [
        {
          dependenciaCodigo: 'DEP-01',
          dependenciaNombre: 'Gestión Tecnológica',
          firmada: true,
          fechaFirma: '2026-09-13',
        },
        {
          dependenciaCodigo: 'DEP-02',
          dependenciaNombre: 'Almacén e Inventarios',
          firmada: true,
          fechaFirma: '2026-09-13',
        },
        {
          dependenciaCodigo: 'DEP-03',
          dependenciaNombre: 'Recursos Humanos',
          firmada: true,
          fechaFirma: '2026-09-14',
        },
      ],
    },
    {
      id: 'SOL-2026-005',
      numeroSolicitud: 'SOL-2026-005',
      documentoContratista: '1096543210',
      contratista: 'Diego Morales Castro',
      nombreContratista: 'Diego Morales Castro',
      numeroContrato: 'CNT-2026-055',
      dependencia: 'Infraestructura y Servicios Generales',
      responsable: 'Ing. Fernando Ramírez',
      fecha: '2026-09-15',
      fechaSolicitud: '2026-09-15',
      estado: 'Pendiente',
      firmas: [
        {
          dependenciaCodigo: 'DEP-04',
          dependenciaNombre: 'Infraestructura y Servicios Generales',
          firmada: true,
          fechaFirma: '2026-09-16',
        },
        {
          dependenciaCodigo: 'DEP-03',
          dependenciaNombre: 'Almacén e Inventarios',
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
