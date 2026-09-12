<template>
  <q-page class="page-formato">
    <div class="toolbar no-print">
      <q-btn flat color="primary" icon="arrow_back" label="Volver" @click="volver" />
      <q-btn color="positive" icon="print" label="Imprimir" unelevated @click="imprimir" />
    </div>

    <div class="documento">
      <div class="encabezado-topo">
        <div class="logo-box">
          <img :src="logoSena" alt="Logo SENA" />
        </div>

        <div class="version-box">
          <div class="linea"><span>Versión:</span> <strong>1</strong></div>
          <div class="linea"><span>Código:</span> <strong>GCCON-F-088</strong></div>
        </div>
      </div>

      <div class="titulo-seccion">PROCESO</div>
      <div class="subtitulo-seccion">GESTIÓN CONTRACTUAL</div>
      <div class="subtitulo-seccion">NOMBRE DEL FORMATO</div>

      <div class="titulo-principal">
        ENTREGA DE BIENES E INFORMACIÓN DE EJECUCIÓN CONTRACTUAL POR EL CONTRATISTA
      </div>

      <div class="clasificacion-wrap">
        <div class="clasificacion-header">CLASIFICACIÓN DE LA INFORMACIÓN</div>
        <div class="fila-clasificacion">
          <div class="caja-clasificacion">
            <span>Pública</span>
            <span class="check-box">X</span>
          </div>
          <div class="caja-clasificacion">
            <span>Pública clasificada</span>
            <span class="check-box empty"></span>
          </div>
          <div class="caja-clasificacion">
            <span>Pública reservada</span>
            <span class="check-box empty"></span>
          </div>
        </div>
      </div>

      <div class="tabla-datos">
        <div class="fila-titulo">
          <div class="campo campo-grande">NOMBRES Y APELLIDOS DEL CONTRATISTA:</div>
          <div class="campo campo-chico">IDENTIFICACIÓN</div>
        </div>

        <div class="fila-multi">
          <div class="campo">CIUDAD</div>
          <div class="campo">FECHA</div>
          <div class="campo">REGIÓN</div>
        </div>

        <div class="fila-multi">
          <div class="campo">DIRECCIÓN U OFICINA DONDE SE EJECUTÓ EL CONTRATO:</div>
          <div class="campo">NÚMERO Y FECHA DEL CONTRATO</div>
        </div>
      </div>

      <div class="titulo-seccion small">CAUSAL DE TERMINACIÓN DEL CONTRATO</div>

      <div class="fila-checks">
        <div class="casilla"><span class="box"></span> LIQUIDACIÓN POR MUTUO ACUERDO</div>
        <div class="casilla"><span class="box"></span> CESIÓN</div>
        <div class="casilla"><span class="box"></span> LIQUIDACIÓN ANTICIPADA</div>
        <div class="casilla"><span class="box"></span> TERMINACIÓN UNILATERAL</div>
      </div>

      <div class="tabla-dependencias">
        <div class="thead">
          <div>DEPENDENCIA</div>
          <div>RESPONSABLES</div>
          <div>FIRMA</div>
        </div>

        <div class="tr">
          <div class="dep-cell">GESTIÓN DE TIC</div>
          <div class="resp-cell">Franklin Rolando Chacon Lopez</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">ADMINISTRACIÓN DE DOCUMENTOS</div>
          <div class="resp-cell">Hilda Lucía Ramirez Alvarado</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">
            ENTREGA CARNÉ (A SUPERVISOR DEL CONTRATO EN LAS REGIONES Y CONTRATOS DE FORMACIÓN)
          </div>
          <div class="resp-cell">Jhon Fredy Sanabria Muñoz</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">ALMACÉN E INVENTARIOS</div>
          <div class="resp-cell">Generar reporte de https://miinventario.sena.edu.co</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">SERVICIOS GENERALES</div>
          <div class="resp-cell">Juan David Silva Guerreros</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">CONTABILIDAD</div>
          <div class="resp-cell">Zaida Leny Melgarejo Ballesteros</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">TESORERÍA</div>
          <div class="resp-cell">Nelcy Mabel Mayorga Pinto</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">COORDINACIÓN DE ÁREA/GRUPO/ACADÉMICA</div>
          <div class="resp-cell">Jhon Fredy Sanabria Muñoz</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">BIBLIOTECA</div>
          <div class="resp-cell">
            María Juliana Calis Camacho / Yudith Milagros Martínez Bautista
          </div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">OTRO (LÍDER SIGA)</div>
          <div class="resp-cell">Zaida Jeleidy Garcia Jaimes</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">OTRO (ADMINISTRACIÓN EDUCATIVA)</div>
          <div class="resp-cell">Erika Johana Gómez Verdugo</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">
            APOYO AL SEGUIMIENTO DE LOS PROCESOS ADMINISTRATIVOS Y DE NOVEDADES
          </div>
          <div class="resp-cell">Nelson Fabián Duarte Peñaloza / Elieen Erlys Hurtado Ariza</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">APOYO ETA PRODUCTIVA</div>
          <div class="resp-cell">Karen Andrea Garcia Carreño</div>
          <div class="firma-box"></div>
        </div>
        <div class="tr">
          <div class="dep-cell">SUPERVISOR DE CONTRATO</div>
          <div class="resp-cell">Jhon Fredy Sanabria Muñoz</div>
          <div class="firma-box"></div>
        </div>
      </div>

      <div class="tabla-baja">
        <div class="row">
          <div class="cell label">
            ELEMENTOS FALTANTES U OBLIGACIONES PENDIENTES (RELACIÓN CON SU RESPECTIVO VALOR)
          </div>
          <div class="cell value"></div>
        </div>

        <div class="row otros-row">
          <div class="cell label">OTROS:</div>
          <div class="cell value empty-value">
            <span class="linea-otros"></span>
          </div>
        </div>
      </div>

      <div class="firma-final">
        <div class="linea-firma-wrap">
          <div class="linea-firma"></div>
          <div class="texto-firma">Firma del Contratista</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import logoSena from '../images/logo-sena.png'

