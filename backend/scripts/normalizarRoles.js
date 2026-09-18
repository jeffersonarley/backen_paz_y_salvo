require('dotenv').config();
const conectarDB = require('../src/config/db');
const Usuario = require('../src/models/Usuario');
const normalizarRol = require('../src/utils/normalizarRol');

// Permite apuntar a otra BD (ej. Atlas) sin tocar .env:
//   DB_URI=mongodb+srv://... node scripts/normalizarRoles.js
if (process.env.DB_URI) {
  process.env.MONGODB_URI = process.env.DB_URI;
}

const ROLES_CANONICOS = ['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista'];

async function normalizarRoles() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pazysalvo_sena';
    await conectarDB();

    const usuarios = await Usuario.find({ rol: { $nin: ROLES_CANONICOS } }).lean();
    const corrigeNombreBD = mongooseConnectionName();

    console.log(`Usuarios con rol no canónico en ${corrigeNombreBD}: ${usuarios.length}`);

    if (usuarios.length === 0) {
      console.log('Nada que corregir.');
      process.exit(0);
    }

    for (const u of usuarios) {
      const nuevo = normalizarRol(u.rol);
      if (!ROLES_CANONICOS.includes(nuevo)) {
        console.log(`⚠️  No se pudo normalizar el rol "${u.rol}" de ${u.correo_institucional}. Salteando.`);
        continue;
      }
      await Usuario.updateOne({ _id: u._id }, { $set: { rol: nuevo } });
      console.log(`✔  ${u.correo_institucional}: "${u.rol}" -> "${nuevo}"`);
    }

    console.log('Normalización completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error normalizando roles:', error.message);
    process.exit(1);
  }
}

function mongooseConnectionName() {
  const state = require('mongoose').connection;
  return state.name || 'unknown';
}

normalizarRoles();