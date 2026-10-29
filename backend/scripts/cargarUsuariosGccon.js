// Carga (en la base LOCAL) el cuadro de-functional de usuarios del GCCON-F-088:
// crea los usuarios que falten, con su contraseña del cuadro, y asigna a cada
// responsable de área su dependencia y la fila del formato que le corresponde.
//
//   node scripts/cargarUsuariosGccon.js
//
// La base de datos de origen (Atlas) NO se modifica.
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const DESTINO = process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/pazysalvo_prueba';

// [nombre, correo, contraseña, rol, cargo, dependencia principal]
const USUARIOS = [
    ['Administrador General', 'admin@gccon.com', 'admin', 'Administrador', 'Administrador del Sistema', null],
    ['Paula Administradora', 'paula.admin@gccon.com', '123', 'Administrador', 'Coordinadora Aseguramiento', null],
    ['Ing. Carlos Supervisor', 'supervisor@gccon.com', 'super', 'Supervisor', 'Supervisor de Contratos TIC', 'Supervisión de Contratos'],
    ['Dra. Ana María Gómez', 'agomez@sena.edu.co', '123', 'Supervisor', 'Supervisora Senior', 'Supervisión de Calidad'],
    ['Ing. Fernando Ramírez', 'f.ramirez@sena.edu.co', '123', 'Supervisor', 'Supervisor Infraestructura', 'Supervisión de Obras'],
    ['Carlos Eduardo Mendoza', 'carlos.mendoza@email.com', '123', 'Contratista', 'Consultor en Redes', null],
    ['Laura Andrea Contratista', 'contratista@gccon.com', '123', 'Contratista', 'Especialista en Soporte', null],
    ['Juan Carlos Pérez', 'juan.perez@correo.com', '123', 'Contratista', 'Desarrollador Full-Stack', null],
    ['María Fernanda Gómez', 'maria.gomez@correo.com', '123', 'Contratista', 'Instructora Telemática', null],
    ['Diego Morales Castro', 'diego.morales@correo.com', '123', 'Contratista', 'Técnico Mantenamiento', null],
    ['Franklin Rolando Chacón', 'franklin.chacon@sena.edu.co', '123', 'ResponsableArea', 'Gestión de TIC', 'Gestión Tecnológica (TIC)'],
    ['Hilda Lucía Ramírez', 'hilda.ramirez@sena.edu.co', '123', 'ResponsableArea', 'Admin. Documentos', 'Administración de Documentos'],
    ['Johon Fredy Sanabria', 'johon.sanabria@sena.edu.co', '123', 'ResponsableArea', 'Coordinación Académica', 'Coordinación Académica'],
    ['Lic. Martha Almacén', 'martha.almacen@sena.edu.co', '123', 'ResponsableArea', 'Almacén e Inventarios', 'Almacén e Inventarios'],
    ['Juan David Silva', 'juan.silva@sena.edu.co', '123', 'ResponsableArea', 'Servicios Generales', 'Infraestructura y Servicios Generales'],
    ['Zaida Leny Melgarejo', 'zaida.melgarejo@sena.edu.co', '123', 'ResponsableArea', 'Contabilidad', 'Contabilidad'],
    ['Nelcy Mabel Mayorga', 'nelcy.mayorga@sena.edu.co', '123', 'ResponsableArea', 'Tesorería', 'Tesorería'],
    ['Andrea Juliana Celis', 'andrea.celis@sena.edu.co', '123', 'ResponsableArea', 'Biblioteca', 'Biblioteca y Archivo'],
    ['Zaida Jeleidy García', 'zaida.garcia@sena.edu.co', '123', 'ResponsableArea', 'Líder SIGA', 'Líder SIGA'],
    ['Erika Johana Gómez', 'erika.gomez@sena.edu.co', '123', 'ResponsableArea', 'Admin. Educativa', 'Administración Educativa'],
    ['Nelson Fabián Duarte', 'nelson.duarte@sena.edu.co', '123', 'ResponsableArea', 'Seguimiento Administrativo', 'Apoyo a Procesos Administrativos y Novedades'],
    ['Karen Andrea García', 'karen.garcia@sena.edu.co', '123', 'ResponsableArea', 'Apoyo Etapa Productiva', 'ETAPA PRODUCTIVA'],
    ['Eileen Erlensi Hurtado', 'eileen.hurtado@sena.edu.co', '123', 'ResponsableArea', 'Apoyo Novedades', 'Apoyo a Procesos Administrativos y Novedades'],
];

// Dependencias que deben existir para el formato (se crean si no están)
const DEPENDENCIAS_NECESARIAS = [
    'Administración de Documentos',
    'Contabilidad',
    'Tesorería',
    'Líder SIGA',
    'Administración Educativa',
    'Apoyo a Procesos Administrativos y Novedades',
    'Supervisión de Contratos',
    'Supervisión de Calidad',
    'Supervisión de Obras',
];

