process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.EMAIL_USER = '';
process.env.EMAIL_PASS = '';
process.env.RATE_LIMIT_MAX = '1000';
process.env.CORS_ORIGIN = '';

const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');

const Usuario = require('../src/models/Usuario');
const DependenciaArea = require('../src/models/DependenciaArea');
const Contrato = require('../src/models/Contrato');
const BienEntregado = require('../src/models/BienEntregado');
const TrazabilidadFirma = require('../src/models/TrazabilidadFirma');
const HistorialAuditoria = require('../src/models/HistorialAuditoria');
const { hashToken } = require('../src/utils/tokens');

const TEST_DB = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/pazysalvo_sena_test';
const PASS = 'ClaveSegura123!';

let admin, supervisor, contratista, responsable, area;

async function login(correo, password = PASS) {
  return request(app).post('/api/auth/login').send({ correo_institucional: correo, password });
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await mongoose.connection.dropDatabase();

  const hash = await bcrypt.hash(PASS, 8);

  area = await DependenciaArea.create({ nombre_dependencia: 'Area Prueba', activo: true });

  admin = await Usuario.create({ nombre_completo: 'Admin Test', correo_institucional: 'admin.test@institucion.edu.co', password_hash: hash, rol: 'Administrador' });
  supervisor = await Usuario.create({ nombre_completo: 'Supervisor Test', correo_institucional: 'sup.test@institucion.edu.co', password_hash: hash, rol: 'Supervisor' });
  contratista = await Usuario.create({ nombre_completo: 'Contratista Test', correo_institucional: 'cont.test@empresa.edu', password_hash: hash, rol: 'Contratista', supervisor_id: supervisor._id });
  responsable = await Usuario.create({ nombre_completo: 'Responsable Test', correo_institucional: 'resp.test@institucion.edu.co', password_hash: hash, rol: 'ResponsableArea', dependencia_id: area._id });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Autenticación (Flujo 1)', () => {
  test('login exitoso devuelve token y rol', async () => {
    const res = await login(admin.correo_institucional);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.rol).toBe('Administrador');
  });

  test('login con credenciales inválidas devuelve 401', async () => {
    const res = await login('noexiste@institucion.edu.co');
    expect(res.status).toBe(401);
  });

  test('usuario deshabilitado no puede iniciar sesión', async () => {
    await Usuario.create({ nombre_completo: 'Inactivo', correo_institucional: 'inactivo@institucion.edu.co', password_hash: await bcrypt.hash(PASS, 8), rol: 'Contratista', activo: false });
    const res = await login('inactivo@institucion.edu.co');
    expect(res.status).toBe(401);
  });

  test('bloqueo tras 3 intentos fallidos (403)', async () => {
    await Usuario.create({ nombre_completo: 'Bloqueo', correo_institucional: 'bloqueo@institucion.edu.co', password_hash: await bcrypt.hash(PASS, 8), rol: 'Contratista' });
    for (let i = 0; i < 3; i++) {
      await login('bloqueo@institucion.edu.co', 'ClaveMala123!');
    }
    const res = await login('bloqueo@institucion.edu.co', 'ClaveMala123!');
    expect(res.status).toBe(403);
  });
});

describe('Jerarquía de usuarios (RF-009, RF-011)', () => {
  test('admin crea supervisor (201)', async () => {
    const token = (await login(admin.correo_institucional)).body.token;
    const res = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${token}`).send({ nombre_completo: 'Sup Nuevo', correo_institucional: 'sup.nuevo@institucion.edu.co', password: PASS, rol: 'Supervisor' });
    expect(res.status).toBe(201);
  });

  test('supervisor crea contratista (201)', async () => {
    const token = (await login(supervisor.correo_institucional)).body.token;
    const res = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${token}`).send({ nombre_completo: 'Cont Nuevo', correo_institucional: 'cont.nuevo@empresa.edu', password: PASS, rol: 'Contratista' });
    expect(res.status).toBe(201);
  });

  test('supervisor NO crea administrador (403)', async () => {
    const token = (await login(supervisor.correo_institucional)).body.token;
    const res = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${token}`).send({ nombre_completo: 'X', correo_institucional: 'x@institucion.edu.co', password: PASS, rol: 'Administrador' });
    expect(res.status).toBe(403);
  });

  test('contraseña débil es rechazada (400)', async () => {
    const token = (await login(supervisor.correo_institucional)).body.token;
    const res = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${token}`).send({ nombre_completo: 'Debil', correo_institucional: 'debil@empresa.edu', password: 'abc', rol: 'Contratista' });
    expect(res.status).toBe(400);
  });
});

