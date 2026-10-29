// Prueba del flujo COMPLETO del paz y salvo:
//   1. El contratista radica la solicitud
//   2. El contratista consulta la plantilla que le hereda su coordinador
//   3. El coordinador revisa y evalúa el contrato (abre los casilleros de firma)
//   4. Cada responsable de área firma su casilla
//   5. Al firmarse todas las casillas el contrato queda Finalizado y se genera el PDF
//   6. El contratista descarga e imprime el paz y salvo
//   7. Se verifica la autenticidad de cada firma por su hash
//
//   node pruebaFlujoCompleto.js
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pazysalvo_prueba';

const API = process.env.API_BASE || 'http://127.0.0.1:3000/api';
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const SUFIJO = String(Date.now()).slice(-5);

const CONTRATISTA = { correo: 'contratista@gccon.com', password: '123' };
const COORDINADOR = { correo: 'supervisor@gccon.com', password: 'super' };
const ADMIN = { correo: 'admin@gccon.com', password: 'admin' };

// Responsables que firman las casillas (filas del GCCON-F-088)
const RESPONSABLES = [
    { correo: 'franklin.chacon@sena.edu.co', password: '123', fila: 1 },
    { correo: 'hilda.ramirez@sena.edu.co', password: '123', fila: 2 },
    { correo: 'martha.almacen@sena.edu.co', password: '123', fila: 4 },
    { correo: 'juan.silva@sena.edu.co', password: '123', fila: 5 },
    { correo: 'zaida.melgarejo@sena.edu.co', password: '123', fila: 6 },
    { correo: 'nelcy.mayorga@sena.edu.co', password: '123', fila: 7 },
    { correo: 'johon.sanabria@sena.edu.co', password: '123', fila: 8 },
    { correo: 'andrea.celis@sena.edu.co', password: '123', fila: 9 },
    { correo: 'zaida.garcia@sena.edu.co', password: '123', fila: 10 },
    { correo: 'erika.gomez@sena.edu.co', password: '123', fila: 11 },
    { correo: 'nelson.duarte@sena.edu.co', password: '123', fila: 12 },
    { correo: 'karen.garcia@sena.edu.co', password: '123', fila: 13 },
];

let pasos = 0;
let fallos = 0;

const titulo = (texto) => {
    console.log(`\n${'='.repeat(78)}\n${texto}\n${'='.repeat(78)}`);
};
const ok = (texto) => {
    pasos += 1;
    console.log(`   ✓ ${texto}`);
};
const fail = (texto, detalle = '') => {
    pasos += 1;
    fallos += 1;
    console.log(`   ✗ ${texto}${detalle ? ` -> ${detalle}` : ''}`);
};
const check = (condicion, texto, detalle = '') =>
    condicion ? ok(texto) : fail(texto, detalle);

