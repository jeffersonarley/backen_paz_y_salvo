import { defineStore } from 'pinia'

const certificadosIniciales = JSON.parse(localStorage.getItem('gccon_certificados')) || [];

export const useCertificadosStore = defineStore('certificados', {
  state: () => ({
    certificados: certificadosIniciales,
  }),

  actions: {
    guardarEnStorage() {
      localStorage.setItem('gccon_certificados', JSON.stringify(this.certificados))
    },

    agregar(solicitud) {
      const nuevoId = `CERT-2026-${(this.certificados.length + 1).toString().padStart(3, '0')}`
      this.certificados.unshift({
        id: nuevoId,
        fechaSolicitud: new Date().toISOString().substring(0, 10),
        estado: 'Pendiente',
        ...solicitud,
      })
      this.guardarEnStorage()
    },

    actualizarEstado(id, nuevoEstado, observaciones = '') {
      const index = this.certificados.findIndex((c) => c.id === id)
      if (index !== -1) {
        this.certificados[index].estado = nuevoEstado
        if (observaciones) {
          this.certificados[index].observaciones = observaciones
        }
        this.guardarEnStorage()
      }
    },

    eliminar(id) {
      this.certificados = this.certificados.filter((c) => c.id !== id)
      this.guardarEnStorage()
    },
  },
})
