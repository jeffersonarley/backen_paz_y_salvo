// Pruebas unitarias sin base de datos
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

const { decodificarFirma } = require('../src/utils/firma');
const { generarHashFirma, hashCoincide } = require('../src/utils/firmaHash');
const normalizarRol = require('../src/utils/normalizarRol');
const { hashToken } = require('../src/utils/tokens');
const validarPassword = require('../src/utils/validarPassword');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('decodificarFirma', () => {
  test('acepta PNG en base64 puro y con prefijo data:', () => {
    expect(decodificarFirma(PNG).length).toBeGreaterThan(20);
    expect(decodificarFirma(`data:image/png;base64,${PNG}`).length).toBeGreaterThan(20);
  });
  test('rechaza tipos que no son texto, base64 inválido y archivos que no son imagen', () => {
    expect(() => decodificarFirma({ a: 1 })).toThrow(/cadena base64/);
    expect(() => decodificarFirma('###')).toThrow();
    expect(() => decodificarFirma(Buffer.from('<script>alert(1)</script>').toString('base64'))).toThrow(/PNG o JPEG/);
  });
  test('rechaza imágenes por encima de 512 KB', () => {
    const grande = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(600 * 1024)]);
    expect(() => decodificarFirma(grande.toString('base64'))).toThrow();
  });
});

describe('hash de verificación (HMAC)', () => {
  const contrato = { _id: 'c1', numero_contrato: 'CT-1', version_formato: 1 };
  const bienes = [{ codigo_inventario: 'A', descripcion: 'Laptop', cantidad: 1, estado_bien: 'Bueno' }];
  const datos = { contrato, bienes, area_id: 'a1', usuario_id: 'u1', fecha_firma: '2026-01-01T00:00:00.000Z' };

  test('es determinista, de 64 hex, y cambia si cambia cualquier dato sellado', () => {
    const h = generarHashFirma(datos);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(generarHashFirma(datos)).toBe(h);
    expect(generarHashFirma({ ...datos, bienes: [{ ...bienes[0], descripcion: 'Otra' }] })).not.toBe(h);
    expect(generarHashFirma({ ...datos, usuario_id: 'u2' })).not.toBe(h);
    expect(generarHashFirma({ ...datos, fecha_firma: '2026-01-02T00:00:00.000Z' })).not.toBe(h);
  });
  test('hashCoincide compara en tiempo constante y rechaza vacíos o longitudes distintas', () => {
    const h = generarHashFirma(datos);
    expect(hashCoincide(h, h)).toBe(true);
    expect(hashCoincide(h, h.slice(0, 10))).toBe(false);
    expect(hashCoincide('', '')).toBe(false);
  });
});

describe('utilidades', () => {
  test('normalizarRol unifica variantes y no rompe con valores no textuales', () => {
    expect(normalizarRol('ADMINISTRADOR')).toBe('Administrador');
    expect(normalizarRol('responsable-area')).toBe('ResponsableArea');
    expect(normalizarRol('desconocido')).toBe('desconocido');
    expect(normalizarRol(undefined)).toBeUndefined();
  });
  test('hashToken es SHA-256 hex y no reversible a simple vista', () => {
    expect(hashToken('abc')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken('abc')).not.toBe('abc');
  });
  test('política de contraseñas', () => {
    expect(validarPassword('Corta1').valida).toBe(false);
    expect(validarPassword('ClaveSegura123!').valida).toBe(true);
  });
});

describe('configuración obligatoria', () => {
  const { getJwtSecret, getMongoUri } = require('../src/config/env');
  test('sin JWT_SECRET o MONGODB_URI falla en lugar de usar un valor por defecto', () => {
    const jwt = process.env.JWT_SECRET;
    const uri = process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.MONGODB_URI;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
    expect(() => getMongoUri()).toThrow(/MONGODB_URI/);
    process.env.JWT_SECRET = jwt;
    if (uri) process.env.MONGODB_URI = uri;
  });
});