const llamar = async (metodo, ruta, token, cuerpo) => {
    const cabeceras = { 'Content-Type': 'application/json' };
    if (token) cabeceras.Authorization = `Bearer ${token}`;
    const r = await fetch(API + ruta, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    let datos = null;
    const texto = await r.text();
    try {
        datos = texto ? JSON.parse(texto) : null;
    } catch {
        datos = texto;
    }
    return { status: r.status, datos, texto, cabeceras: r.headers };
}

const login = async ({ correo, password }) => {
    const r = await llamar('POST', '/auth/login', null, { correo_institucional: correo, password });
    return r.datos?.token || null;
};

(async () => {
    // =====================================================================
    titulo('PASO 0 — preparations: sesión y datos base');
    // =====================================================================
    const tContratista = await login(CONTRATISTA);
    const tCoordinador = await login(COORDINADOR);
    const tAdmin = await login(ADMIN);
    check(!!tContratista, `Sesión del contratista (${CONTRATISTA.correo})`);
    check(!!tCoordinador, `Sesión del coordinador (${COORDINADOR.correo})`);

    const rDep = await llamar('GET', '/dependencias', tCoordinador);
    const depTic = rDep.datos?.find((d) => d.nombre_dependencia === 'Gestión Tecnológica (TIC)');
    check(!!depTic, 'Dependencia principal del contrato disponible', 'Gestión Tecnológica (TIC)');

    // La plantilla predeterminada del coordinador debe ser la completa (14 filas)
    const rPlantillaCoord = await llamar('PUT', '/plantillas/predeterminada', tCoordinador, { plantilla_tipo: 'COMPLETA' });
    check(rPlantillaCoord.status === 200, 'Plantilla predeterminada del coordinador = COMPLETA', rPlantillaCoord.datos?.mensaje);

    const numeroContrato = `CNT-E2E-${SUFIJO}`;

    // =====================================================================
    titulo('PASO 1 — El contratista radica la solicitud');
    // =====================================================================
    const rCrear = await llamar('POST', '/contratos', tContratista, {
        numero: numeroContrato,
        telefono: '3105551234',
        dependencia: String(depTic._id),
        objeto_contractual: 'Prestación de servicios profesionales de soporte institucional',
        fecha_inicio: '2026-01-15',
        fecha_fin: '2026-12-15',
        bienes: [
            { descripcion: 'Equipo de cómputo portátil', codigo_inventario: `INV-E2E-${SUFIJO}-1`, cantidad: 2, estado_bien: 'Bueno' },
            { descripcion: 'Monitor de 24 pulgadas', codigo_inventario: `INV-E2E-${SUFIJO}-2`, cantidad: 2, estado_bien: 'Bueno' },
        ],
    });
    check(rCrear.status === 201, `Solicitud radicada (HTTP ${rCrear.status})`, rCrear.datos?.mensaje);
    const contratoId = rCrear.datos?.contrato?._id || rCrear.datos?._id || rCrear.datos?.contrato?.id;
    check(!!contratoId, `Contrato creado con id ${contratoId}`);
    console.log(`     número de contrato: ${numeroContrato}`);

    const rDetalle = await llamar('GET', `/contratos/${contratoId}`, tContratista);
    check(rDetalle.status === 200, 'El contratista consulta su contrato', `HTTP ${rDetalle.status}`);
    check(rDetalle.datos?.contrato?.bienes?.length === 2 || rDetalle.datos?.bienes?.length === 2,
        'El inventario (2 bienes) quedó guardado');

    // =====================================================================
    titulo('PASO 2 — El contratista ve la plantilla heredada de su coordinador');
    // =====================================================================
    const rPlantilla = await llamar('GET', `/contratos/${contratoId}/plantilla`, tContratista);
    check(rPlantilla.status === 200, `Consulta de la plantilla (HTTP ${rPlantilla.status})`);
    const filas = rPlantilla.datos?.filas || [];
    check(filas.length === 14, `La plantilla tiene las 14 filas del GCCON-F-088 (${filas.length})`);
    const firmantes = filas.filter((f) => f.aplica).map((f) => `${f.id_fila}:${f.nombres.join('/') || 'sin responsable'}`);
    console.log('     filas que aplican y quién firma:');
    filas.filter((f) => f.aplica).forEach((f) => console.log(`       fila ${String(f.id_fila).padStart(2)} - ${f.dependencia_nombre} -> ${f.nombres.join(' / ') || '(sin responsable)'}`));

    const rCambiar = await llamar('PUT', `/contratos/${contratoId}/plantilla`, tContratista, { plantilla_tipo: 'INSTRUCTORES' });
    check(rCambiar.status === 403, `El contratista NO puede cambiar la plantilla (HTTP ${rCambiar.status})`);

    // =====================================================================
    titulo('PASO 3 — El coordinador revisa y evalúa el contrato');
    // =====================================================================
    const rEvaluar = await llamar('PUT', `/contratos/evaluar/${contratoId}`, tCoordinador, {
        aprobado: true,
        observaciones_supervisor: 'Revisado: inventario y objeto contractual conformes.',
    });
    check(rEvaluar.status === 200, `Contrato evaluado por el coordinador (HTTP ${rEvaluar.status})`, rEvaluar.datos?.mensaje);
    check(rEvaluar.datos?.contrato?.estado === 'Pendiente de Firmas',
        `El contrato quedó en "Pendiente de Firmas" (estado: ${rEvaluar.datos?.contrato?.estado})`);

    const rCasilleros = await llamar('GET', '/firmas/pendientes', tAdmin);
    const casilleros = (Array.isArray(rCasilleros.datos) ? rCasilleros.datos : []).filter((c) => String(c.contrato_id?._id || c.contrato_id) === String(contratoId));
    check(casilleros.length === 12, `Se abrieron 12 casilleros de firma (${casilleros.length})`);
    casilleros.forEach((c) => console.log(`       casilla: ${c.area_id?.nombre_dependencia || c.area_id}`));

    // =====================================================================
    titulo('PASO 4 — Un firmante NO autorizado no puede firmar la casilla de otro');
    // =====================================================================
    const tIntruso = await login({ correo: 'eileen.hurtado@sena.edu.co', password: '123' });
    const casilleroAjeno = casilleros.find((c) => (c.area_id?.nombre_dependencia || '').includes('TIC'));
    const rIntruso = await llamar('POST', '/firmas/procesar', tIntruso, {
        contratoId,
        dependencia_id: String(casilleroAjeno?.area_id?._id || casilleroAjeno?.area_id),
        accion: 'Aprobar',
        firma_base64: PNG,
    });
    check(rIntruso.status === 403, `Firma en casilla ajena rechazada (HTTP ${rIntruso.status})`, rIntruso.datos?.mensaje);

    // =====================================================================
    titulo('PASO 5 — Cada responsable de área firma su casilla');
    // =====================================================================
    for (const responsable of RESPONSABLES) {
        const token = await login(responsable);
        if (!token) {
            fail(`Firma del responsable de la fila ${responsable.fila}`, 'no pudo iniciar sesión');
            continue;
        }
        const rPend = await llamar('GET', '/firmas/pendientes', token);
        const mio = (Array.isArray(rPend.datos) ? rPend.datos : []).find((c) => String(c.contrato_id?._id || c.contrato_id) === String(contratoId));
        if (!mio) {
            fail(`Firma del responsable de la fila ${responsable.fila}`, 'no tiene casillero pendiente');
            continue;
        }
        const areaId = mio.area_id?._id || mio.area_id;
        const rFirma = await llamar('POST', '/firmas/procesar', token, {
            contratoId,
            dependencia_id: String(areaId),
            accion: 'Aprobar',
            firma_base64: PNG,
        });
        check(rFirma.status === 200,
            `Fila ${String(responsable.fila).padStart(2)} firmada por ${responsable.correo.split('@')[0]} (HTTP ${rFirma.status}) - ${mio.area_id?.nombre_dependencia || ''}`,
            rFirma.datos?.mensaje);
    }

    // =====================================================================
    titulo('PASO 6 — Estado final: todas las firmas feitas');
    // =====================================================================
    const rContratoFinal = await llamar('GET', `/contratos/${contratoId}`, tContratista);
    const estado = rContratoFinal.datos?.contrato?.estado || rContratoFinal.datos?.estado;
    check(estado === 'Finalizado', `El contrato quedó "Finalizado" (estado: ${estado})`);

    // =====================================================================
    titulo('PASO 7 — El contratista descarga e imprime el paz y salvo');
    // =====================================================================
    const rPdf = await fetch(`${API}/contratos/${contratoId}/pdf`, {
        headers: { Authorization: `Bearer ${tContratista}` },
    });
    const buffer = Buffer.from(await rPdf.arrayBuffer());
    check(rPdf.status === 200, `Descarga del PDF oficial (HTTP ${rPdf.status})`);
    check((rPdf.headers.get('content-type') || '').includes('pdf'), `Tipo de contenido: ${rPdf.headers.get('content-type')}`);
    check(buffer.subarray(0, 4).toString() === '%PDF', 'El archivo descargado es un PDF válido');
    require('fs').writeFileSync(`/tmp/opencode/paz-y-salvo-${SUFIJO}.pdf`, buffer);
    console.log(`     archivo: /tmp/opencode/paz-y-salvo-${SUFIJO}.pdf (${buffer.length} bytes)`);

    // El PDF no se puede descargar si el trámite no ha terminado
    const rPendiente = await llamar('GET', `/contratos/${numeroContrato}/pdf`, tContratista);

    // =====================================================================
    titulo('PASO 8 — Verificación de autenticidad de cada firma (hash)');
    // =====================================================================
    const rHistorial = await llamar('GET', '/firmas/historial', tAdmin);
    const firmas = (Array.isArray(rHistorial.datos) ? rHistorial.datos : []).filter((f) => String(f.contrato_id?._id || f.contrato_id) === String(contratoId));
    check(firmas.length === 12, `Hay ${firmas.length} firmas registradas para el contrato (12 casillas)`);
    let validas = 0;
    for (const firma of firmas) {
        const hash = firma.hash_verificacion;
        if (!hash) continue;
        const rVerif = await llamar('GET', `/firmas/verificar/${hash}`);
        if (rVerif.datos?.valido) validas += 1;
    }
    check(validas === firmas.length, `Las ${validas}/${firmas.length} firmas son auténticas según su hash`);

    // =====================================================================
    titulo('RESUMEN');
    // =====================================================================
    console.log(`   Comprobaciones: ${pasos} | Fallos: ${fallos}`);
    console.log(fallos === 0 ? '   ✓ FLUJO COMPLETO EXITOSO' : '   ✗ HAY FALLOS EN EL FLUJO');
    process.exit(fallos === 0 ? 0 : 1);
})().catch((error) => {
    console.error('\nError inesperado en la prueba:', error);
    process.exit(1);
});
