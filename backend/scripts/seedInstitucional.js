require('dotenv').config();
const mongoose = require('mongoose');
const conectarDB = require('../src/config/db');
const Usuario = require('../src/models/Usuario');
const DependenciaArea = require('../src/models/DependenciaArea');
const Contrato = require('../src/models/Contrato');
const BienEntregado = require('../src/models/BienEntregado');
const TrazabilidadFirma = require('../src/models/TrazabilidadFirma');
const HistorialAuditoria = require('../src/models/HistorialAuditoria');
const { hashPassword } = require('../src/utils/password');

const DEPENDENCIAS = [
    { nombre: 'GESTIÓN DE TIC', responsables: ['franklin.chacon@sena.edu.co'] },
    { nombre: 'ADMINISTRACIÓN DE DOCUMENTOS', responsables: ['hilda.ramirez@sena.edu.co'] },
    { nombre: 'SECRETARÍA GENERAL', responsables: ['johon.sanabria@sena.edu.co'] },
    { nombre: 'ALMACÉN E INVENTARIOS', responsables: ['martha.almacen@sena.edu.co'] },
    { nombre: 'SERVICIOS GENERALES, ADQUISICIONES', responsables: ['juan.silva@sena.edu.co'] },
    { nombre: 'CONTABILIDAD', responsables: ['zaida.melgarejo@sena.edu.co'] },
    { nombre: 'TESORERÍA', responsables: ['nelcy.mayorga@sena.edu.co'] },
    { nombre: 'COORDINACIÓN DE: ÁREA/GRUPO/ACADÉMICA', responsables: ['johon.sanabria@sena.edu.co'] },
    { nombre: 'BIBLIOTECA', responsables: ['andrea.celis@sena.edu.co'] },
    { nombre: 'OTRO (LÍDER SIGA)', responsables: ['zaida.garcia@sena.edu.co'] },
    { nombre: 'OTRO (ADMINISTRACIÓN EDUCATIVA)', responsables: ['erika.gomez@sena.edu.co'] },
    { nombre: 'APOYO AL SEGUIMIENTO DE LOS PROCESOS ADMINISTRATIVOS Y NOVEDADES', responsables: ['nelson.duarte@sena.edu.co', 'eileen.hurtado@sena.edu.co'] },
    { nombre: 'APOYO ETAPA PRODUCTIVA', responsables: ['karen.garcia@sena.edu.co'] },
];

const USUARIOS = [
    { nombre: 'Administrador General', correo: 'admin@gccon.com', password: 'admin', rol: 'Administrador', cargo: 'Administrador del Sistema', documento: '1095000001', casilla: 'Todas las áreas' },
    { nombre: 'Ing. Carlos Supervisor', correo: 'supervisor@gccon.com', password: 'super', rol: 'Supervisor', cargo: 'Supervisor de Contratos TIC', documento: '1095000003', casilla: 'Fila 14 (Supervisor)' },
    { nombre: 'Dra. Ana María Gómez', correo: 'agomez@sena.edu.co', password: '123', rol: 'Supervisor', cargo: 'Supervisora Senior', documento: '1095000004', casilla: 'Fila 14 (Supervisor)' },
    { nombre: 'Ing. Fernando Ramírez', correo: 'f.ramirez@sena.edu.co', password: '123', rol: 'Supervisor', cargo: 'Supervisor Infraestructura', documento: '1095000005', casilla: 'Fila 14 (Supervisor)' },
    { nombre: 'Carlos Eduardo Mendoza', correo: 'carlos.mendoza@email.com', password: '123', rol: 'Contratista', cargo: 'Consultor en Redes', documento: '1097890123', casilla: 'CNT-2026-042' },
    { nombre: 'Laura Andrea Contratista', correo: 'contratista@gccon.com', password: '123', rol: 'Contratista', cargo: 'Especialista en Soporte', documento: '1095432189', casilla: 'CNT-2026-014' },
    { nombre: 'Juan Carlos Pérez', correo: 'juan.perez@correo.com', password: '123', rol: 'Contratista', cargo: 'Desarrollador Full-Stack', documento: '1098765432', casilla: 'CNT-2025-088' },
    { nombre: 'María Fernanda Gómez', correo: 'maria.gomez@correo.com', password: '123', rol: 'Contratista', cargo: 'Instructora Telemática', documento: '1094321765', casilla: 'CNT-2026-029' },
    { nombre: 'Diego Morales Castro', correo: 'diego.morales@correo.com', password: '123', rol: 'Contratista', cargo: 'Técnico Mantenimiento', documento: '1096543210', casilla: 'CNT-2026-055' },
    { nombre: 'Franklin Rolando Chacón', correo: 'franklin.chacon@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Gestión de TIC', documento: '1095111001', casilla: 'Fila 01' },
    { nombre: 'Hilda Lucía Ramírez', correo: 'hilda.ramirez@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Admin. Documentos', documento: '1095111002', casilla: 'Fila 02' },
    { nombre: 'Johon Fredy Sanabria', correo: 'johon.sanabria@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Coordinación Académica', documento: '1095111003', casilla: 'Fila 03' },
    { nombre: 'Lic. Martha Almacén', correo: 'martha.almacen@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Almacén e Inventarios', documento: '1095111004', casilla: 'Fila 04' },
    { nombre: 'Juan David Silva', correo: 'juan.silva@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Servicios Generales', documento: '1095111005', casilla: 'Fila 05' },
    { nombre: 'Zaida Leny Melgarejo', correo: 'zaida.melgarejo@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Contabilidad', documento: '1095111006', casilla: 'Fila 06' },
    { nombre: 'Nelcy Mabel Mayorga', correo: 'nelcy.mayorga@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Tesorería', documento: '1095111007', casilla: 'Fila 07' },
    { nombre: 'Andrea Juliana Celis', correo: 'andrea.celis@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Biblioteca', documento: '1095111008', casilla: 'Fila 08' },
    { nombre: 'Zaida Jeleidy García', correo: 'zaida.garcia@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Líder SIGA', documento: '1095111009', casilla: 'Fila 09' },
    { nombre: 'Erika Johana Gómez', correo: 'erika.gomez@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Admin. Educativa', documento: '1095111010', casilla: 'Fila 10' },
    { nombre: 'Nelson Fabián Duarte', correo: 'nelson.duarte@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Seguimiento Administrativo', documento: '1095111011', casilla: 'Fila 11' },
    { nombre: 'Karen Andrea García', correo: 'karen.garcia@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Apoyo Etapa Productiva', documento: '1095111012', casilla: 'Fila 12' },
    { nombre: 'Eileen Erlensi Hurtado', correo: 'eileen.hurtado@sena.edu.co', password: '123', rol: 'ResponsableArea', cargo: 'Apoyo Novedades', documento: '1095111013', casilla: 'Fila 13' },
];

