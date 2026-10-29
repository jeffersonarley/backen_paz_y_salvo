const mongoose = require('mongoose');

const dependenciaAreaSchema = new mongoose.Schema({
    nombre_dependencia: {
        type: String,
        required: [true, 'El nombre de la dependencia es obligatorio'],
        unique: true,
        trim: true
    },
    activo: {
        type: Boolean,
        default: true
    },
    responsable_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    // Varios responsables pueden quedar a cargo de la misma dependencia (cualquiera puede firmar)
    responsables_ids: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
        default: []
    }
}, {
    timestamps: true,
    collection: 'dependencias_areas'
});

module.exports = mongoose.model('DependenciaArea', dependenciaAreaSchema);