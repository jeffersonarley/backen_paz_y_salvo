require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../src/models/Usuario');
const DependenciaArea = require('../src/models/DependenciaArea');
const { hashPassword } = require('../src/utils/password');

const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pazysalvo_prueba';

const USUARIOS = [
    { nombre_completo: 'Administrador General', correo_institucional: 'admin@prueba.co', password: 'AdminSeguro123!', rol: 'Administrador' },
    { nombre_completo: 'Coordinador Carlos Pérez', correo_institucional: 'coordinador@prueba.co', password: 'Coordinador123!', rol: 'Supervisor' },
    { nombre_completo: 'Coordinador Ana Gómez', correo_institucional: 'coordinadora@prueba.co', password: 'Coordinador123!', rol: 'Supervisor' },
    { nombre_completo: 'Responsable TIC Franklin Chacon', correo_institucional: 'tic@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Responsable Almacén Martha Ríos', correo_institucional: 'almacen@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Responsable Coordination Johon Sanabria', correo_institucional: 'academica@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Apoyo Supervisión Nelson Duarte', correo_institucional: 'apoyo@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Contratista Juan Guerrero', correo_institucional: 'contratista@prueba.co', password: 'Contratista123!', rol: 'Contratista' },
];

const DEPENDENCIAS = [
    'Gestión Tecnológica (TIC)',
    'Almacén e Inventarios',
    'Coordinación Académica y Formación',
    'Biblioteca y Archivo',
    'Secretaría General',
];

(async () => {
    await mongoose.connect(MONGO);
    await mongoose.connection.dropDatabase();
    console.log('Base de datos de prueba limpia');

    const hash = await hashPassword('Temporal123!');
    for (const d of USUARIOS) {
        const u = new Usuario({
            nombre_completo: d.nombre_completo,
            correo_institucional: d.correo_institucional,
            password_hash: await hashPassword(d.password),
            rol: d.rol,
            activo: true,
            telefono: '3000000000',
        });
        await u.save();
    }
    console.log('Usuarios creados:', USUARIOS.length);

    for (const nombre of DEPENDENCIAS) {
        await DependenciaArea.create({ nombre_dependencia: nombre, activo: true });
    }
    console.log('Dependencias creadas:', DEPENDENCIAS.length);

    await mongoose.disconnect();
    process.exit(0);
})();
