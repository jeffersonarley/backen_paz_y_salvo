require('dotenv').config();
const conectarDB = require('../src/config/db');
const Usuario = require('../src/models/Usuario');
const DependenciaArea = require('../src/models/DependenciaArea');
const { hashPassword } = require('../src/utils/password');
const validarPassword = require('../src/utils/validarPassword');

// Cuentas de desarrollo para el equipo (idempotente: corre contra Atlas compartida).
// Si el usuario ya existe NO se sobrescribe su contraseña; solo se desbloquea.
const USUARIOS_DEMO = [
    {
        nombre_completo: 'Administrador General',
        correo_institucional: process.env.SEED_ADMIN_EMAIL || 'admin@institucion.edu.co',
        password: process.env.SEED_ADMIN_PASSWORD || 'AdminSeguro123!',
        rol: 'Administrador',
    },
    {
        nombre_completo: 'Supervisor Demo',
        correo_institucional: 'supervisor.demo@sena.edu.co',
        password: 'Supervisor123!',
        rol: 'Supervisor',
    },
    {
        nombre_completo: 'Contratista Demo',
        correo_institucional: 'contratista.demo@sena.edu.co',
        password: 'Contratista123!',
        rol: 'Contratista',
    },
    {
        nombre_completo: 'Responsable de Área Demo',
        correo_institucional: 'responsable.demo@sena.edu.co',
        password: 'Responsable123!',
        rol: 'ResponsableArea',
    },
];

async function crearOSegurizar(datos, asignarArea = false) {
    const politica = validarPassword(datos.password);
    if (!politica.valida) {
        throw new Error(`${datos.correo_institucional}: ${politica.mensaje}`);
    }

    let usuario = await Usuario.findOne({ correo_institucional: datos.correo_institucional });

    if (!usuario) {
        usuario = new Usuario({
            nombre_completo: datos.nombre_completo,
            correo_institucional: datos.correo_institucional,
            password_hash: await hashPassword(datos.password),
            rol: datos.rol,
            activo: true,
        });
        await usuario.save();
        console.log(`✔ Creado ${datos.rol}: ${datos.correo_institucional} (contraseña: ${datos.password})`);
    } else {
        console.log(`• Ya existía ${datos.rol}: ${datos.correo_institucional} (se conserva su contraseña)`);
    }

    // Desbloquear siempre (autocura si alguien falló 3 intentos: bloqueo de 15 min)
    if (usuario.activo === false) usuario.activo = true;
    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta = null;

    // Opcional: vincular al ResponsableArea con una dependencia activa para que vea su bandeja
    if (asignarArea && !usuario.dependencia_id) {
        const area = await DependenciaArea.findOne({ activo: true });
        if (area) {
            usuario.dependencia_id = area._id;
            console.log(`↳ ${datos.correo_institucional} vinculado a dependencia: ${area.nombre_dependencia}`);
        }
    }

    await usuario.save();
}

async function ejecutar() {
    await conectarDB();
    for (const datos of USUARIOS_DEMO) {
        await crearOSegurizar(datos, datos.rol === 'ResponsableArea');
    }
    console.log('Seed de desarrollo finalizado.');
    process.exit(0);
}

ejecutar().catch((error) => {
    console.error('Error en seed de desarrollo:', error.message);
    process.exit(1);
});