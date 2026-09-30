const bcrypt = require('bcrypt');

// Costo de bcrypt (12 ≈ 250 ms por hash: razonable frente a fuerza bruta offline)
const BCRYPT_ROUNDS = 12;

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

module.exports = { hashPassword, BCRYPT_ROUNDS };
