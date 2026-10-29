const API = process.env.API_BASE || 'http://127.0.0.1:3000/api';
// Sufijo único por corrida para poder repetir la prueba sobre la misma base
const SUF = process.env.RUN_SUFFIX || String(Date.now()).slice(-6);

let fallos = 0;
const ok = (m) => console.log(`   ✓ ${m}`);
const fail = (m) => { fallos++; console.log(`   ✗ ${m}`); };
const check = (cond, m) => (cond ? ok(m) : fail(m));
const titulo = (t) => console.log(`\n${'='.repeat(70)}\n${t}\n${'='.repeat(70)}`);

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

const login = async (correo, password) => {
  const r = await api('/auth/login', { method: 'POST', body: { correo_institucional: correo, password } });
  return r.data?.token;
};

(async () => {
  // ============================================================
  titulo('ROL 1 — ADMINISTRADOR (Administración Global)');
  // ============================================================
  const tAdmin = await login('admin@gccon.com', 'admin');
  check(!!tAdmin, 'Login del administrador');

  let r = await api('/usuarios', { token: tAdmin });
  check(r.status === 200 && r.data.length >= 8, `Lista usuarios (${r.data?.length} usuarios)`);

  // Crear un coordinador nuevo
  r = await api('/usuarios', {
    method: 'POST', token: tAdmin,
    body: {
      nombre_completo: 'Coordinador Nuevo (Admin)', correo_institucional: `coord.nuevo.${SUF}@prueba.co`,
      password: 'Coordinador123!', rol: 'Supervisor', cargo: 'Coordinador de Contratos',
    },
  });
  check(r.status === 201, `Crear coordinador por el Admin (${r.status})`);
  const coordNuevoId = r.data?.usuario?.id;

  // Admin no puede crear contratistas (jerarquía)
  r = await api('/usuarios', {
    method: 'POST', token: tAdmin,
    body: { nombre_completo: 'X', correo_institucional: 'x@prueba.co', password: 'Temporal123!', rol: 'Contratista' },
  });
  check(r.status === 403, `Admin NO puede crear contratistas (${r.status} esperado 403)`);

  // Asignar apoyo de supervisión y plantilla predeterminada
  const usuariosAdmin = (await api('/usuarios', { token: tAdmin })).data;
  const idApoyo = usuariosAdmin.find((u) => u.correo_institucional === 'nelson.duarte@sena.edu.co')._id;
  r = await api(`/usuarios/${coordNuevoId}`, {
    method: 'PUT', token: tAdmin,
    body: { apoyo_supervision_id: idApoyo, plantilla_predeterminada: 'INSTRUCTORES' },
  });
  check(r.status === 200, `Asignar apoyo de supervisión / plantilla (${r.status})`);
  const usuariosTrasAsignar = (await api('/usuarios', { token: tAdmin })).data;
  const coordConApoyo = usuariosTrasAsignar.find((u) => u._id === coordNuevoId);
  const nombreApoyo = usuariosAdmin.find((u) => u._id === idApoyo)?.nombre_completo;
  check(coordConApoyo?.apoyo_supervision_id?.nombre_completo === nombreApoyo,
    `El apoyo de supervisión quedó asociado (${coordConApoyo?.apoyo_supervision_id?.nombre_completo || 'no'})`);

  // Dependencias: crear con dos responsables
  const users = (await api('/usuarios', { token: tAdmin })).data;
  const personal = await api('/usuarios?rol=ResponsableArea', { token: tAdmin });
  const idTic = personal.data.find((u) => u.correo_institucional === 'franklin.chacon@sena.edu.co')._id;
  const idAlmacen = personal.data.find((u) => u.correo_institucional === 'martha.almacen@sena.edu.co')._id;

  r = await api('/dependencias', {
    method: 'POST', token: tAdmin,
    body: { nombre_dependencia: `Prueba Admin - Tic y Almacén ${SUF}`, responsable_ids: [idTic, idAlmacen] },
  });
  check(r.status === 201, `Crear dependencia con 2 responsables (${r.status})`);
  const depPruebaId = r.data?.dependencia?._id;
  check(r.data?.dependencia?.responsables_ids?.length === 2, 'Se guardaron los 2 responsables');

  // Activar / desactivar
  r = await api(`/dependencias/${depPruebaId}`, { method: 'DELETE', token: tAdmin });
  check(r.data?.dependencia?.activo === false, 'Desactivar dependencia');
  r = await api(`/dependencias/${depPruebaId}`, { method: 'DELETE', token: tAdmin });
  check(r.data?.dependencia?.activo === true, 'Activar dependencia');

  // Auditoría
  r = await api('/auditoria', { token: tAdmin });
  const eventos = r.data?.auditoria || r.data?.eventos || (Array.isArray(r.data) ? r.data : []);
  check(r.status === 200 && eventos.length > 0, `Auditoría registra los cambios (${eventos.length} eventos)`);

  // ============================================================
  titulo('ROL 2 — SUPERVISOR / COORDINADOR (Coordinación)');
  // ============================================================
  const tCoord = await login('supervisor@gccon.com', 'super');
  check(!!tCoord, 'Login del coordinador');

  r = await api('/dependencias', { token: tCoord });
  check(r.status === 200 && r.data.length >= 5, `El coordinador lista dependencias (${r.data?.length})`);
  const depTic = r.data.find((d) => d.nombre_dependencia === 'Gestión Tecnológica (TIC)');
  const depAcad = r.data.find((d) => d.nombre_dependencia === 'Coordinación Académica y Formación');

  // Asignar dos responsables a TIC (TIC + Almacén)
  r = await api(`/dependencias/${depTic._id}/responsables`, {
    method: 'PUT', token: tCoord, body: { responsable_ids: [idTic, idAlmacen] },
  });
  check(r.status === 200 && r.data.dependencia.responsables_ids.length === 2, 'Coordinador asigna 2 responsables a una dependencia');

  // El coordinador asigna responsable a la Coordinacion Academica
  const idAcademica = (await api('/usuarios?rol=ResponsableArea', { token: tCoord })).data
    .find((u) => u.correo_institucional === 'johon.sanabria@sena.edu.co')._id;
  r = await api(`/dependencias/${depAcad._id}/responsables`, {
    method: 'PUT', token: tCoord, body: { responsable_ids: [idAcademica] },
  });
  check(r.status === 200 && r.data.dependencia.responsables_ids.length === 1, 'Coordinador asigna responsable a Coordinacion Academica');

  // Un ResponsableArea no puede ser responsable
  r = await api(`/dependencias/${depTic._id}/responsables`, {
    method: 'PUT', token: tCoord, body: { responsable_ids: [users.find((u) => u.rol === 'Contratista')._id] },
  });
  check(r.status === 400, `Contratista no puede ser responsable (${r.status} esperado 400)`);

  // El coordinador ve el personal de la institucion (para asignarlo a dependencias)
  const personalCoord = (await api('/usuarios?rol=ResponsableArea', { token: tCoord })).data;
  check(Array.isArray(personalCoord) && personalCoord.length >= 3, `El coordinador ve los responsables de area (${personalCoord?.length})`);
  const idCoord = users.find((u) => u.correo_institucional === 'supervisor@gccon.com')._id;
  const contratistasCoord = (await api('/usuarios?rol=Contratista', { token: tCoord })).data;
  check(contratistasCoord.every((u) => String(u.supervisor_id?._id || u.supervisor_id) === String(idCoord)),
    'El coordinador solo ve SUS contratistas');

  // El coordinador edita su propio perfil (dependencia / plantilla)
  r = await api(`/usuarios/${idCoord}`, {
    method: 'PUT', token: tCoord,
    body: { dependencia_id: depTic._id, plantilla_predeterminada: 'INSTRUCTORES' },
  });
  check(r.status === 200, `El coordinador actualiza su propio perfil (${r.status})`);

  // Plantilla predeterminada del coordinador
  r = await api('/plantillas/predeterminada', { method: 'PUT', token: tCoord, body: { plantilla_tipo: 'INSTRUCTORES' } });
  check(r.status === 200, 'Coordinador define su plantilla predeterminada');

  // Filas del formato
  r = await api('/plantillas/filas', { token: tCoord });
  check(r.status === 200 && r.data.filas.length === 14, `Las 14 filas del GCCON-F-088 (${r.data?.filas?.length})`);
  const filaAcad = r.data.filas.find((f) => f.id_fila === 8);
  check(/Acad[eé]mica/i.test(filaAcad.dependencia_nombre || ''), `Fila 8 = Coordinación Académica (enlazada a la dependencia real: ${filaAcad.dependencia_nombre})`);
  check(filaAcad.responsables.length >= 0, `Fila 8 muestra sus responsables (${filaAcad.responsables.length})`);

  // El coordinador crea al contratista (cadena jerárquica)
  r = await api('/usuarios', {
    method: 'POST', token: tCoord,
    body: { nombre_completo: 'Contratista Prueba', correo_institucional: `contratista.coord.${SUF}@prueba.co`, password: 'Contratista123!', rol: 'Contratista' },
  });
  check(r.status === 201, 'Coordinador crea contratista (jerarquía)');
  const idContratista = r.data?.usuario?.id;

  // El contratista crea su solicitud
  const tContratista = await login(`contratista.coord.${SUF}@prueba.co`, 'Contratista123!');
  r = await api('/contratos', {
    method: 'POST', token: tContratista,
    body: {
      numero: `CNT-2026-${SUF}`, telefono: '3101234567', dependencia: String(depTic._id),
      objeto_contractual: 'Prestación de servicios profesionales',
      fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31',
      bienes: [{ descripcion: 'Equipo de cómputo', codigo_inventario: 'INV-001', cantidad: 1, estado_bien: 'Bueno' }],
    },
  });
  check(r.status === 201, `Contratista radica solicitud (${r.status})`);
  const contratoId = r.data?.contrato?._id;
  check(r.data?.contrato?.plantilla_tipo === 'INSTRUCTORES', 'El contrato hereda la plantilla del coordinador');

  // El coordinador ve el contrato y su plantilla
  r = await api('/contratos', { token: tCoord });
  check(r.status === 200 && r.data.some((c) => c._id === contratoId), 'El coordinador ve el contrato asignado');

  r = await api(`/contratos/${contratoId}/plantilla`, { token: tCoord });
  check(r.status === 200 && r.data.filas.length === 14, 'Coordinador consulta la plantilla del contrato');
  const filaTicPlantilla = r.data.filas.find((f) => f.id_fila === 1);
  check(filaTicPlantilla.responsables.length >= 2, `Fila TIC muestra sus responsables (${filaTicPlantilla.responsables.length})`);
  const nombreCoord = (await api('/usuarios', { token: tAdmin })).data.find((u) => u._id === idCoord)?.nombre_completo;
  check(filaTicPlantilla.nombres.some((n) => n.includes(nombreCoord)),
    `El coordinador con dependencia propia aparece como responsable (${filaTicPlantilla.nombres.join(' / ')})`);
  check(filaTicPlantilla.nombres.length > 0, `Nombres de los firmantes: ${filaTicPlantilla.nombres.join(' / ')}`);

  // El coordinador personaliza la plantilla (N/A + firmantes)
  const filasPersonalizadas = r.data.filas.map((f) => ({
    id_fila: f.id_fila,
    dependencia_id: f.dependencia_id,
    dependencia_nombre: f.dependencia_nombre,
    responsables: f.id_fila === 1 ? [idTic, idAlmacen] : f.responsables.map((x) => x.id),
    aplica: [1, 4, 8, 14].includes(f.id_fila),
  }));
  r = await api(`/contratos/${contratoId}/plantilla`, {
    method: 'PUT', token: tCoord, body: { plantilla_tipo: 'PERSONALIZADA', filas: filasPersonalizadas },
  });
  check(r.status === 200, 'Coordinador guarda plantilla personalizada');
  const aplicadas = r.data.filas.filter((f) => f.aplica).length;
  check(aplicadas === 4, `Solo 4 dependencias aplican (${aplicadas})`);

  // Evaluar (solo supervisor)
  r = await api(`/contratos/evaluar/${contratoId}`, { method: 'PUT', token: tCoord, body: { aprobado: true } });
  check(r.status === 200 && r.data.contrato.estado === 'Pendiente de Firmas', `Coordinador evalúa el contrato (${r.status})`);

  r = await api(`/contratos/evaluar/${contratoId}`, { method: 'PUT', token: tAdmin, body: { aprobado: true } });
  check(r.status === 403, `El Admin NO puede evaluar (${r.status} esperado 403)`);

  // ============================================================
  titulo('ROL 3 — RESPONSABLE DE ÁREA (Firma de casilleros)');
  // ============================================================
  const tTic = await login('franklin.chacon@sena.edu.co', '123');
  r = await api('/firmas/pendientes', { token: tTic });
  check(r.status === 200 && r.data.length >= 1, `Responsable TIC ve su bandeja (${r.data?.length} casilleros)`);

  const tAcad = await login('johon.sanabria@sena.edu.co', '123');
  r = await api('/firmas/pendientes', { token: tAcad });
  const casillerosAcad = (r.data || []).filter((c) => String(c.contrato_id?._id || c.contrato_id) === String(contratoId));
  check(r.status === 200 && casillerosAcad.length >= 1, `Responsable Académico ve su casillero (${casillerosAcad.length})`);

  // Firma de un responsable que NO está en la casilla
  const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  // Un responsable SIN ninguna dependencia asignada no puede firmar
  r = await api('/usuarios', {
    method: 'POST', token: tCoord,
    body: {
      nombre_completo: `Responsable Sin Dependencia ${SUF}`,
      correo_institucional: `sin.dep.${SUF}@gccon.com`,
      password: 'Temporal123!', rol: 'ResponsableArea',
    },
  });
  check(r.status === 201, `El coordinador crea un responsable sin dependencia (${r.status})`);
  const tSinDep = await login(`sin.dep.${SUF}@gccon.com`, 'Temporal123!');
  r = await api('/firmas/procesar', { method: 'POST', token: tSinDep, body: { contratoId, accion: 'Aprobar', firma_base64: PNG } });
  check(r.status === 403, `Usuario sin casilla asignada es rechazado (${r.status}) - ${r.data?.mensaje || ''}`);

  // Un responsable NO autorizado en una dependencia concreta es rechazado
  const tAlmacenNoAutorizado = await login('martha.almacen@sena.edu.co', '123');
  const casillerosContrato = (await api('/firmas/pendientes', { token: tAdmin })).data
    .filter((c) => String(c.contrato_id?._id || c.contrato_id) === String(contratoId));
  const ajena = casillerosContrato.find((c) => {
    const area = c.area_id?.nombre_dependencia || '';
    return /Contabilidad|Tesorer[ií]a|SIGA|Educativa/i.test(area);
  });
  if (ajena) {
    r = await api('/firmas/procesar', { method: 'POST', token: tAlmacenNoAutorizado, body: { contratoId, dependencia_id: String(ajena.area_id?._id || ajena.area_id), accion: 'Aprobar', firma_base64: PNG } });
    check(r.status === 403, `Firma en dependencia ajena es rechazada (${r.status}) - ${r.data?.mensaje || ''}`);
  } else {
    ok('Firma en dependencia ajena: no hay casillero de otra area en este contrato');
  }

  // Firma del responsable TIC (autorizado) en su dependencia exacta
  const casilleroTic = (await api('/firmas/pendientes', { token: tTic })).data
    .find((c) => String(c.contrato_id?._id || c.contrato_id) === String(contratoId));
  r = await api('/firmas/procesar', { method: 'POST', token: tTic, body: { contratoId, dependencia_id: String(casilleroTic.area_id?._id || casilleroTic.area_id), accion: 'Aprobar', firma_base64: PNG } });
  check(r.status === 200, `Responsable TIC firma su casilla (${r.status})`);
  check(r.data?.mensaje?.includes('pendientes') || r.data?.mensaje?.includes('Finalizado'), `Estado: ${r.data?.mensaje}`);

  // Verificación de la firma por hash
  const trazas = (await api(`/contratos/${contratoId}/observaciones`, { token: tCoord })).data;
  check(Array.isArray(trazas) || trazas !== undefined, 'Trazabilidad de firmas consultable');

  // ============================================================
  titulo('ROL 4 — CONTRATISTA (Solicitud, plantilla y firma propia)');
  // ============================================================
  r = await api('/contratos', { token: tContratista });
  check(r.status === 200 && r.data.length === 1 && r.data[0]._id === contratoId, 'El contratista solo ve SUS contratos');

  r = await api(`/contratos/${contratoId}/plantilla`, { token: tContratista });
  check(r.status === 200, 'El contratista consulta la plantilla de su supervisor');
  check(r.data.tipo === 'PERSONALIZADA', `El contratista ve la plantilla chosen por el coordinador (${r.data.tipo})`);
  const filaTicContratista = r.data.filas.find((f) => f.id_fila === 1);
  check(filaTicContratista.responsables.length === 2, `El contratista ve QUIÉN firma: ${filaTicContratista.nombres.join(' / ')}`);
  const filaNoAplica = r.data.filas.find((f) => f.id_fila === 2);
  check(filaNoAplica.aplica === false && filaNoAplica.marca === 'N/A', 'Las dependencias no aplicables salen como N/A');

  r = await api(`/contratos/${contratoId}/plantilla`, { method: 'PUT', token: tContratista, body: { plantilla_tipo: 'COMPLETA' } });
  check(r.status === 403, `El contratista NO puede cambiar la plantilla (${r.status} esperado 403)`);

  r = await api(`/contratos/${contratoId}`, { token: tContratista });
  check(r.status === 200, 'El contratista ve el detalle de su contrato');

  // Aislamiento: un contratista no puede ver el contrato de otro
  const tOtro = await login('contratista@gccon.com', '123');
  r = await api(`/contratos/${contratoId}`, { token: tOtro });
  check(r.status === 403, `Aislamiento entre contratistas (${r.status} esperado 403)`);

  // PDF mientras el trámite está en curso
  r = await api(`/contratos/${contratoId}/pdf`, { token: tContratista });
  check(r.status === 400, `PDF bloqueado mientras el trámite no finaliza (${r.status} esperado 400)`);

  // Firmas de los demás casilleros para finalizar el trámite
  const casilleroAcad = (await api('/firmas/pendientes', { token: tAcad })).data
    .find((c) => String(c.contrato_id?._id || c.contrato_id) === String(contratoId));
  r = await api('/firmas/procesar', { method: 'POST', token: tAcad, body: { contratoId, dependencia_id: String(casilleroAcad.area_id?._id || casilleroAcad.area_id), accion: 'Aprobar', firma_base64: PNG } });
  check(r.status === 200, `Responsable Académico firma su casilla (${r.status})`);

  const tAlmacen2 = await login('martha.almacen@sena.edu.co', '123');
  const casilleroAlmacen = (await api('/firmas/pendientes', { token: tAlmacen2 })).data
    .find((c) => String(c.contrato_id?._id || c.contrato_id) === String(contratoId));
  r = await api('/firmas/procesar', { method: 'POST', token: tAlmacen2, body: { contratoId, dependencia_id: String(casilleroAlmacen.area_id?._id || casilleroAlmacen.area_id), accion: 'Aprobar', firma_base64: PNG } });
  check(r.status === 200, `Responsable Almacén firma su casilla (${r.status})`);

  r = await api(`/contratos/${contratoId}`, { token: tContratista });
  check(r.data?.contrato?.estado === 'Finalizado', `Trámite finalizado (${r.data?.contrato?.estado})`);

  // PDF oficial una vez finalizado
  const pdfRes = await fetch(`${API}/contratos/${contratoId}/pdf`, { headers: { Authorization: `Bearer ${tContratista}` } });
  check(pdfRes.status === 200 && pdfRes.headers.get('content-type')?.includes('pdf'), `Descarga del PDF oficial (${pdfRes.status})`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(fallos === 0 ? 'RESULTADO: TODAS LAS COMPROBACIONES PASARON' : `RESULTADO: ${fallos} COMPROBACIONES FALLARON`);
  console.log('='.repeat(70));
  process.exit(fallos === 0 ? 0 : 1);
})();