const router = useRouter()

function volver() {
  router.push({ name: 'solicitudes' })
}

function imprimir() {
  window.print()
}
</script>

<style scoped>
.page-formato {
  background: linear-gradient(180deg, #edf3f8 0%, #e6edf4 100%);
  min-height: 100vh;
  padding: 26px 16px 32px;
  font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
  color: #18212d;
}

.toolbar {
  max-width: 1180px;
  margin: 0 auto 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(4px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.documento {
  --b: #8fa8bf;
  width: min(1180px, 100%);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid var(--b);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 22px 46px rgba(15, 23, 42, 0.12);
}

.encabezado-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--b);
  padding: 18px 24px 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
  position: relative;
}

.encabezado-topo::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, #28b463 0%, #1f8f52 100%);
}

.logo-box {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.logo-box img {
  width: 128px;
  height: auto;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06));
  margin-left: 12px;
}

.version-box {
  min-width: 180px;
  border: 1px solid var(--b);
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
  background: linear-gradient(180deg, #f7fafc 0%, #eef4f9 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.linea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.titulo-seccion {
  background: linear-gradient(180deg, #1f2d3d 0%, #0f172a 100%);
  color: #ffffff;
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 10px 12px;
  font-size: 17px;
  text-transform: uppercase;
}

.subtitulo-seccion {
  background: linear-gradient(180deg, #f7fafd 0%, #edf3f8 100%);
  border-top: 1px solid var(--b);
  border-bottom: 1px solid var(--b);
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  padding: 8px 10px;
  color: #243447;
  text-transform: uppercase;
}

.titulo-principal {
  border-top: 1px solid var(--b);
  border-bottom: 1px solid var(--b);
  text-align: center;
  font-size: 16px;
  font-weight: 900;
  padding: 14px 18px;
  line-height: 1.4;
  color: #122033;
  background: linear-gradient(180deg, #fcfdff 0%, #f6f9fc 100%);
}

.clasificacion-wrap {
  border-bottom: 1px solid var(--b);
  background: #f9fbfd;
}

.clasificacion-header {
  background: #eff4fa;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  padding: 7px 8px;
  border-bottom: 1px solid var(--b);
  color: #1d2a39;
  text-transform: uppercase;
}

.fila-clasificacion {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.caja-clasificacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  border-right: 1px solid var(--b);
  background: #ffffff;
}

.caja-clasificacion:last-child {
  border-right: none;
}

.check-box {
  width: 24px;
  height: 24px;
  border: 1px solid #1f2a37;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  background: linear-gradient(180deg, #ebf9ef 0%, #dff7e8 100%);
  color: #1b6a3f;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.check-box.empty {
  background: linear-gradient(180deg, #f7f9fb 0%, #edf2f8 100%);
}

.tabla-datos {
  border-bottom: 1px solid var(--b);
  background: #fff;
}

.fila-titulo,
.fila-multi {
  display: grid;
  grid-template-columns: 3fr 1.2fr;
  border-bottom: 1px solid var(--b);
}

.fila-multi {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.campo {
  min-height: 42px;
  padding: 8px 12px;
  border-right: 1px solid var(--b);
  display: flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 700;
  background: #ffffff;
}

.campo:last-child {
  border-right: none;
}

.campo-grande {
  font-weight: 800;
  text-transform: uppercase;
}

.campo-chico {
  justify-content: center;
  font-weight: 800;
  text-transform: uppercase;
}

.titulo-seccion.small {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  color: #ffffff;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.fila-checks {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--b);
  border-bottom: 1px solid var(--b);
  background: #f9fbfd;
}

.casilla {
  border-right: 1px solid var(--b);
  padding: 10px 10px;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  color: #1d2a39;
}

.casilla:last-child {
  border-right: none;
}

.box {
  width: 17px;
  height: 17px;
  border: 1px solid #1f2a37;
  border-radius: 4px;
  background: #ffffff;
  flex-shrink: 0;
}

.tabla-dependencias {
  border-top: 1px solid var(--b);
  background: #ffffff;
}

.thead,
.tr {
  display: grid;
  grid-template-columns: 1.3fr 1.7fr 0.7fr;
  border-bottom: 1px solid var(--b);
}

.thead {
  background: linear-gradient(180deg, #edf3f9 0%, #e6eef6 100%);
  font-size: 12px;
  font-weight: 800;
  color: #18212d;
  text-transform: uppercase;
}

.thead>div,
.tr>div {
  padding: 9px 10px;
  min-height: 42px;
  border-right: 1px solid var(--b);
  display: flex;
  align-items: center;
}

.thead>div:last-child,
.tr>div:last-child {
  border-right: none;
}

.dep-cell,
.resp-cell {
  font-size: 11.5px;
  line-height: 1.3;
}

.firma-box {
  min-width: 100%;
  min-height: 34px;
  border: 1px solid var(--b);
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f3f7fb 100%);
  margin: 2px 1px;
}

.tabla-baja {
  border: 1px solid var(--b);
  border-top: none;
  background: #ffffff;
  overflow: hidden;
}

.row {
  display: grid;
  grid-template-columns: 1.25fr 2.4fr;
  border-top: 1px solid var(--b);
}

.otros-row {
  min-height: 50px;
  grid-template-columns: 90px 1fr;
  column-gap: 0;
  border-top: none;
}

.otros-row .label {
  padding-right: 0;
  white-space: nowrap;
}

.linea-otros {
  display: block;
  width: 100%;
  height: 1px;
  background: #1f2a37;
  margin-top: 14px;
}

.supervisor-row {
  grid-template-columns: 0.78fr 0.18fr 1.9fr;
}

.row:first-child {
  border-top: none;
}

.cell {
  min-height: 44px;
  padding: 10px 12px 8px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  display: flex;
  align-items: center;
  border-right: none;
  color: #1d2a39;
}

.cell:last-child {
  border-right: none;
}

.check-cell {
  justify-content: center;
  padding: 0;
  border-left: 1px solid var(--b);
}

.mini-check {
  width: 14px;
  height: 14px;
  border: 1px solid #1d8f42;
  background: #dff7e8;
  display: inline-block;
  border-radius: 3px;
}

.label {
  background: transparent;
  border-right: none;
}

.supervisor-label {
  padding-left: 8px;
}

.check-cell {
  border-right: none;
  justify-content: center;
  font-weight: 700;
}

.supervisor-name {
  justify-content: flex-start;
}

.value {
  border-right: none;
  position: relative;
  min-height: 44px;
  background: #fdfeff;
}

.otros-row .value {
  border-bottom: none;
  position: relative;
  min-height: 36px;
  padding-left: 0;
  align-items: center;
}

.empty-value {
  background: transparent;
  border-bottom: 1px solid transparent;
}

.firma-final {
  display: flex;
  justify-content: flex-end;
  padding: 0 0 18px;
  margin-top: 60px;
  border: none;
}

.linea-firma-wrap {
  width: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 18px;
  border: none;
}

.linea-firma {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, #eff3f8 0%, #1d2a39 50%, #eff3f8 100%);
  border: none;
  margin-bottom: 7px;
}

.firma-final .linea-firma-wrap {
  border: none;
}

.texto-firma {
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  line-height: 1.1;
  color: #1d2a39;
}



/* ===================== IMPRESIÓN ===================== */
@media print {
  /* Configuración de página (Carta, márgenes estrechos) */
  @page {
    size: Letter portrait;
    margin: 10mm 10mm 12mm;
  }

  /* Forzar impresión de colores y fondos (encabezados oscuros, verde SENA) */
  *,
  *::before,
  *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;

  }

  html, body {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Quitar padding/fondo de la página en impresión */
  .page-formato {
    background: #ffffff !important;
    padding: 0 !important;
    min-height: auto !important;
  }

  /* Ocultar toolbar de acciones */
  .toolbar.no-print,
  .no-print {
    display: none !important;
  }

  /* El documento ocupa todo el ancho útil, sin sombras ni redondeo */
  .documento {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    border: 1px solid #8fa8bf !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  /* Encabezado: conservar barra verde SENA, aligerar gradiente */
  .encabezado-topo {
    border-radius: 0 !important;
    background: #ffffff !important;
    padding: 10px 14px !important;
  }
  .encabezado-topo::before {
    /* mantén el acento verde SENA */
    background: #1f8f52 !important;
  }
  .logo-box img {
    width: 110px !important;
    margin-left: 0 !important;
  }

  /* Aplanar gradientes de los encabezados para usar tinta plana */
  .titulo-seccion,
  .titulo-seccion.small {
    background: #0f172a !important;
    color: #ffffff !important;
    font-size: 15px !important;
    padding: 8px 10px !important;
  }
  .subtitulo-seccion {
    background: #edf3f8 !important;
    padding: 6px 8px !important;
    font-size: 13px !important;
  }
  .titulo-principal {
    background: #f6f9fc !important;
    font-size: 14px !important;
    padding: 10px 12px !important;
  }

  /* Clasificación de la información */
  .clasificacion-header { background: #eff4fa !important; }
  .caja-clasificacion { background: #ffffff !important; }
  .check-box { background: #dff7e8 !important; }
  .check-box.empty { background: #edf2f8 !important; }

  /* Tabla de datos del contratista */
  .tabla-datos,
  .tabla-dependencias,
  .tabla-baja { background: #ffffff !important; }

  .fila-checks { background: #f9fbfd !important; }
  .casilla { background: #ffffff !important; }

  /* Encabezado de la tabla de dependencias */
  .thead { background: #e6eef6 !important; }

  /* Cajas de firma: conservar fondo claro y bordes */
  .firma-box {
    background: #ffffff !important;
    border: 1px solid #8fa8bf !important;
    border-radius: 0 !important;
    min-height: 30px !important;
    margin: 1px 0 !important;
  }

  /* Evitar cortes dentro de una fila de la tabla de dependencias */
  .tabla-dependencias .tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Evitar que quede una fila huérfana al final de página */
  .tabla-dependencias .thead {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  /* Mantener junto el título de sección con lo que sigue */
  .titulo-seccion,
  .titulo-seccion.small,
  .subtitulo-seccion,
  .clasificacion-header,
  .fila-titulo {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  /* Mantener unida la fila de "Otros" con la fila anterior */
  .tabla-baja .otros-row {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Firma final: mantener con su contenido y evitar página en blanco de cola */
  .firma-final {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-top: 28px !important;
    padding-bottom: 0 !important;
  }
  .linea-firma {
    background: #1d2a39 !important;
  }

  /* Línea de "Otros" más nítida */
  .linea-otros { background: #1f2a37 !important; }

  /* Reducir un poco tamaños para que quepa bien en Carta */
  .dep-cell,
  .resp-cell { font-size: 10.5px !important; }
  .campo { font-size: 10.5px !important; min-height: 36px !important; }
  .cell { font-size: 11px !important; min-height: 38px !important; }

  /* Bordes más finos y consistentes en impresión */
  .documento,
  .encabezado-topo,
  .titulo-seccion,
  .subtitulo-seccion,
  .titulo-principal,
  .clasificacion-wrap,
  .clasificacion-header,
  .caja-clasificacion,
  .tabla-datos,
  .fila-titulo,
  .fila-multi,
  .campo,
  .fila-checks,
  .casilla,
  .tabla-dependencias,
  .thead,
  .tr,
  .tabla-baja,
  .row,
  .cell {
    border-color: #8fa8bf !important;
  }
}

/* Vista previa de impresión en Chrome/Edge: oculta la toolbar al usar Ctrl+P */
@media print {
  .no-print { display: none !important; }
}

</style>
