const mongoose = require('mongoose');

const conectarDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb+srv://paz_y_salvo:ORIenbephYWtdv84@cluster0.cenmibs.mongodb.net/pazysalvo_sena';
        await mongoose.connect(uri);
        console.log('✅ Conexión exitosa a MongoDB:', mongoose.connection.name);
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = conectarDB;