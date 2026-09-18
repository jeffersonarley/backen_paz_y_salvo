import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useContratistasStore = defineStore('contratistas', () => {
  const contratistas = ref([])
  const cargando = ref(false)

  const contratistasBase = [
    {
      documento: '1098765432',
      nombre: 'Juan Carlos Pérez Gómez',
      correo: 'juan.perez@correo.com',
      telefono: '3101234567',
      cargo: 'Desarrollador Full-Stack Senior',
      password: '123',
    },
    {
      documento: '1095432189',
      nombre: 'Laura Andrea Contratista',
      correo: 'contratista@gccon.com',
      telefono: '3157654321',
      cargo: 'Especialista en Soporte Informático',
      password: '123',
    },
    {
      documento: '1094321765',
      nombre: 'María Fernanda Gómez Ruiz',
      correo: 'maria.gomez@correo.com',
      telefono: '3207654321',
      cargo: 'Instructora Contratista en Telemática',
      password: '123',
    },
    {
      documento: '1097890123',
      nombre: 'Carlos Eduardo Mendoza',
      correo: 'carlos.mendoza@email.com',
      telefono: '3119876543',
      cargo: 'Consultor en Redes y Telecomunicaciones',
      password: '123',
    },
    {
      documento: '1096543210',
      nombre: 'Diego Morales Castro',
      correo: 'diego.morales@correo.com',
      telefono: '3171234567',
      cargo: 'Técnico de Mantenimiento de Hardware',
      password: '123',
    },
  ]

  contratistas.value = [...contratistasBase]

  async function cargarContratistas() {
    cargando.value = true
    try {
      const resp = await api.get('/usuarios?rol=Contratista')
      const lista = Array.isArray(resp.data) ? resp.data : (resp.data?.usuarios || [])
      if (Array.isArray(lista)) {
        const desdeAtlas = lista.map((u, idx) => ({
          _id: (u._id || u.id || `con_${idx}`).toString(),
          id: (u._id || u.id || `con_${idx}`).toString(),
          documento: u.documento || u.telefono || `DOC-C${idx + 1}`,
          nombre: u.nombre_completo || u.nombre,
          correo: u.correo_institucional || u.correo,
          telefono: u.telefono || '3100000000',
          cargo: u.cargo || 'Contratista',
          password: '123',
        }))

        const mapa = new Map()
        // MongoDB Atlas primero para que los nuevos queden arriba
        desdeAtlas.forEach((c) => mapa.set(c.correo.toLowerCase(), c))
        contratistasBase.forEach((c) => {
          if (!mapa.has(c.correo.toLowerCase())) {
            mapa.set(c.correo.toLowerCase(), c)
          }
        })
        contratistas.value = Array.from(mapa.values())
      }
    } catch (err) {
      console.warn('Cargando contratistas locales:', err.message)
    } finally {
      cargando.value = false
    }
  }

  // Cargar inmediatamente
  cargarContratistas()

  async function agregar(nuevoContratista) {
    // 1. Agregar a la lista reactiva inmediatamente arriba
    contratistas.value.unshift({ ...nuevoContratista })

    // 2. Guardar en MongoDB Atlas
    try {
      await api.post('/usuarios', {
        nombre: nuevoContratista.nombre,
        nombre_completo: nuevoContratista.nombre,
        correo: nuevoContratista.correo,
        correo_institucional: nuevoContratista.correo,
        documento: nuevoContratista.documento,
        telefono: nuevoContratista.telefono,
        cargo: nuevoContratista.cargo || 'Contratista',
        password: nuevoContratista.password || '12345678',
        rol: 'Contratista',
      })
      await cargarContratistas()
    } catch (err) {
      console.error('Error al guardar contratista en Atlas:', err)
    }
  }

  function editar(indice, datosActualizados) {
    if (indice !== -1 && indice < contratistas.value.length) {
      contratistas.value[indice] = datosActualizados
    }
  }

  async function eliminar(documento) {
    const itemEncontrado = contratistas.value.find((item) => item.documento === documento)
    contratistas.value = contratistas.value.filter((item) => item.documento !== documento)

    try {
      const idParaBorrar = itemEncontrado?._id || itemEncontrado?.id || documento
      await api.delete(`/usuarios/${idParaBorrar}`)
    } catch (err) {
      console.error('Error al eliminar contratista en Atlas:', err)
    }
  }

  return {
    contratistas,
    cargando,
    cargarContratistas,
    agregar,
    editar,
    eliminar,
  }
})
