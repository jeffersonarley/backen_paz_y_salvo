const mongoose = require('mongoose');

const contratoSchema = new mongoose.Schema({
    numero_contrato: {
        type: String,
        required: [true, 'El número de contrato es obligatorio'],
        unique: true,
        trim: true
    },
    nombre_contratista: {
        type: String,
        required: [true, 'El nombre del contratista es obligatorio'],
        trim: true
    },
    correo_contratista: {
        type: String,
        required: [true, 'El correo del contratista es obligatorio'],
        lowercase: true,
        trim: true
    },
    telefono: {
        type: String,
        trim: true
    },
    dependencia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DependenciaArea',
        required: [true, 'La dependencia es obligatoria']
    },
    objeto_contractual: {
        type: String,
        trim: true,
        default: null
    },
    fecha_inicio: {
        type: Date,
        default: null
    },
    fecha_fin: {
        type: Date,
        default: null
    },
    adjunto_nombre: {
        type: String,
        trim: true,
        default: null
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    estado: {
        type: String,
        enum: ['Borrador', 'EnProceso', 'Pendiente de Firmas', 'Aprobado', 'Rechazado', 'Finalizado'],
        default: 'Borrador'
    },
    observaciones_supervisor: {
        type: String,
        default: null
    },
    version_formato: {
        type: Number,
        default: 1
    },
    // Plantilla de dependencias y firmantes seleccionada por el Supervisor (Coordinador)
    plantilla_tipo: {
        type: String,
        default: 'COMPLETA',
        trim: true
    },
    plantilla_firmantes: [{
        id_fila: { type: Number, default: null },
        dependencia_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DependenciaArea', default: null },
        dependencia_nombre: { type: String, default: '', trim: true },
        responsables: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }], default: [] },
        nombres: { type: [String], default: [] },
        aplica: { type: Boolean, default: true },
        marca: { type: String, default: 'X' }
    }]
}, {
    timestamps: true,
    collection: 'contratos_gccon_f088'
});

contratoSchema.index({ usuario: 1, createdAt: -1 });
contratoSchema.index({ supervisor: 1, estado: 1 });

module.exports = mongoose.model('Contrato', contratoSchema);