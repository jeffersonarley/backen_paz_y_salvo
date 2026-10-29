// Filas oficiales del formato GCCON-F-088 y plantillas disponibles.
// Las filas se relacionan con las dependencias reales de la base de datos para que
// los nombres de los responsables y las dependencias cambien sin tocar el código.

const FILAS_GCCON = [
    {
        id: 1,
        dependencia: 'GESTIÓN DE TIC',
        dependenciaSimple: 'Gestión de TIC',
        alias: ['tic', 'informatica', 'sistemas', 'tecnolog'],
    },
    {
        id: 2,
        dependencia: 'ADMINISTRACIÓN DE DOCUMENTOS',
        dependenciaSimple: 'Administración de Documentos',
        alias: ['documentos', 'documentacion'],
    },
    {
        id: 3,
        dependencia:
            'ENTREGA CARNÉ (Al Supervisor del Contrato en las Regionales y Centros de Formación)<br>SECRETARÍA GENERAL',
        dependenciaSimple: 'Entrega Carné (Al Supervisor del Contrato) / Secretaría General',
        alias: ['carne', 'secretaria general'],
    },
    {
        id: 4,
        dependencia: 'ALMACÉN E INVENTARIOS',
        dependenciaSimple: 'Almacén e Inventarios',
        alias: ['almacen', 'inventarios'],
    },
    {
        id: 5,
        dependencia:
            'SERVICIOS GENERALES, ADQUISICIONES<br>(Administración de edificio; Contratación)',
        dependenciaSimple: 'Servicios Generales, Adquisiciones',
        alias: ['servicios generales', 'adquisiciones', 'infraestructura'],
    },
    {
        id: 6,
        dependencia: 'CONTABILIDAD',
        dependenciaSimple: 'Contabilidad',
        alias: ['contabilidad'],
    },
    {
        id: 7,
        dependencia: 'TESORERIA',
        dependenciaSimple: 'Tesorería',
        alias: ['tesoreria'],
    },
    {
        id: 8,
        dependencia: 'COORDINACIÓN DE:<br>ÁREA/GRUPO/ ACADEMICA',
        dependenciaSimple: 'Coordinación Académica',
        alias: ['coordinacion', 'academica', 'academico'],
    },
    {
        id: 9,
        dependencia: 'BIBLIOTECA',
        dependenciaSimple: 'Biblioteca',
        alias: ['biblioteca'],
    },
    {
        id: 10,
        dependencia: 'OTRO (LIDER SIGA)',
        dependenciaSimple: 'Líder SIGA',
        alias: ['siga'],
    },
    {
        id: 11,
        dependencia: 'OTRO (ADMINISTRACION EDUCATIVA)',
        dependenciaSimple: 'Administración Educativa',
        alias: ['administracion educativa', 'educativa'],
    },
    {
        id: 12,
        dependencia:
            'APOYO AL SEGUIMIENTO DE LOS PROCESOS ADMINISTRATIVOS Y NOVEDADES',
        dependenciaSimple: 'Apoyo a Procesos Administrativos y Novedades',
        alias: ['seguimiento', 'novedades', 'procesos administrativos'],
    },
    {
        id: 13,
        dependencia: 'APOYO ETAPA PRODUCTIVA',
        dependenciaSimple: 'Apoyo Etapa Productiva',
        alias: ['etapa productiva', 'productiva'],
    },
    {
        id: 14,
        dependencia: 'SUPERVISOR DE CONTRATO',
        dependenciaSimple: 'Supervisor de Contrato',
        alias: [],
    },
];

const TEMPLATAS = {
    COMPLETA: {
        id: 'COMPLETA',
        nombre: 'Plantilla Completa Institucional (14 Dependencias)',
        descripcion:
            'Aplica para contratos que requieren validación de todas las dependencias del Centro.',
        filasAplica: FILAS_GCCON.map((f) => f.id),
    },
    SERVICIOS_PROFESIONALES: {
        id: 'SERVICIOS_PROFESIONALES',
        nombre: 'Servicios Profesionales / Apoyo a la Gestión (7 Dependencias)',
        descripcion:
            'Aplica para contratos administrativos y de apoyo (TIC, Carné, Almacén, Contabilidad, Tesorería, Supervisor). Las áreas académicas quedan en N/A.',
        filasAplica: [1, 2, 3, 4, 6, 7, 14],
    },
    INSTRUCTORES: {
        id: 'INSTRUCTORES',
        nombre: 'Instructores y Formación Profesional (7 Dependencias)',
        descripcion:
            'Aplica para instructores y formación (TIC, Carné, Almacén, Académica, Biblioteca, Etapa Productiva, Supervisor). Trámites administrativos en N/A.',
        filasAplica: [1, 3, 4, 8, 9, 13, 14],
    },
    PERSONALIZADA: {
        id: 'PERSONALIZADA',
        nombre: 'Plantilla Personalizada (Configuración a Medida)',
        descripcion:
            'El coordinador activa o desactiva libremente las dependencias que aplican y asigna los firmantes para este contrato.',
        filasAplica: null,
    },
};

const normalizar = (valor) =>
    String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

module.exports = { FILAS_GCCON, TEMPLATAS, normalizar };