describe('Flujo contractual completo (Flujos 2-4)', () => {
  let contratoId;
  let tokenC, tokenS, tokenR, tokenA;

  beforeAll(async () => {
    tokenA = (await login(admin.correo_institucional)).body.token;
    tokenS = (await login(supervisor.correo_institucional)).body.token;
    tokenC = (await login(contratista.correo_institucional)).body.token;
    tokenR = (await login(responsable.correo_institucional)).body.token;
  });

  test('crear contrato con bienes (201)', async () => {
    const res = await request(app).post('/api/contratos/nuevo').set('Authorization', `Bearer ${tokenC}`).send({
      numero: 'CT-TEST-001', telefono: '3001112233', dependencia: area._id.toString(),
      bienes: [{ descripcion: 'Laptop', codigo_inventario: 'INV-T-1', estado_bien: 'Bueno' }]
    });
    expect(res.status).toBe(201);
    contratoId = res.body.contrato._id;
  });

  test('rechaza bien sin código (400)', async () => {
    const res = await request(app).post('/api/contratos/nuevo').set('Authorization', `Bearer ${tokenC}`).send({
      numero: 'CT-TEST-002', telefono: '300', dependencia: area._id.toString(),
      bienes: [{ descripcion: 'Sin código' }]
    });
    expect(res.status).toBe(400);
  });

  test('admin no puede evaluar (403)', async () => {
    const res = await request(app).put(`/api/contratos/evaluar/${contratoId}`).set('Authorization', `Bearer ${tokenA}`).send({ aprobado: true });
    expect(res.status).toBe(403);
  });

  test('supervisor evalúa y abre firmas (200)', async () => {
    const res = await request(app).put(`/api/contratos/evaluar/${contratoId}`).set('Authorization', `Bearer ${tokenS}`).send({ aprobado: true });
    expect(res.status).toBe(200);
    expect(res.body.contrato.estado).toBe('Pendiente de Firmas');
  });

  test('responsable aprueba firma y finaliza (200)', async () => {
    const res = await request(app).post('/api/firmas/procesar').set('Authorization', `Bearer ${tokenR}`).send({ contratoId, accion: 'Aprobar' });
    expect(res.status).toBe(200);
    const c = await Contrato.findById(contratoId);
    expect(c.estado).toBe('Finalizado');
  });

  test('contratista consulta sus solicitudes (200)', async () => {
    const res = await request(app).get('/api/contratos/mis-solicitudes').set('Authorization', `Bearer ${tokenC}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('descargar PDF (200)', async () => {
    const res = await request(app).get(`/api/contratos/${contratoId}/pdf`).set('Authorization', `Bearer ${tokenC}`);
    expect(res.status).toBe(200);
  });
});

describe('Recuperación y cambio de contraseña (Flujo 5, RF-015)', () => {
  test('recuperar genera token efímero', async () => {
    const res = await request(app).post('/api/auth/recuperar').send({ correo_institucional: contratista.correo_institucional });
    expect(res.status).toBe(200);
    const u = await Usuario.findOne({ correo_institucional: contratista.correo_institucional });
    expect(u.token_recuperacion).toBeTruthy();
    // Se guarda el hash SHA-256 (64 hex), no el token en claro
    expect(u.token_recuperacion).toMatch(/^[a-f0-9]{64}$/);
  });

  test('restablecer con token válido (200)', async () => {
    // El token en claro solo viaja por correo: se simula uno y se guarda su hash
    const tokenClaro = 'a'.repeat(64);
    await Usuario.updateOne(
      { correo_institucional: contratista.correo_institucional },
      { token_recuperacion: hashToken(tokenClaro), token_expiracion: new Date(Date.now() + 60000) }
    );
    const res = await request(app).post('/api/auth/restablecer').send({ token: tokenClaro, nueva_password: 'NuevaClave123!' });
    expect(res.status).toBe(200);
    // El propio hash guardado NO sirve como token (no se puede usar una BD filtrada)
    const reuso = await request(app).post('/api/auth/restablecer').send({ token: hashToken(tokenClaro), nueva_password: 'OtraClave123!' });
    expect(reuso.status).toBe(400);
  });

  test('cambiar contraseña con política (200/400)', async () => {
    const token = (await login(contratista.correo_institucional, 'NuevaClave123!')).body.token;
    const debil = await request(app).put('/api/auth/cambiar-password').set('Authorization', `Bearer ${token}`).send({ password_actual: 'NuevaClave123!', nueva_password: 'corta' });
    expect(debil.status).toBe(400);
  });
});


// ---------------------------------------------------------------------------
// Pruebas de las correcciones de seguridad y de flujo
// ---------------------------------------------------------------------------
const PNG_1X1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('Seguridad', () => {
  test('/api/test-db ya no existe (404)', async () => {
    const res = await request(app).get('/api/test-db');
    expect(res.status).toBe(404);
  });

  test('login con objeto NoSQL en lugar de correo es rechazado (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ correo_institucional: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test('recuperar con objeto NoSQL es rechazado (400) y no genera tokens', async () => {
    await Usuario.updateMany({}, { token_recuperacion: null, token_expiracion: null });
    const res = await request(app).post('/api/auth/recuperar').send({ correo_institucional: { $ne: null } });
    expect(res.status).toBe(400);
    expect(await Usuario.countDocuments({ token_recuperacion: { $ne: null } })).toBe(0);
  });

  test('restablecer con {"$ne":null} NO permite tomar la cuenta de otro usuario', async () => {
    const victima = await Usuario.create({
      nombre_completo: 'Victima', correo_institucional: 'victima@empresa.edu', password_hash: await bcrypt.hash(PASS, 8), rol: 'Contratista',
      token_recuperacion: hashToken('t'.repeat(64)), token_expiracion: new Date(Date.now() + 60000)
    });
    const res = await request(app).post('/api/auth/restablecer').send({ token: { $ne: null }, nueva_password: 'HackeoClave123!' });
    expect(res.status).toBe(400);
    const intento = await login('victima@empresa.edu', 'HackeoClave123!');
    expect(intento.status).toBe(401);
    expect((await login(victima.correo_institucional)).status).toBe(200);
  });

  test('credenciales inválidas no revelan intentos restantes ni si el correo existe', async () => {
    const existente = await login('cont.test@empresa.edu', 'ClaveMala123!');
    const inexistente = await login('nadie@empresa.edu', 'ClaveMala123!');
    expect(existente.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(existente.body.mensaje).toBe(inexistente.body.mensaje);
    expect(existente.body.mensaje).not.toMatch(/intentos/i);
  });

  test('token con algoritmo "none" es rechazado (401)', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const falso = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ id: admin._id, rol: 'Administrador' })}.`;
    const res = await request(app).get('/api/auditoria').set('Authorization', `Bearer ${falso}`);
    expect(res.status).toBe(401);
  });

  test('un cambio de rol aplica de inmediato aunque el token siga vigente', async () => {
    const temp = await Usuario.create({ nombre_completo: 'Temp Admin', correo_institucional: 'temp.admin@institucion.edu.co', password_hash: await bcrypt.hash(PASS, 8), rol: 'Administrador' });
    const token = (await login(temp.correo_institucional)).body.token;
    expect((await request(app).get('/api/auditoria').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    await Usuario.updateOne({ _id: temp._id }, { rol: 'Contratista' });
    expect((await request(app).get('/api/auditoria').set('Authorization', `Bearer ${token}`)).status).toBe(403);
  });

  test('cambiar la contraseña invalida los tokens anteriores y entrega uno nuevo', async () => {
    await Usuario.create({ nombre_completo: 'Cambio Pass', correo_institucional: 'cambio.pass@empresa.edu', password_hash: await bcrypt.hash(PASS, 8), rol: 'Contratista' });
    const viejo = (await login('cambio.pass@empresa.edu')).body.token;
    // El token se emite con segundos de precisión: se espera al siguiente segundo para distinguirlos
    await new Promise((r) => setTimeout(r, 1100));
    const cambio = await request(app).put('/api/auth/cambiar-password').set('Authorization', `Bearer ${viejo}`).send({ password_actual: PASS, nueva_password: 'OtraClave456!' });
    expect(cambio.status).toBe(200);
    expect(cambio.body.token).toBeDefined();
    expect((await request(app).get('/api/contratos/mis-solicitudes').set('Authorization', `Bearer ${viejo}`)).status).toBe(401);
    expect((await request(app).get('/api/contratos/mis-solicitudes').set('Authorization', `Bearer ${cambio.body.token}`)).status).toBe(200);
  });
});

describe('Flujo de firmas: rechazo, IDOR, concurrencia y verificación', () => {
  let area2, area3, responsable2, responsable3, cont2, tokenC, tokenS, tokenR, tokenR2, tokenR3;

  const crearContrato = async (numero) => {
    const res = await request(app).post('/api/contratos/nuevo').set('Authorization', `Bearer ${tokenC}`).send({
      numero, telefono: '3000000000', dependencia: area._id.toString(),
      bienes: [{ descripcion: 'Monitor', codigo_inventario: `INV-${numero}`, cantidad: 2 }]
    });
    expect(res.status).toBe(201);
    return res.body.contrato._id;
  };
  const evaluar = (id, aprobado = true, extra = {}) =>
    request(app).put(`/api/contratos/evaluar/${id}`).set('Authorization', `Bearer ${tokenS}`).send({ aprobado, ...extra });
  const firmar = (token, contratoId, accion, extra = {}) =>
    request(app).post('/api/firmas/procesar').set('Authorization', `Bearer ${token}`).send({ contratoId, accion, ...extra });

  // Crea, aprueba y firma un contrato con todas las áreas activas, una tras otra (sin concurrencia)
  const finalizarEnSecuencia = async (numero) => {
    const id = await crearContrato(numero);
    expect((await evaluar(id)).status).toBe(200);
    expect((await firmar(tokenR, id, 'Aprobar', { firma_base64: PNG_1X1 })).status).toBe(200);
    expect((await firmar(tokenR2, id, 'Aprobar', { firma_base64: PNG_1X1 })).status).toBe(200);
    expect((await Contrato.findById(id)).estado).toBe('Finalizado');
    return id;
  };

  beforeAll(async () => {
    const hash = await bcrypt.hash(PASS, 8);
    area2 = await DependenciaArea.create({ nombre_dependencia: 'Area Dos', activo: true });
    area3 = await DependenciaArea.create({ nombre_dependencia: 'Area Inactiva', activo: false });
    responsable2 = await Usuario.create({ nombre_completo: 'Resp Dos', correo_institucional: 'resp2.test@institucion.edu.co', password_hash: hash, rol: 'ResponsableArea', dependencia_id: area2._id });
    responsable3 = await Usuario.create({ nombre_completo: 'Resp Tres', correo_institucional: 'resp3.test@institucion.edu.co', password_hash: hash, rol: 'ResponsableArea', dependencia_id: area3._id });
    cont2 = await Usuario.create({ nombre_completo: 'Contratista Dos', correo_institucional: 'cont2.test@empresa.edu', password_hash: hash, rol: 'Contratista', supervisor_id: supervisor._id });
    tokenC = (await login(cont2.correo_institucional)).body.token;
    tokenS = (await login(supervisor.correo_institucional)).body.token;
    tokenR = (await login(responsable.correo_institucional)).body.token;
    tokenR2 = (await login(responsable2.correo_institucional)).body.token;
    tokenR3 = (await login(responsable3.correo_institucional)).body.token;
  });

  test('número de contrato duplicado responde 400 (no 500)', async () => {
    await crearContrato('CT-DUP-1');
    const res = await request(app).post('/api/contratos/nuevo').set('Authorization', `Bearer ${tokenC}`).send({
      numero: 'CT-DUP-1', telefono: '3000000000', dependencia: area._id.toString(),
      bienes: [{ descripcion: 'Otro', codigo_inventario: 'INV-X' }]
    });
    expect(res.status).toBe(400);
  });

  test('cantidad inválida y fechas incoherentes son rechazadas (400)', async () => {
    const base = { telefono: '3000000000', dependencia: area._id.toString() };
    const cantidad = await request(app).post('/api/contratos/nuevo').set('Authorization', `Bearer ${tokenC}`).send({ ...base, numero: 'CT-VAL-1', bienes: [{ descripcion: 'A', codigo_inventario: 'B', cantidad: -3 }] });
    expect(cantidad.status).toBe(400);
    const fechas = await request(app).post('/api/contratos/nuevo').set('Authorization', `Bearer ${tokenC}`).send({ ...base, numero: 'CT-VAL-2', fecha_inicio: '2026-06-01', fecha_fin: '2026-01-01', bienes: [{ descripcion: 'A', codigo_inventario: 'B' }] });
    expect(fechas.status).toBe(400);
  });

  test('un rechazo de un área deja el contrato Rechazado y NO puede finalizarse', async () => {
    const id = await crearContrato('CT-RECH-1');
    expect((await evaluar(id)).status).toBe(200);
    expect(await TrazabilidadFirma.countDocuments({ contrato_id: id })).toBeGreaterThanOrEqual(2);

    const rechazo = await firmar(tokenR, id, 'Rechazar', { observacion_rechazo: 'Falta devolver el equipo' });
    expect(rechazo.status).toBe(200);
    expect((await Contrato.findById(id)).estado).toBe('Rechazado');

    // Aunque otra área quiera aprobar, ya no se puede: el trámite está detenido
    const aprobar = await firmar(tokenR2, id, 'Aprobar');
    expect(aprobar.status).toBe(409);
    expect((await Contrato.findById(id)).estado).toBe('Rechazado');
    expect((await request(app).get(`/api/contratos/${id}/pdf`).set('Authorization', `Bearer ${tokenC}`)).status).toBe(400);
  });

  test('tras el rechazo el supervisor puede re-aprobar sin duplicar los casilleros de firma', async () => {
    const id = (await Contrato.findOne({ numero_contrato: 'CT-RECH-1' }))._id.toString();
    const antes = await TrazabilidadFirma.countDocuments({ contrato_id: id });
    expect((await evaluar(id)).status).toBe(200);
    const despues = await TrazabilidadFirma.countDocuments({ contrato_id: id });
    expect(despues).toBe(antes);
    expect(await TrazabilidadFirma.countDocuments({ contrato_id: id, estado: 'Pendiente' })).toBe(despues);
  });

  test('el supervisor no puede evaluar un contrato ya en firma o finalizado (409)', async () => {
    const id = (await Contrato.findOne({ numero_contrato: 'CT-RECH-1' }))._id.toString(); // ahora "Pendiente de Firmas"
    expect((await evaluar(id)).status).toBe(409);
    const finalizado = (await Contrato.findOne({ numero_contrato: 'CT-TEST-001' }))._id.toString();
    expect((await evaluar(finalizado, false)).status).toBe(409);
  });

  test('firma con imagen inválida se rechaza (400) sin cambiar el estado de la firma', async () => {
    const id = (await Contrato.findOne({ numero_contrato: 'CT-RECH-1' }))._id.toString();
    const res = await firmar(tokenR, id, 'Aprobar', { firma_base64: Buffer.from('esto no es una imagen').toString('base64') });
    expect(res.status).toBe(400);
    expect((await TrazabilidadFirma.findOne({ contrato_id: id, area_id: area._id })).estado).toBe('Pendiente');
  });

  test('IDOR: un ResponsableArea sin casillero en el contrato no puede consultarlo (403)', async () => {
    const id = (await Contrato.findOne({ numero_contrato: 'CT-RECH-1' }))._id.toString();
    expect((await request(app).get(`/api/contratos/${id}`).set('Authorization', `Bearer ${tokenR3}`)).status).toBe(403);
    expect((await request(app).get(`/api/contratos/${id}`).set('Authorization', `Bearer ${tokenR}`)).status).toBe(200);
  });

  // Requiere atomicidad real de findOneAndUpdate (MongoDB la garantiza por documento). Emuladores como
  // FerretDB no la ofrecen: ejecute con MONGO_EMULADO=1 para omitir SOLO esta prueba en ese entorno.
  const testConcurrencia = process.env.MONGO_EMULADO === '1' ? test.skip : test;
  testConcurrencia('firmas simultáneas: el contrato se finaliza y notifica UNA sola vez', async () => {
    const id = await crearContrato('CT-CONC-1');
    expect((await evaluar(id)).status).toBe(200);

    const [a, b] = await Promise.all([
      firmar(tokenR, id, 'Aprobar', { firma_base64: PNG_1X1 }),
      firmar(tokenR2, id, 'Aprobar', { firma_base64: PNG_1X1 })
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect((await Contrato.findById(id)).estado).toBe('Finalizado');

    const finalizaciones = await HistorialAuditoria.countDocuments({ accion: 'FINALIZAR_CONTRATO', 'detalles.contrato_id': new mongoose.Types.ObjectId(id) });
    expect(finalizaciones).toBe(1);
    // Ya no se expone la ruta interna del servidor
    expect([a.body.pdf_path, b.body.pdf_path]).toEqual([undefined, undefined]);
  });

  test('PDF se genera en memoria con el nombre de la dependencia', async () => {
    const id = await finalizarEnSecuencia('CT-PDF-1');
    const res = await request(app).get(`/api/contratos/${id}/pdf`).set('Authorization', `Bearer ${tokenC}`).buffer(true).parse((r, cb) => {
      const partes = []; r.on('data', (c) => partes.push(c)); r.on('end', () => cb(null, Buffer.concat(partes)));
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('verificación pública del hash: válido y luego inválido si se altera el inventario', async () => {
    const id = await finalizarEnSecuencia('CT-HASH-1');
    const traz = await TrazabilidadFirma.findOne({ contrato_id: id, estado: 'Aprobado' });
    expect(traz.hash_verificacion).toMatch(/^[a-f0-9]{64}$/);

    const ok = await request(app).get(`/api/firmas/verificar/${traz.hash_verificacion}`);
    expect(ok.status).toBe(200);
    expect(ok.body.valido).toBe(true);
    expect(ok.body.correo_contratista).toBeUndefined();

    await BienEntregado.updateOne({ contrato_id: id }, { descripcion: 'Monitor ADULTERADO' });
    const alterado = await request(app).get(`/api/firmas/verificar/${traz.hash_verificacion}`);
    expect(alterado.body.valido).toBe(false);

    expect((await request(app).get('/api/firmas/verificar/no-es-un-hash')).status).toBe(400);
    expect((await request(app).get(`/api/firmas/verificar/${'0'.repeat(64)}`)).status).toBe(404);
  });

  test('no se puede eliminar el último bien del inventario (400)', async () => {
    const id = await crearContrato('CT-BIEN-1');
    const bien = await BienEntregado.findOne({ contrato_id: id });
    const res = await request(app).delete(`/api/contratos/${id}/bienes/${bien._id}`).set('Authorization', `Bearer ${tokenC}`);
    expect(res.status).toBe(400);
  });
});
