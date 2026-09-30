const mongoose = require('mongoose');
const { getMongoUri } = require('./env');

// Conexión reutilizable: en serverless (Vercel) el módulo se conserva entre invocaciones,
// así que se guarda la promesa para no abrir una conexión nueva en cada petición.
let conexionPendiente = null;

const conectarDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!conexionPendiente) {
        conexionPendiente = mongoose.connect(getMongoUri()).catch((error) => {
            conexionPendiente = null;
            throw error;
        });
    }

    await conexionPendiente;
    console.log('✅ Conexión exitosa a MongoDB:', mongoose.connection.name);
    return mongoose.connection;
};

module.exports = conectarDB;
