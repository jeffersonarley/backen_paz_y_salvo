// Pruebas unitarias de las constantes del formato GCCON-F-088 y del servicio de plantillas.
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

jest.mock('../src/models/DependenciaArea');
jest.mock('../src/models/Usuario');

const DependenciaArea = require('../src/models/DependenciaArea');
const Usuario = require('../src/models/Usuario');
const { FILAS_GCCON, TEMPLATAS, normalizar } = require('../src/constants/plantillas');
const {
  obtenerDependenciasConResponsables,
  responsablesDeDependencia,
  construirFilas,
  obtenerPlantillaContrato,
} = require('../src/services/plantillaService');
const { cadenaConsulta } = require('./helpers/mocks');

describe('constants/plantillas', () => {
  test('FILAS_GCCON contiene las 14 filas oficiales con identificadores únicos', () => {
    expect(FILAS_GCCON).toHaveLength(14);
    expect(FILAS_GCCON.map((f) => f.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  test('cada fila tiene el texto oficial, el nombre corto y la lista de alias', () => {
    for (const fila of FILAS_GCCON) {
      expect(typeof fila.dependencia).toBe('string');
      expect(fila.dependencia.length).toBeGreaterThan(0);
      expect(typeof fila.dependenciaSimple).toBe('string');
      expect(Array.isArray(fila.alias)).toBe(true);
    }
  });

  test('la fila 8 corresponde a Coordinación Académica y la 14 al Supervisor', () => {
    const fila8 = FILAS_GCCON.find((f) => f.id === 8);
    expect(fila8.dependenciaSimple).toBe('Coordinación Académica');
    expect(fila8.alias).toContain('academica');

    const fila14 = FILAS_GCCON.find((f) => f.id === 14);
    expect(fila14.dependenciaSimple).toBe('Supervisor de Contrato');
    expect(fila14.alias).toHaveLength(0);
  });

  test('TEMPLATAS define las cuatro plantillas con sus filas aplicables', () => {
    expect(Object.keys(TEMPLATAS)).toEqual([
      'COMPLETA',
      'SERVICIOS_PROFESIONALES',
      'INSTRUCTORES',
      'PERSONALIZADA',
    ]);
    expect(TEMPLATAS.COMPLETA.filasAplica).toHaveLength(14);
    expect(TEMPLATAS.INSTRUCTORES.filasAplica).toEqual([1, 3, 4, 8, 9, 13, 14]);
    expect(TEMPLATAS.SERVICIOS_PROFESIONALES.filasAplica).not.toContain(8);
    expect(TEMPLATAS.PERSONALIZADA.filasAplica).toBeNull();
    for (const plantilla of Object.values(TEMPLATAS)) {
      expect(plantilla.nombre.length).toBeGreaterThan(0);
      expect(plantilla.descripcion.length).toBeGreaterThan(0);
    }
  });

  test('normalizar quita tildes, pasa a minúsculas y elimina signos', () => {
    expect(normalizar('Coordinación Académica')).toBe('coordinacion academica');
    expect(normalizar('  ALMACÉN & INVENTARIOS  ')).toBe('almacen inventarios');
    expect(normalizar('TIC-2026')).toBe('tic 2026');
    expect(normalizar(null)).toBe('');
    expect(normalizar(undefined)).toBe('');
  });
});

describe('plantillaService.obtenerDependenciasConResponsables', () => {
  test('consulta las dependencias con sus responsables cargados y ordenadas', async () => {
    const dependencias = [{ _id: 'd1', nombre_dependencia: 'TIC' }];
    const sort = jest.fn(() => Promise.resolve(dependencias));
    const cadena = {};
    cadena.populate = jest.fn(() => cadena);
    cadena.sort = sort;
    DependenciaArea.find.mockReturnValue(cadena);

    const resultado = await obtenerDependenciasConResponsables();

    expect(DependenciaArea.find).toHaveBeenCalledTimes(1);
    expect(cadena.populate).toHaveBeenCalledWith('responsable_id', 'nombre_completo correo_institucional rol');
    expect(cadena.populate).toHaveBeenCalledWith('responsables_ids', 'nombre_completo correo_institucional rol');
    expect(sort).toHaveBeenCalledWith({ nombre_dependencia: 1 });
    expect(resultado).toBe(dependencias);
  });
});

describe('plantillaService.responsablesDeDependencia', () => {
  test('devuelve la lista de responsables sin duplicados, incluyendo el principal', () => {
    const dep = {
      responsables_ids: [
        { _id: 'u1', nombre_completo: 'Uno', correo_institucional: 'u1@x.co', rol: 'ResponsableArea' },
        { _id: 'u2', nombre_completo: 'Dos', correo_institucional: 'u2@x.co', rol: 'Supervisor' },
      ],
      responsable_id: { _id: 'u1', nombre_completo: 'Uno', correo_institucional: 'u1@x.co', rol: 'ResponsableArea' },
    };

    const resultado = responsablesDeDependencia(dep);

    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual({
      id: 'u1',
      nombre: 'Uno',
      correo: 'u1@x.co',
      rol: 'ResponsableArea',
    });
    expect(resultado.map((r) => r.id)).toEqual(['u1', 'u2']);
  });

  test('sin responsables devuelve una lista vacía', () => {
    expect(responsablesDeDependencia({})).toEqual([]);
    expect(responsablesDeDependencia({ responsables_ids: [], responsable_id: null })).toEqual([]);
  });
});

describe('plantillaService.construirFilas', () => {
  const dependenciaTic = {
    _id: 'dep-tic',
    nombre_dependencia: 'Gestión Tecnológica (TIC)',
    responsables_ids: [
      { _id: 'u-tic', nombre_completo: 'Franklin', correo_institucional: 'tic@x.co', rol: 'ResponsableArea' },
    ],
    responsable_id: { _id: 'u-tic', nombre_completo: 'Franklin', correo_institucional: 'tic@x.co', rol: 'ResponsableArea' },
  };

  test('genera las 14 filas y marca N/A las que no tienen dependencia en la base', () => {
    const filas = construirFilas({ dependencias: [dependenciaTic] });

    expect(filas).toHaveLength(14);
    const filaTic = filas.find((f) => f.id_fila === 1);
    expect(filaTic.aplica).toBe(true);
    expect(filaTic.marca).toBe('X');
    expect(filaTic.dependencia_id).toBe('dep-tic');
    expect(filaTic.dependencia_nombre).toBe('Gestión Tecnológica (TIC)');
    expect(filaTic.nombres).toEqual(['Franklin']);

    const filaSinDependencia = filas.find((f) => f.id_fila === 6);
    expect(filaSinDependencia.aplica).toBe(false);
    expect(filaSinDependencia.marca).toBe('N/A');
    expect(filaSinDependencia.dependencia_id).toBeNull();
  });

  test('una dependencia desactivada no genera casillero ni aparece como firmante', () => {
    const filas = construirFilas({
      dependencias: [{ ...dependenciaTic, activo: false }],
    });

    const filaTic = filas.find((f) => f.id_fila === 1);
    expect(filaTic.aplica).toBe(false);
    expect(filaTic.marca).toBe('N/A');
    expect(filaTic.responsables).toEqual([]);
  });

  test('la fila 14 la firma el supervisor y su apoyo de supervisión', () => {
    const filas = construirFilas({
      dependencias: [],
      supervisor: { _id: 'sup', nombre_completo: 'Carlos', correo_institucional: 'c@x.co', rol: 'Supervisor' },
      apoyoSupervision: { _id: 'apo', nombre_completo: 'Nelson', correo_institucional: 'n@x.co', rol: 'ResponsableArea' },
    });

    const fila14 = filas.find((f) => f.id_fila === 14);
    expect(fila14.aplica).toBe(true);
    expect(fila14.nombres).toEqual(['Carlos', 'Nelson']);
    expect(fila14.responsables.map((r) => r.id)).toEqual(['sup', 'apo']);
  });

  test('respeta la plantilla seleccionada (INSTRUCTORES deja la fila 6 en N/A)', () => {
    const filas = construirFilas({
      dependencias: [
        dependenciaTic,
        { _id: 'dep-acad', nombre_dependencia: 'Coordinación Académica y Formación', responsables_ids: [], responsable_id: null },
      ],
      tipoPlantilla: 'INSTRUCTORES',
    });

    expect(filas.find((f) => f.id_fila === 1).aplica).toBe(true);
    expect(filas.find((f) => f.id_fila === 8).aplica).toBe(true);
    expect(filas.find((f) => f.id_fila === 6).aplica).toBe(false);
  });

  test('una plantilla desconocida cae en COMPLETA', () => {
    const filas = construirFilas({ dependencias: [dependenciaTic], tipoPlantilla: 'NO_EXISTE' });
    expect(filas.find((f) => f.id_fila === 1).aplica).toBe(true);
  });

  test('las filas guardadas por el coordinator prevailecen sobre la plantilla', () => {
    const filas = construirFilas({
      dependencias: [dependenciaTic],
      tipoPlantilla: 'INSTRUCTORES',
      filasGuardadas: [
        { id_fila: 1, aplica: false, responsables: [], nombres: [] },
        {
          id_fila: 4,
          dependecia_id: null,
          dependencia_id: null,
          aplica: true,
          responsables: [{ _id: 'u-alm', nombre_completo: 'Martha', correo_institucional: 'a@x.co', rol: 'ResponsableArea' }],
        },
      ],
    });

    expect(filas.find((f) => f.id_fila === 1).aplica).toBe(false);
    expect(filas.find((f) => f.id_fila === 4).aplica).toBe(false);
  });

  test('los firmantes guardados reemplazan a los responsables de la dependencia', () => {
    const filas = construirFilas({
      dependencias: [dependenciaTic],
      filasGuardadas: [
        {
          id_fila: 1,
          dependencia_id: 'dep-tic',
          aplica: true,
          responsables: [{ _id: 'u-otro', nombre_completo: 'Otro', correo_institucional: 'o@x.co', rol: 'Supervisor' }],
          nombres: ['Otro'],
        },
      ],
    });

    const filaTic = filas.find((f) => f.id_fila === 1);
    expect(filaTic.nombres).toEqual(['Otro']);
    expect(filaTic.responsables[0].id).toBe('u-otro');
  });
});

describe('plantillaService.obtenerPlantillaContrato', () => {
  test('devuelve el tipo de plantilla y las filas construidas', async () => {
    DependenciaArea.find.mockReturnValue(cadenaConsulta([]));
    Usuario.findById.mockResolvedValue(null);

    const contrato = {
      _id: 'c1',
      plantilla_tipo: 'INSTRUCTORES',
      supervisor: null,
      plantilla_firmantes: [],
    };

    const resultado = await obtenerPlantillaContrato(contrato);

    expect(resultado.tipo).toBe('INSTRUCTORES');
    expect(resultado.filas).toHaveLength(14);
  });

  test('carga el supervisor y su apoyo para la fila 14', async () => {
    DependenciaArea.find.mockReturnValue(cadenaConsulta([]));
    Usuario.findById
      .mockResolvedValueOnce({ _id: 'sup', nombre_completo: 'Carlos', rol: 'Supervisor', apoyo_supervision_id: 'apo' })
      .mockResolvedValueOnce({ _id: 'apo', nombre_completo: 'Nelson', rol: 'ResponsableArea' });

    const contrato = { _id: 'c1', supervisor: 'sup', plantilla_firmantes: [] };
    const resultado = await obtenerPlantillaContrato(contrato);

    expect(Usuario.findById).toHaveBeenCalledWith('sup');
    expect(Usuario.findById).toHaveBeenCalledWith('apo');
    expect(resultado.filas.find((f) => f.id_fila === 14).nombres).toEqual(['Carlos', 'Nelson']);
  });

  test('usa el tipo predeterminado cuando el contrato no tiene plantilla', async () => {
    DependenciaArea.find.mockReturnValue(cadenaConsulta([]));
    Usuario.findById.mockResolvedValue(null);

    const resultado = await obtenerPlantillaContrato(
      { _id: 'c1', plantilla_firmantes: [] },
      { tipoPredeterminado: 'INSTRUCTORES' }
    );

    expect(resultado.tipo).toBe('INSTRUCTORES');
  });
});
