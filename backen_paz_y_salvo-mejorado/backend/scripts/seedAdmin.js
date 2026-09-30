require('dotenv').config();
const conectarDB = require('../src/config/db');
const Usuario = require('../src/models/Usuario');
const { hashPassword } = require('../src/utils/password');
const validarPassword = require('../src/utils/validarPassword');

async function crearAdministrador() {
  try {
    await conectarDB();

    const datos = {
      nombre_completo: process.env.SEED_ADMIN_NOMBRE || 'Administrador General',
      correo_institucional: process.env.SEED_ADMIN_EMAIL || 'admin@institucion.edu.co',
      password: process.env.SEED_ADMIN_PASSWORD,
      rol: 'Administrador'
    };

    const politica = validarPassword(datos.password);
    if (!politica.valida) {
      throw new Error(`Defina SEED_ADMIN_PASSWORD en el .env. ${politica.mensaje}`);
    }

    const existente = await Usuario.findOne({ correo_institucional: datos.correo_institucional });
    if (existente) {
      console.log('El Administrador ya existe en la base de datos:', datos.correo_institucional);
      process.exit(0);
    }

    const password_hash = await hashPassword(datos.password);

    const nuevo = new Usuario({
      nombre_completo: datos.nombre_completo,
      correo_institucional: datos.correo_institucional,
      password_hash,
      rol: datos.rol,
      activo: true
    });

    await nuevo.save();
    console.log('Administrador creado:', datos.correo_institucional);
    process.exit(0);
  } catch (error) {
    console.error('Error creando administrador:', error.message);
    process.exit(1);
  }
}

crearAdministrador();
