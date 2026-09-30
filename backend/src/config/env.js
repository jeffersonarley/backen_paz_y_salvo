require('dotenv').config();
const crypto = require('crypto');

// Lee una variable obligatoria. Sin valores por defecto: si falta, la app no debe arrancar.
const requerida = (nombre) => {
  const valor = process.env[nombre];
  if (!valor || !valor.trim()) {
    throw new Error(`Falta la variable de entorno obligatoria ${nombre}. Revise backend/.env.example.`);
  }
  return valor.trim();
};

const esProduccion = () => process.env.NODE_ENV === 'production';

const getJwtSecret = () => {
  const secreto = requerida('JWT_SECRET');
  if (esProduccion() && secreto.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
  }
  return secreto;
};

const getMongoUri = () => requerida('MONGODB_URI');

// Secreto para firmar los hashes de verificación. Si no se define HASH_SECRET
// se deriva de JWT_SECRET (de forma que ambos usos no compartan la misma clave).
const getHashSecret = () => {
  if (process.env.HASH_SECRET && process.env.HASH_SECRET.trim()) return process.env.HASH_SECRET.trim();
  return crypto.createHmac('sha256', getJwtSecret()).update('pazysalvo:hash-verificacion').digest('hex');
};

// Validación temprana al arrancar (server.js y api/index.js)
const validarEntorno = () => {
  getJwtSecret();
  getMongoUri();
};

module.exports = { getJwtSecret, getMongoUri, getHashSecret, validarEntorno, esProduccion };
