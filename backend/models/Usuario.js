const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre_completo: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },
    correo_institucional: {
        type: String,
        required: [true, 'El correo institucional es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password_hash: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    rol: {
        type: String,
        enum: ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'],
        default: 'Contratista'
    },
    telefono: {
        type: String,
        trim: true
    },
    dependencia_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DependenciaArea',
        default: null
    },
    supervisor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    cargo: {
        type: String,
        trim: true
    },
    activo: {
        type: Boolean,
        default: true
    },
    intentos_fallidos: {
        type: Number,
        default: 0
    },
    bloqueado_hasta: {
        type: Date,
        default: null
    },
    token_recuperacion: {
        type: String,
        default: null
    },
    token_expiracion: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    // Esto asegura que Mongoose consulte la colección exacta 'usuarios' que creaste en Compass
    collection: 'usuarios' 
});

module.exports = mongoose.model('Usuario', usuarioSchema);