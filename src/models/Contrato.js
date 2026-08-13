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
        type: String,
        required: [true, 'La dependencia es obligatoria']
    },
    estado: {
        type: String,
        enum: ['Borrador', 'EnProceso', 'Pendiente de Firmas', 'Aprobado', 'Rechazado'],
        default: 'Borrador'
    },
    version_formato: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    collection: 'contratos_gccon_f088'
});

module.exports = mongoose.model('Contrato', contratoSchema);