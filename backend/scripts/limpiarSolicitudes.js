require('dotenv').config();
const mongoose = require('mongoose');
const conectarDB = require('../src/config/db');
const Contrato = require('../src/models/Contrato');
const BienEntregado = require('../src/models/BienEntregado');
const TrazabilidadFirma = require('../src/models/TrazabilidadFirma');
const HistorialAuditoria = require('../src/models/HistorialAuditoria');

async function ejecutar() {
    await conectarDB();

    const resultados = await Promise.all([
        Contrato.deleteMany({}),
        BienEntregado.deleteMany({}),
        TrazabilidadFirma.deleteMany({}),
        HistorialAuditoria.deleteMany({}),
    ]);

    const nombres = ['contratos', 'bienes', 'firmas', 'auditoría'];
    resultados.forEach((resultado, indice) => {
        console.log(`✔ ${nombres[indice]}: ${resultado.deletedCount} eliminados`);
    });

    console.log('\nUsuarios y dependencias se conservan intactos.');
    await mongoose.disconnect();
    process.exit(0);
}

ejecutar().catch((error) => {
    console.error('Error al limpiar solicitudes:', error.message);
    process.exit(1);
});