async function limpiarBase() {
    await Promise.all([
        Contrato.deleteMany({}),
        BienEntregado.deleteMany({}),
        TrazabilidadFirma.deleteMany({}),
        HistorialAuditoria.deleteMany({}),
        Usuario.deleteMany({}),
        DependenciaArea.deleteMany({}),
    ]);
}

async function crearUsuarios() {
    const creados = new Map();
    for (const datos of USUARIOS) {
        const password_hash = await hashPassword(datos.password);
        const usuario = new Usuario({
            nombre_completo: datos.nombre,
            correo_institucional: datos.correo,
            password_hash,
            rol: datos.rol,
            cargo: datos.cargo,
            documento: datos.documento,
            casilla: datos.casilla,
            activo: true,
            intentos_fallidos: 0,
            bloqueado_hasta: null,
        });
        await usuario.save();
        creados.set(datos.correo, usuario);
        console.log(`✔ ${datos.rol}: ${datos.correo}`);
    }
    return creados;
}

async function crearDependencias(usuarios) {
    for (const dep of DEPENDENCIAS) {
        const responsables = dep.responsables.map((correo) => {
            const usuario = usuarios.get(correo);
            if (!usuario) throw new Error(`Responsable no encontrado: ${correo}`);
            return usuario._id;
        });
        const dependencia = await DependenciaArea.create({
            nombre_dependencia: dep.nombre,
            activo: true,
            responsable_id: responsables[0] || null,
            responsables_ids: responsables,
        });
        for (const responsableId of responsables) {
            const usuario = await Usuario.findById(responsableId);
            if (!usuario.dependencia_id) {
                usuario.dependencia_id = dependencia._id;
                await usuario.save();
            }
        }
        console.log(`✔ Dependencia: ${dep.nombre}`);
    }
}

async function asignarSupervisor(usuarios) {
    const supervisor = usuarios.get('supervisor@gccon.com');
    for (const usuario of usuarios.values()) {
        if (usuario.rol === 'Contratista') {
            usuario.supervisor_id = supervisor._id;
            await usuario.save();
        }
    }
}

async function ejecutar() {
    if (!process.argv.includes('--reset')) {
        console.error('Este script borra usuarios, dependencias y datos asociados.');
        console.error('Ejecútelo con: node scripts/seedInstitucional.js --reset');
        process.exit(1);
    }

    await conectarDB();
    console.log('Limpiando datos existentes...');
    await limpiarBase();

    const usuarios = await crearUsuarios();
    await crearDependencias(usuarios);
    await asignarSupervisor(usuarios);

    console.log(`\nSeed institucional finalizado: ${usuarios.size} usuarios y ${DEPENDENCIAS.length} dependencias.`);
    await mongoose.disconnect();
    process.exit(0);
}

ejecutar().catch((error) => {
    console.error('Error en seed institucional:', error.message);
    process.exit(1);
});
