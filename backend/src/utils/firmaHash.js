const crypto = require('crypto');
const { getHashSecret } = require('../config/env');

// Contenido que queda "sellado" por la firma de un área: contrato, inventario, área,
// quién firma y cuándo. Si algo de esto cambia después, el hash deja de coincidir.
const construirPayload = ({ contrato, bienes = [], area_id, usuario_id, fecha_firma }) => JSON.stringify({
  contrato: String(contrato._id),
  numero: contrato.numero_contrato,
  version_formato: contrato.version_formato,
  area: String(area_id),
  usuario: String(usuario_id),
  fecha: new Date(fecha_firma).toISOString(),
  bienes: bienes
    .map((b) => JSON.stringify([b.codigo_inventario, b.descripcion, b.cantidad, b.estado_bien]))
    .sort()
});

// HMAC-SHA256 con secreto del servidor: no se puede fabricar ni recalcular sin la clave.
const generarHashFirma = (datos) =>
  crypto.createHmac('sha256', getHashSecret()).update(construirPayload(datos)).digest('hex');

const hashCoincide = (esperado, calculado) => {
  const a = Buffer.from(String(esperado || ''), 'hex');
  const b = Buffer.from(String(calculado || ''), 'hex');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
};

module.exports = { generarHashFirma, hashCoincide };