async function main() {
    const conexion = mongoose.createConnection(DESTINO, { serverSelectionTimeoutMS: 20000 });
    await conexion.asPromise();

    const usuarios = conexion.db.collection('usuarios');
    const dependencias = conexion.db.collection('dependencias_areas');

    // Dependencias necesarias
    for (const nombre of DEPENDENCIAS_NECESARIAS) {
        const existente = await dependencias.findOne({ nombre_dependencia: nombre });
        if (!existente) {
            await dependencias.insertOne({
                nombre_dependencia: nombre,
                activo: true,
                responsable_id: null,
                responsables_ids: [],
            });
            console.log('  dependencia creada:', nombre);
        }
    }

    // Usuarios
    const ids = {};
    for (const [nombre, correo, password, rol, cargo, dependencia] of USUARIOS) {
        const password_hash = await bcrypt.hash(password, 10);
        const existente = await usuarios.findOne({ correo_institucional: correo });
        if (existente) {
            ids[correo] = existente._id;
            await usuarios.updateOne(
                { _id: existente._id },
                { $set: { nombre_completo: nombre, rol, cargo, activo: true, intentos_fallidos: 0, bloqueado_hasta: null } }
            );
            // En la base local se restablece la contraseña del cuadro para permitir la prueba
            await usuarios.updateOne(
                { _id: existente._id },
                { $set: { password_hash } }
            );
        } else {
            const resultado = await usuarios.insertOne({
                nombre_completo: nombre,
                correo_institucional: correo,
                password_hash,
                rol,
                cargo,
                activo: true,
                intentos_fallidos: 0,
                dependencia_id: null,
                supervisor_id: null,
                apoyo_supervision_id: null,
                plantilla_predeterminada: 'COMPLETA',
            });
            ids[correo] = resultado.insertedId;
            console.log('  usuario creado:', correo, `(${rol})`);
        }
    }

    // Dependencia principal de cada persona y lista de responsables de cada dependencia
    for (const [nombre, correo, , rol, , dependencia] of USUARIOS) {
        if (!dependencia) continue;
        const dep = await dependencias.findOne({ nombre_dependencia: dependencia });
        if (!dep) continue;

        await usuarios.updateOne({ _id: ids[correo] }, { $set: { dependencia_id: dep._id } });

        const responsables = (dep.responsables_ids || []).map(String);
        if (!responsables.includes(String(ids[correo]))) {
            responsables.push(String(ids[correo]));
        }
        await dependencias.updateOne(
            { _id: dep._id },
            {
                $set: {
                    responsables_ids: responsables.map((id) => new mongoose.Types.ObjectId(id)),
                    responsable_id: new mongoose.Types.ObjectId(responsables[0]),
                    activo: true,
                },
            }
        );
    }

    // Los contratistas cuelgan del Ing. Carlos Supervisor
    const supervisorId = ids['supervisor@gccon.com'];
    const contratistas = ['carlos.mendoza@email.com', 'contratista@gccon.com', 'juan.perez@correo.com', 'maria.gomez@correo.com', 'diego.morales@correo.com'];
    for (const correo of contratistas) {
        await usuarios.updateOne({ _id: ids[correo] }, { $set: { supervisor_id: supervisorId } });
    }

    // El Ing. Carlos Supervisor es el apoyo de los otros supervisores y tiene dependencia propia
    await usuarios.updateOne(
        { _id: ids['agomez@sena.edu.co'] },
        { $set: { apoyo_supervision_id: ids['supervisor@gccon.com'] } }
    );

    // Limpieza: se retiran las cuentas de prueba (@prueba.co) y la dependencia de prueba
    const pruebas = await usuarios.find({ correo_institucional: { $regex: /@prueba\.co$/ } }).toArray();
    for (const usuario of pruebas) {
        await usuarios.deleteOne({ _id: usuario._id });
        await dependencias.updateMany(
            { $or: [{ responsable_id: usuario._id }, { responsables_ids: usuario._id }] },
            { $pull: { responsables_ids: usuario._id } }
        );
    }
    await dependencias.deleteMany({ nombre_dependencia: { $regex: /^Prueba Admin/ } });
    await dependencias.updateMany(
        { nombre_dependencia: { $in: ['Seguimiento Administrativo y Novedades', 'Coordinación Académica y Formación', 'Gestión de Talento Humano'] } },
        { $set: { activo: false } }
    );
    if (pruebas.length) console.log(`  ${pruebas.length} cuentas de prueba (@prueba.co) retiradas`);

    // Contratos del cuadro: se vinculan a su contratista y al Ing. Carlos Supervisor
    const CONTRATOS = [
        ['CNT-2026-042', 'Carlos Eduardo Mendoza', 'carlos.mendoza@email.com'],
        ['CNT-2026-014', 'Laura Andrea Contratista', 'contratista@gccon.com'],
        ['CNT-2025-088', 'Juan Carlos Pérez', 'juan.perez@correo.com'],
        ['CNT-2026-029', 'María Fernanda Gómez', 'maria.gomez@correo.com'],
        ['CNT-2026-055', 'Diego Morales Castro', 'diego.morales@correo.com'],
    ];
    const contratos = conexion.db.collection('contratos_gccon_f088');
    for (const [numero, nombre, correo] of CONTRATOS) {
        const contrato = await contratos.findOne({ numero_contrato: numero });
        if (!contrato) {
            console.log('  contrato no encontrado:', numero);
            continue;
        }
        await contratos.updateOne(
            { _id: contrato._id },
            {
                $set: {
                    usuario: ids[correo],
                    nombre_contratista: nombre,
                    correo_contratista: correo,
                    supervisor: supervisorId,
                },
            }
        );
    }
    console.log(`  ${CONTRATOS.length} contratos del cuadro vinculados a su contratista`);

    console.log('Cuadro de usuarios cargado. Verifica los accesos:');
    for (const [nombre, correo, password, rol] of USUARIOS) {
        console.log(`  ${rol.padEnd(15)} ${correo.padEnd(30)} ${password}`);
    }

    await conexion.close();
}

main().catch((error) => {
    console.error('Error cargando el cuadro de usuarios:', error.message);
    process.exit(1);
});
