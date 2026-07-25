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
    activo: {
        type: Boolean,
        default: true
    },
    intentos_fallidos: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    // Esto asegura que Mongoose consulte la colección exacta 'usuarios' que creaste en Compass
    collection: 'usuarios' 
});

module.exports = mongoose.model('Usuario', usuarioSchema);