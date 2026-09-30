const AppError = require('./AppError');

const MAX_BYTES = 512 * 1024; // 512 KB
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Valida y decodifica la imagen de firma enviada en base64 (con o sin prefijo data:).
// Solo acepta PNG/JPEG reales y limita el tamaño. Lanza AppError 400 si no es válida.
const decodificarFirma = (valor) => {
  if (typeof valor !== 'string') {
    throw new AppError('La firma debe enviarse como una cadena base64.', 400);
  }

  const limpio = valor.replace(/^data:image\/(png|jpe?g);base64,/i, '').replace(/\s/g, '');

  if (limpio.length === 0 || limpio.length > Math.ceil((MAX_BYTES * 4) / 3) + 4) {
    throw new AppError('La imagen de la firma está vacía o supera el tamaño permitido (512 KB).', 400);
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(limpio)) {
    throw new AppError('La firma no es una cadena base64 válida.', 400);
  }

  const buffer = Buffer.from(limpio, 'base64');
  const esPng = buffer.length > PNG_SIGNATURE.length && buffer.subarray(0, 8).equals(PNG_SIGNATURE);
  const esJpg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  if (buffer.length > MAX_BYTES || (!esPng && !esJpg)) {
    throw new AppError('La firma debe ser una imagen PNG o JPEG válida de máximo 512 KB.', 400);
  }

  return buffer;
};

module.exports = { decodificarFirma, MAX_BYTES };
