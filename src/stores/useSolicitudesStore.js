import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useSolicitudesStore = defineStore('solicitudes', () => {
  const solicitudesBase = [
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
  ]

  const solicitudes = ref([...solicitudesBase])
  const cargando = ref(false)

  async function cargarSolicitudes() {
    cargando.value = true
    try {
      const resp = await api.get('/contratos')
      const lista = Array.isArray(resp.data) ? resp.data : (resp.data?.contratos || [])
      if (Array.isArray(lista) && lista.length > 0) {
        const desdeAtlas = lista.map((c, idx) => {
          const num = c.numero_contrato || `CNT-${idx + 1}`
          const nom = c.nombre_contratista || c.usuario?.nombre_completo || 'Contratista'
          const dep = c.dependencia?.nombre_dependencia || (typeof c.dependencia === 'string' ? c.dependencia : 'Gestión Tecnológica')
          const sup = c.supervisor?.nombre_completo || 'Supervisor Asignado'
          const fch = c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '2026-09-17'
          const est = c.estado === 'EnProceso' ? 'En revisión' : (c.estado || 'Pendiente')

          return {
            _id: c._id,
            id: num,
            numeroSolicitud: `SOL-${String(num).replace(/\D/g, '').slice(-4).padStart(4, '0') || '00' + (idx + 1)}`,
            documentoContratista: c.telefono || '—',
            contratista: nom,
            nombreContratista: nom,
            numeroContrato: num,
            dependencia: dep,
            responsable: sup,
            fecha: fch,
            fechaSolicitud: fch,
            estado: est,
            firmas: [
              {
                dependenciaCodigo: 'DEP-01',
                dependenciaNombre: dep,
                firmada: est === 'Firmado' || est === 'Finalizado',
                fechaFirma: est === 'Firmado' || est === 'Finalizado' ? fch : null,
              }
            ]
          }
        })

        const mapa = new Map()
        // Priorizar contratos de Atlas al inicio
        desdeAtlas.forEach((s) => mapa.set((s.numeroContrato || s.id).toLowerCase(), s))
        solicitudesBase.forEach((s) => {
          if (!mapa.has((s.numeroContrato || s.id).toLowerCase())) {
            mapa.set((s.numeroContrato || s.id).toLowerCase(), s)
          }
        })
        solicitudes.value = Array.from(mapa.values())
      }
    } catch (err) {
      console.warn('Cargando solicitudes locales:', err.message)
    } finally {
      cargando.value = false
    }
  }

  cargarSolicitudes()

  async function agregarSolicitud(nuevaSolicitud) {
    const solicitudAInsertar = {
      ...nuevaSolicitud,
      id: nuevaSolicitud.numeroSolicitud || nuevaSolicitud.id || `SOL-2026-${Date.now()}`,
    }
    solicitudes.value.unshift(solicitudAInsertar)
    try {
      await api.post('/contratos', {
        numero: nuevaSolicitud.numeroContrato || `CNT-${Date.now().toString().slice(-4)}`,
        telefono: nuevaSolicitud.telefono || '3001234567',
        dependencia: nuevaSolicitud.dependencia || 'Sistemas e Informática',
        bienes: [
          {
            descripcion: 'Equipo de cómputo y accesorios de oficina',
            codigo_inventario: `INV-${Date.now().toString().slice(-4)}`,
            estado_bien: 'Bueno'
          }
        ]
      })
      await cargarSolicitudes()
    } catch (err) {
      console.warn('Registro de contrato local en fallback:', err.message)
    }
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

  async function eliminarSolicitud(idBusqueda) {
    const sol = solicitudes.value.find(
      (s) => (s.id || s.numeroSolicitud || s.solicitud || s.numeroContrato) === idBusqueda,
    )
    solicitudes.value = solicitudes.value.filter(
      (s) => (s.id || s.numeroSolicitud || s.solicitud || s.numeroContrato) !== idBusqueda,
    )
    if (sol?._id) {
      try {
        await api.delete(`/contratos/${sol._id}`)
      } catch (err) {
        console.warn('Eliminación local:', err.message)
      }
    }
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
    cargando,
    cargarSolicitudes,
    agregarSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
    registrarFirma,
    rechazarSolicitud,
    obtenerSolicitudPorId,
  }
})
