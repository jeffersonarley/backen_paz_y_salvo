// Pruebas unitarias de las validaciones de los modelos (sin conexión a base de datos).
process.env.JWT_SECRET = 'secreto_de_pruebas_unitarias_con_mas_de_32_caracteres';

const Usuario = require('../src/models/Usuario');
const DependenciaArea = require('../src/models/DependenciaArea');
const Contrato = require('../src/models/Contrato');
const TrazabilidadFirma = require('../src/models/TrazabilidadFirma');

// Valida un documento y devuelve el error (o null si la validación es correcta)
async function validar(documento) {
  try {
    await documento.validate();
    return null;
  } catch (error) {
    return error;
  }
}

describe('modelo Usuario', () => {
  test('exige nombre, correo y contraseña', async () => {
    const usuario = new Usuario({});
    const error = await validar(usuario);

    expect(error).toBeDefined();
    expect(error.errors.nombre_completo).toBeDefined();
    expect(error.errors.correo_institucional).toBeDefined();
    expect(error.errors.password_hash).toBeDefined();
  });

  test('normaliza el rol y pone los valores por defecto', async () => {
    const usuario = new Usuario({
      nombre_completo: 'X',
      correo_institucional: 'x@x.co',
      password_hash: 'h',
      rol: 'responsable-area',
    });

    expect(usuario.rol).toBe('ResponsableArea');
    expect(usuario.activo).toBe(true);
    expect(usuario.plantilla_predeterminada).toBe('COMPLETA');
    expect(usuario.apoyo_supervision_id).toBeNull();
    expect(usuario.dependencia_id).toBeNull();
  });

  test('rechaza un rol fuera de la jerarquía', async () => {
    const usuario = new Usuario({
      nombre_completo: 'X',
      correo_institucional: 'x@x.co',
      password_hash: 'h',
      rol: 'DIRECTOR',
    });

    expect((await validar(usuario)).errors.rol).toBeDefined();
  });

  test('acepta el apoyo de supervisión y la dependencia como ObjectId', async () => {
    const usuario = new Usuario({
      nombre_completo: 'X',
      correo_institucional: 'x@x.co',
      password_hash: 'h',
      rol: 'Supervisor',
      apoyo_supervision_id: '507f1f77bcf86cd799439011',
      dependencia_id: '507f1f77bcf86cd799439022',
    });

    expect(await validar(usuario)).toBeNull();
    expect(String(usuario.apoyo_supervision_id)).toBe('507f1f77bcf86cd799439011');
  });

  test('el correo institucional se guarda en minúsculas', async () => {
    const usuario = new Usuario({
      nombre_completo: 'X',
      correo_institucional: '  USUARIO@X.CO ',
      password_hash: 'h',
    });

    expect(usuario.correo_institucional).toBe('usuario@x.co');
  });
});

describe('modelo DependenciaArea', () => {
  test('exige el nombre de la dependencia', async () => {
    const dependencia = new DependenciaArea({});
    expect((await validar(dependencia)).errors.nombre_dependencia).toBeDefined();
  });

  test('acepta varios responsables y los guarda como lista', async () => {
    const dependencia = new DependenciaArea({
      nombre_dependencia: 'TIC',
      responsable_id: '507f1f77bcf86cd799439011',
      responsables_ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439022'],
    });

    expect(await validar(dependencia)).toBeNull();
    expect(dependencia.responsables_ids).toHaveLength(2);
    expect(dependencia.activo).toBe(true);
  });

  test('sin responsables la lista queda vacía', async () => {
    const dependencia = new DependenciaArea({ nombre_dependencia: 'Nueva' });
    expect(dependencia.responsables_ids).toEqual([]);
  });
});

describe('modelo Contrato', () => {
  const contratoValido = {
    numero_contrato: 'CNT-1',
    nombre_contratista: 'Contratista',
    correo_contratista: 'c@x.co',
    telefono: '3100000000',
    dependencia: '507f1f77bcf86cd799439022',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    bienes: [{ descripcion: 'Laptop', codigo_inventario: 'A-1', cantidad: 1, estado_bien: 'Bueno' }],
  };

  test('exige los datos essentials del contrato', async () => {
    const error = await validar(new Contrato({}));
    expect(error.errors.numero_contrato).toBeDefined();
    expect(error.errors.nombre_contratista).toBeDefined();
  });

  test('acepta la plantilla y los firmantes por contrato', async () => {
    const contrato = new Contrato({
      ...contratoValido,
      plantilla_tipo: 'INSTRUCTORES',
      plantilla_firmantes: [
        {
          id_fila: 1,
          dependencia_id: '507f1f77bcf86cd799439022',
          responsables: ['507f1f77bcf86cd799439011'],
          nombres: ['Responsable'],
          aplica: true,
          marca: 'X',
        },
      ],
    });

    expect(await validar(contrato)).toBeNull();
    expect(contrato.plantilla_tipo).toBe('INSTRUCTORES');
    expect(contrato.plantilla_firmantes[0].responsables).toHaveLength(1);
  });
});

describe('modelo TrazabilidadFirma', () => {
  test('los campos contrato y área guardan ObjectId', async () => {
    const trazabilidad = new TrazabilidadFirma({
      contrato_id: '507f1f77bcf86cd799439033',
      area_id: '507f1f77bcf86cd799439022',
    });

    expect(String(trazabilidad.contrato_id)).toBe('507f1f77bcf86cd799439033');
    expect(String(trazabilidad.area_id)).toBe('507f1f77bcf86cd799439022');
  });

  test('rechaza un estado de casillero no permitido', async () => {
    const trazabilidad = new TrazabilidadFirma({
      contrato_id: '507f1f77bcf86cd799439033',
      area_id: '507f1f77bcf86cd799439022',
      estado: 'Firmado',
    });

    expect((await validar(trazabilidad)).errors.estado).toBeDefined();
  });

  test('guarda los firmantes autorizados y el estado por defecto', async () => {
    const trazabilidad = new TrazabilidadFirma({
      contrato_id: '507f1f77bcf86cd799439033',
      area_id: '507f1f77bcf86cd799439022',
      firmantes_autorizados: ['507f1f77bcf86cd799439011'],
    });

    expect(await validar(trazabilidad)).toBeNull();
    expect(trazabilidad.estado).toBe('Pendiente');
    expect(trazabilidad.firmantes_autorizados).toHaveLength(1);
    expect(trazabilidad.hash_verificacion).toBe('');
  });
});
