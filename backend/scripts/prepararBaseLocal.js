// Prepara una base de datos LOCAL con una copia de los datos reales (Atlas) y un
// conjunto de cuentas de prueba con contraseñas conocidas.
//
//   MONGODB_URI=<origen> MONGODB_URI_LOCAL=<destino> node scripts/prepararBaseLocal.js
//
// La base de origen SOLO se lee: nunca se escribe en ella.
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ORIGEN = process.env.MONGODB_URI;
const DESTINO = process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/pazysalvo_prueba';

const COLECCIONES = [
    'usuarios',
    'dependencias_areas',
    'contratos_gccon_f088',
    'bienes_entregados',
    'trazabilidad_firmas',
    'formato_config',
];

const CUENTAS_PRUEBA = [
    { nombre_completo: 'Administrador de Prueba', correo_institucional: 'admin@prueba.co', password: 'AdminSeguro123!', rol: 'Administrador' },
    { nombre_completo: 'Coordinador Carlos Pérez', correo_institucional: 'coordinador@prueba.co', password: 'Coordinador123!', rol: 'Supervisor' },
    { nombre_completo: 'Coordinador Ana Gómez', correo_institucional: 'coordinadora@prueba.co', password: 'Coordinador123!', rol: 'Supervisor' },
    { nombre_completo: 'Responsable TIC Franklin Chacon', correo_institucional: 'tic@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Responsable Almacén Martha Ríos', correo_institucional: 'almacen@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Responsable Coordination Johon Sanabria', correo_institucional: 'academica@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Apoyo Supervisión Nelson Duarte', correo_institucional: 'apoyo@prueba.co', password: 'Responsable123!', rol: 'ResponsableArea' },
    { nombre_completo: 'Contratista Juan Guerrero', correo_institucional: 'contratista@prueba.co', password: 'Contratista123!', rol: 'Contratista' },
];

// Dependencias de apoyo para la prueba (solo si no existen en la base copiada)
const DEPENDENCIAS_PRUEBA = [
    'Coordinación Académica y Formación',
    'Gestión de Talento Humano',
    'Apoyo a Procesos Administrativos y Novedades',
];

async function main() {
    if (!ORIGEN) {
        console.error('Falta MONGODB_URI (base de datos de origen).');
        process.exit(1);
    }

    const origen = mongoose.createConnection(ORIGEN, { serverSelectionTimeoutMS: 20000 });
    const destino = mongoose.createConnection(DESTINO, { serverSelectionTimeoutMS: 20000 });
    await origen.asPromise();
    await destino.asPromise();

    await destino.db.dropDatabase();
    console.log('Base local vaciada:', DESTINO);

    for (const coleccion of COLECCIONES) {
        const documentos = await origen.db.collection(coleccion).find({}).toArray();
        if (documentos.length) {
            await destino.db.collection(coleccion).insertMany(documentos);
        }
        console.log(`  ${coleccion}: ${documentos.length} documentos copiados`);
    }

    const usuarios = destino.db.collection('usuarios');
    const dependencias = destino.db.collection('dependencias_areas');

    // Cuentas de prueba con contraseña conocida
    const ids = {};
    for (const cuenta of CUENTAS_PRUEBA) {
        const existente = await usuarios.findOne({ correo_institucional: cuenta.correo_institucional });
        if (existente) {
            ids[cuenta.correo_institucional] = existente._id;
            continue;
        }
        const password_hash = await bcrypt.hash(cuenta.password, 10);
        const resultado = await usuarios.insertOne({
            nombre_completo: cuenta.nombre_completo,
            correo_institucional: cuenta.correo_institucional,
            password_hash,
            rol: cuenta.rol,
            activo: true,
            intentos_fallidos: 0,
            plantilla_predeterminada: 'COMPLETA',
            dependencia_id: null,
            supervisor_id: null,
            apoyo_supervision_id: null,
        });
        ids[cuenta.correo_institucional] = resultado.insertedId;
    }
    console.log(`  ${CUENTAS_PRUEBA.length} cuentas de prueba listas`);

    // El contratista de prueba cuelga del coordinador de prueba
    await usuarios.updateOne(
        { _id: ids['contratista@prueba.co'] },
        { $set: { supervisor_id: ids['coordinador@prueba.co'] } }
    );
    // Apoyo de supervisión del coordinador
    await usuarios.updateOne(
        { _id: ids['coordinador@prueba.co'] },
        { $set: { apoyo_supervision_id: ids['apoyo@prueba.co'] } }
    );

    // Dependencias que necesita la prueba
    const asegurarDependencia = async (nombre) => {
        const existente = await dependencias.findOne({ nombre_dependencia: nombre });
        if (existente) return existente._id;
        const resultado = await dependencias.insertOne({
            nombre_dependencia: nombre,
            activo: true,
            responsable_id: null,
            responsables_ids: [],
        });
        return resultado.insertedId;
    };

    const idTic = ids['tic@prueba.co'];
    const idAlmacen = ids['almacen@prueba.co'];
    const idAcademica = ids['academica@prueba.co'];
    const idCoordinador = ids['coordinador@prueba.co'];

    const depTic = await asegurarDependencia('Gestión Tecnológica (TIC)');
    const depAlmacen = await asegurarDependencia('Almacén e Inventarios');
    const depAcademica = await asegurarDependencia('Coordinación Académica y Formación');
    for (const nombre of DEPENDENCIAS_PRUEBA.slice(1)) {
        await asegurarDependencia(nombre);
    }

    // Responsables (varios por dependencia) y dependencia principal de cada persona
    await dependencias.updateOne(
        { _id: depTic },
        { $set: { responsable_id: idTic, responsables_ids: [idTic, idAlmacen], activo: true } }
    );
    await dependencias.updateOne(
        { _id: depAlmacen },
        { $set: { responsable_id: idAlmacen, responsables_ids: [idAlmacen], activo: true } }
    );
    await dependencias.updateOne(
        { _id: depAcademica },
        { $set: { responsable_id: idAcademica, responsables_ids: [idAcademica], activo: true } }
    );

    await usuarios.updateOne({ _id: idTic }, { $set: { dependencia_id: depTic } });
    await usuarios.updateOne({ _id: idAlmacen }, { $set: { dependencia_id: depAlmacen } });
    await usuarios.updateOne({ _id: idAcademica }, { $set: { dependencia_id: depAcademica } });
    // El coordinador tiene dependencia propia y puede quedar como responsable
    await usuarios.updateOne({ _id: idCoordinador }, { $set: { dependencia_id: depTic } });
    await dependencias.updateOne(
        { _id: depTic },
        { $set: { responsables_ids: [idTic, idAlmacen, idCoordinador] } }
    );

    // Dependencias duplicadas del Atlas que se superponen con el formato: se desactivan
    await dependencias.updateMany(
        { nombre_dependencia: { $in: ['Gestión Tecnológica', 'Biblioteca', 'Test Dependency', 'Automated Test Dependency', 'dependeciaparacontrato', 'supervisor'] } },
        { $set: { activo: false } }
    );

    console.log('Base local lista. Cuentas de prueba:');
    for (const cuenta of CUENTAS_PRUEBA) {
        console.log(`  ${cuenta.rol.padEnd(14)} ${cuenta.correo_institucional.padEnd(28)} ${cuenta.password}`);
    }

    await origen.close();
    await destino.close();
}

main().catch((error) => {
    console.error('Error preparando la base local:', error.message);
    process.exit(1);
});
