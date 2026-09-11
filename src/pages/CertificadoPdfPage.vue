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
  background: #e7e7e7;
  min-height: 100vh;
  padding: 18px 12px;
  font-family: Arial, Helvetica, sans-serif;
  color: #111;
}

.toolbar {
  max-width: 1180px;
  margin: 0 auto 14px;
  display: flex;
  justify-content: space-between;
}

.documento {
  width: min(1180px, 100%);
  margin: 0 auto;
  background: #fff;
  border: 1px solid #111;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.08);
}

.encabezado-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid #111;
  padding: 10px 16px 8px;
  min-height: 90px;
}

.logo-box {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-width: 0;
  padding-top: 4px;
  margin-left: 12%;
}

.logo-box img {
  width: 110px;
  height: auto;
  display: block;
  margin: 0 auto;
}

.version-box {
  min-width: 150px;
  border: 1px solid #111;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.6;
  text-align: left;
  margin-left: auto;
  margin-top: 0;
}

.linea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.titulo-seccion {
  background: #0d0d0d;
  color: #fff;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 7px 12px;
  font-size: 18px;
}

.subtitulo-seccion {
  background: #f2f2f2;
  border-top: 1px solid #111;
  border-bottom: 1px solid #111;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  padding: 7px 10px;
}

.titulo-principal {
  border-top: 1px solid #111;
  border-bottom: 1px solid #111;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  padding: 10px 16px;
  line-height: 1.4;
}

.clasificacion-wrap {
  border-bottom: 1px solid #111;
}

.clasificacion-header {
  background: #f5f5f5;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 8px;
  border-bottom: 1px solid #111;
}

.fila-clasificacion {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.caja-clasificacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  border-right: 1px solid #111;
}

.caja-clasificacion:last-child {
  border-right: none;
}

.check-box {
  width: 22px;
  height: 22px;
  border: 1px solid #111;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #fff;
}

.check-box.empty {
  background: #f8f8f8;
}

.tabla-datos {
  border-bottom: 1px solid #111;
}

.fila-titulo,
.fila-multi {
  display: grid;
  grid-template-columns: 3fr 1.2fr;
  border-bottom: 1px solid #111;
}

.fila-multi {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.campo {
  min-height: 34px;
  padding: 7px 10px;
  border-right: 1px solid #111;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}

.campo:last-child {
  border-right: none;
}

.campo-grande {
  font-weight: 700;
  text-transform: uppercase;
}

.campo-chico {
  justify-content: center;
  font-weight: 700;
  text-transform: uppercase;
}

.titulo-seccion.small {
  background: #0d0d0d;
  color: #fff;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.fila-checks {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid #111;
  border-bottom: 1px solid #111;
}

.casilla {
  border-right: 1px solid #111;
  padding: 10px 8px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 54px;
}

.casilla:last-child {
  border-right: none;
}

.box {
  width: 16px;
  height: 16px;
  border: 1px solid #111;
  background: #fff;
  flex-shrink: 0;
}

.tabla-dependencias {
  border-top: 1px solid #111;
}

.thead,
.tr {
  display: grid;
  grid-template-columns: 1.3fr 1.7fr 0.7fr;
  border-bottom: 1px solid #111;
}

.thead {
  background: #f4f4f4;
  font-size: 12px;
  font-weight: 700;
}

.thead > div,
.tr > div {
  padding: 8px 9px;
  min-height: 36px;
  border-right: 1px solid #111;
  display: flex;
  align-items: center;
}

.thead > div:last-child,
.tr > div:last-child {
  border-right: none;
}

.dep-cell,
.resp-cell {
  font-size: 11px;
}

.firma-box {
  min-width: 100%;
  min-height: 28px;
  border: 1px solid #111;
  background: #fff;
}

.tabla-baja {
  border: 1px solid #111;
  border-top: none;
  background: #fff;
}

.row {
  display: grid;
  grid-template-columns: 1.25fr 2.4fr;
  border-top: 1px solid #111;
}

.otros-row {
  min-height: 44px;
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
  background: #111;
  margin-top: 14px;
}

.supervisor-row {
  grid-template-columns: 0.78fr 0.18fr 1.9fr;
}

.row:first-child {
  border-top: none;
}

.cell {
  min-height: 42px;
  padding: 8px 10px 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  display: flex;
  align-items: center;
  border-right: none;
}

.cell:last-child {
  border-right: none;
}

.check-cell {
  justify-content: center;
  padding: 0;
  border-left: 1px solid #111;
}

.mini-check {
  width: 14px;
  height: 14px;
  border: 1px solid #1d8f42;
  background: #dff7e8;
  display: inline-block;
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
  min-height: 42px;
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
  padding: 0 0 12px;
  margin-top: 32px;
  border: none;
}

.linea-firma-wrap {
  width: 230px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 18px;
  border: none;
}

.linea-firma {
  width: 100%;
  height: 1px;
  background: #111;
  border: none;
  margin-bottom: 6px;
}

.firma-final .linea-firma-wrap {
  border: none;
}

.texto-firma {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 1.1;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 8mm 9mm 8mm;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff;
  }

  .no-print {
    display: none !important;
  }

  .page-formato {
    background: white;
    padding: 0;
    margin: 0;
    min-height: auto;
  }

  .documento {
    box-shadow: none;
    border: 1px solid #111;
    width: 100%;
    max-width: 100%;
    margin: 0;
    box-sizing: border-box;
  }

  .documento,
  .titulo-seccion,
  .subtitulo-seccion,
  .titulo-principal,
  .clasificacion-wrap,
  .clasificacion-header,
  .fila-clasificacion,
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
  .cell,
  .otros-row .label,
  .otros-row .value {
    border-left: 1px solid #111;
    border-right: 1px solid #111;
    box-sizing: border-box;
  }

  .row {
    border-top: 1px solid #111;
  }

  .caja-clasificacion:last-child,
  .casilla:last-child,
  .thead > div:last-child,
  .tr > div:last-child,
  .row > div:last-child,
  .row .cell:last-child,
  .cell:last-child,
  .otros-row .value {
    border-right: 1px solid #111 !important;
  }

  .tabla-baja {
    border: 1px solid #111;
    border-top: none;
    background: #fff;
  }

  .tabla-baja .row {
    display: grid;
    grid-template-columns: 1.18fr 2.82fr;
    border-top: 1px solid #111;
    min-height: 52px;
  }

  .tabla-baja .row:first-child {
    border-top: none;
  }

  .tabla-baja .row .cell {
    border-right: 1px solid #111;
    padding: 8px 10px;
  }

  .tabla-baja .row .cell:last-child {
    border-right: none;
  }

  .otros-row {
    grid-template-columns: 150px 1fr;
    column-gap: 0;
    border-top: none;
    min-height: 48px;
  }

  .otros-row .label {
    padding-right: 0;
    white-space: nowrap;
    border-right: 1px solid #111;
    align-items: center;
    font-weight: 700;
  }

  .linea-otros {
    display: block;
    width: 100%;
    height: 1px;
    background: #111;
    margin-top: 11px;
  }

  .otros-row .value {
    position: relative;
    align-items: center;
    padding: 0;
    border-right: 1px solid #111;
  }

  .otros-row .value::after {
    content: none;
  }

  .firma-final {
    justify-content: flex-end;
    margin-top: 20px;
    padding-right: 0;
  }

  .linea-firma-wrap {
    width: 240px;
    margin-top: 0;
  }

  .linea-firma {
    width: 100%;
    height: 1px;
    background: #111;
  }
}
</style>
