const DependenciaArea = require('../models/DependenciaArea');
const Usuario = require('../models/Usuario');
const { FILAS_GCCON, TEMPLATAS, normalizar } = require('../constants/plantillas');

const nombreCompleto = (usuario) =>
    usuario?.nombre_completo || usuario?.nombre || usuario?.correo_institucional || '';

// Devuelve las dependencias de la base de datos con sus responsables cargados
async function obtenerDependenciasConResponsables() {
    return DependenciaArea.find()
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol')
        .sort({ nombre_dependencia: 1 });
}

// Busca la dependencia de la base de datos que corresponde a una fila del formato.
// Solo se consideran las dependencias activas: una dependencia desactivada no genera
// casillero de firma, así que tampoco debe mostrarse como firmante en la plantilla.
function buscarDependenciaParaFila(fila, dependencias) {
    if (!fila.alias || fila.alias.length === 0) return null;
    const aliasNormalizados = fila.alias.map(normalizar);
    return (
        dependencias.find((dep) => {
            if (dep.activo === false) return false;
            const nombre = normalizar(dep.nombre_dependencia);
            return aliasNormalizados.some((alias) => nombre.includes(alias));
        }) || null
    );
}

// Normaliza la lista de responsables de una dependencia (sin duplicados)
function responsablesDeDependencia(dep) {
    const lista = [];
    const agregar = (usuario) => {
        if (!usuario) return;
        const id = String(usuario._id || usuario.id || usuario);
        if (lista.some((r) => String(r.id) === id)) return;
        lista.push({
            id,
            nombre: nombreCompleto(usuario),
            correo: usuario.correo_institucional || usuario.correo || '',
            rol: usuario.rol || '',
        });
    };
    (dep.responsables_ids || []).forEach(agregar);
    if (dep.responsable_id) agregar(dep.responsable_id);
    return lista;
}

// Construye las filas del formato combinando la plantilla con las dependencias reales
function construirFilas({
    dependencias = [],
    tipoPlantilla = 'COMPLETA',
    filasGuardadas = null,
    supervisor = null,
    apoyoSupervision = null,
}) {
    const plantilla = TEMPLATAS[tipoPlantilla] || TEMPLATAS.COMPLETA;
    const guardadasPorId = new Map(
        (filasGuardadas || []).map((fila) => [Number(fila.id_fila), fila])
    );

    return FILAS_GCCON.map((filaBase) => {
        const guardada = guardadasPorId.get(filaBase.id);
        const dependencia = guardada?.dependencia_id
            ? dependencias.find((d) => String(d._id) === String(guardada.dependencia_id)) ||
              buscarDependenciaParaFila(filaBase, dependencias)
            : buscarDependenciaParaFila(filaBase, dependencias);

        const aplicaPorPlantilla = plantilla.filasAplica
            ? plantilla.filasAplica.includes(filaBase.id)
            : true;
        // Sin dependencia registrada (o desactivada) en la base de datos no hay casillero de firma
        const sinDependencia = filaBase.id !== 14 && (!dependencia || dependencia.activo === false);
        const aplica = guardada
            ? guardada.aplica !== false && !sinDependencia
            : aplicaPorPlantilla && !sinDependencia;

        let responsables = [];
        let nombres = [];

        if (filaBase.id === 14) {
            // La fila 14 la firma el Supervisor (Coordinador) y su apoyo de supervisión
            if (supervisor) {
                responsables.push({
                    id: String(supervisor._id || supervisor.id),
                    nombre: nombreCompleto(supervisor),
                    correo: supervisor.correo_institucional || supervisor.correo || '',
                    rol: supervisor.rol || 'Supervisor',
                });
            }
            if (apoyoSupervision) {
                responsables.push({
                    id: String(apoyoSupervision._id || apoyoSupervision.id),
                    nombre: nombreCompleto(apoyoSupervision),
                    correo: apoyoSupervision.correo_institucional || apoyoSupervision.correo || '',
                    rol: apoyoSupervision.rol || '',
                });
            }
            nombres = responsables.map((r) => r.nombre);
        } else if (dependencia) {
            responsables = responsablesDeDependencia(dependencia);
            nombres = responsables.map((r) => r.nombre);
        }

        // El coordinador puede asignar firmantes puntuales para esta fila
        if (guardada && Array.isArray(guardada.responsables) && guardada.responsables.length) {
            const asignados = guardada.responsables
                .map((r) => ({
                    id: String(r._id || r.id || r),
                    nombre: nombreCompleto(r),
                    correo: r.correo_institucional || r.correo || '',
                    rol: r.rol || '',
                }))
                .filter((r) => r.id);
            if (asignados.length) {
                responsables = asignados;
                nombres = asignados.map((r) => r.nombre);
            }
        }

        if (guardada) {
            // El coordinador puede haber asignado firmantes manualmente
            const manuales = (guardada.nombres || []).filter(Boolean);
            if (manuales.length) nombres = manuales;
        }

        return {
            id_fila: filaBase.id,
            dependencia: filaBase.dependencia,
            dependenciaSimple: filaBase.dependenciaSimple,
            dependencia_id: dependencia?._id || null,
            dependencia_nombre: dependencia?.nombre_dependencia || filaBase.dependenciaSimple,
            responsables,
            nombres,
            aplica,
            marca: aplica ? 'X' : 'N/A',
        };
    });
}

// Devuelve la plantilla de un contrato: la guardada por el coordinador o la calculada
async function obtenerPlantillaContrato(contrato, opciones = {}) {
    const tipoPlantilla = contrato.plantilla_tipo || opciones.tipoPredeterminado || 'COMPLETA';
    const dependencias = await obtenerDependenciasConResponsables();

    // Los firmantes guardados por el coordinador se cargan con sus datos de usuario
    if (Array.isArray(contrato.plantilla_firmantes) && contrato.plantilla_firmantes.length) {
        try {
            await contrato.populate('plantilla_firmantes.responsables', 'nombre_completo correo_institucional rol');
        } catch (e) {
            console.warn('No se pudieron poblar los firmantes de la plantilla:', e.message);
        }
    }

    let supervisor = null;
    let apoyoSupervision = null;
    if (contrato.supervisor) {
        supervisor = await Usuario.findById(contrato.supervisor);
    }
    if (supervisor?.apoyo_supervision_id) {
        apoyoSupervision = await Usuario.findById(supervisor.apoyo_supervision_id);
    }

    const filas = construirFilas({
        dependencias,
        tipoPlantilla,
        filasGuardadas: contrato.plantilla_firmantes,
        supervisor,
        apoyoSupervision,
    });

    return { tipo: tipoPlantilla, filas };
}

module.exports = {
    obtenerDependenciasConResponsables,
    responsablesDeDependencia,
    construirFilas,
    obtenerPlantillaContrato,
    FILAS_GCCON,
    TEMPLATAS,
};
