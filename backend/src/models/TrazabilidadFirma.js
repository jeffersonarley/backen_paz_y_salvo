const mongoose = require('mongoose');

const trazabilidadFirmaSchema = new mongoose.Schema({
    contrato_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contrato'
    },
    area_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DependenciaArea'
    },
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'Aprobado', 'Rechazado'],
        default: 'Pendiente'
    },
    observacion_rechazo: {
        type: String,
        default: null
    },
    hash_verificacion: {
        type: String,
        default: ''
    },
    fecha_firma: {
        type: Date
    }
}, {
    timestamps: true,
    collection: 'trazabilidad_firmas'
});

// Un área solo puede tener UN casillero de firma por contrato (evita duplicados al reabrir el flujo)
trazabilidadFirmaSchema.index({ contrato_id: 1, area_id: 1 }, { unique: true });
// Consultas frecuentes: pendientes/historial por área y verificación por hash
trazabilidadFirmaSchema.index({ area_id: 1, estado: 1 });
trazabilidadFirmaSchema.index({ hash_verificacion: 1 });

module.exports = mongoose.model('TrazabilidadFirma', trazabilidadFirmaSchema);