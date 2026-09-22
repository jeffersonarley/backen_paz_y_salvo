<template>
  <q-page class="page-formato">
    <div class="toolbar no-print">
      <q-btn flat color="primary" icon="arrow_back" label="Volver" @click="volver" />
      <div class="q-gutter-sm">
        <q-btn color="positive" icon="print" label="Imprimir" unelevated @click="imprimir" />
      </div>
    </div>

    <div class="documento-wrapper">
      <div class="documento">
        <!-- Encabezado con Logo y Versión -->
        <div class="encabezado-topo">
          <div class="encabezado-spacer"></div>
          <div class="logo-box">
            <img :src="logoSena" alt="Logo SENA" class="logo-sena" />
          </div>

          <div class="version-box">
            <div class="version-fila">Versión: 1</div>
            <div class="version-fila">
              <div>Código:</div>
              <div>GCCON-F-088</div>
            </div>
          </div>
        </div>

        <!-- Títulos Principales en Bloques Negros y Blancos -->
        <div class="barra-negra">PROCESO</div>
        <div class="fila-blanca">GESTIÓN CONTRACTUAL</div>
        <div class="barra-negra">NOMBRE DEL FORMATO</div>
        <div class="fila-blanca texto-formato">
          ENTREGA DE BIENES E INFORMACIÓN DE EJECUCIÓN CONTRACTUAL POR EL CONTRATISTA
        </div>
        <div class="barra-negra">CLASIFICACIÓN DE LA INFORMACIÓN</div>

        <!-- Tabla de Clasificación de la Información (6 celdas exactas) -->
        <div class="clasificacion-tabla">
          <div class="clasif-col">Pública</div>
          <div class="clasif-check">X</div>
          <div class="clasif-col">Pública Clasificada</div>
          <div class="clasif-check"></div>
          <div class="clasif-col">Pública Reservada</div>
          <div class="clasif-check"></div>
        </div>

        <!-- Datos del Contratista - Cuadrícula Oficial GCCON-F-088 -->
        <div class="seccion-datos">
          <!-- Fila 1: Nombres y Apellidos del Contratista | Identificación -->
          <div class="fila-contratista-1">
            <div class="celda-nombre-contratista">
              <span class="etiqueta-form">NOMBRES Y APELLIDOS DEL CONTRATISTA:</span>
              <span class="valor-form text-weight-bold">{{ datosSolicitud.contratista }}</span>
            </div>
            <div class="celda-identificacion-header">IDENTIFICACIÓN</div>
          </div>

          <!-- Fila 2: Ciudad | Fecha | Regional | Valor Identificación -->
          <div class="fila-contratista-2">
            <div class="bloque-ciudad-fecha-regional">
              <div class="celda-etiqueta celda-ciudad-lbl">CIUDAD</div>
              <div class="celda-valor celda-ciudad-val">{{ datosSolicitud.ciudad }}</div>
              <div class="celda-etiqueta celda-fecha-lbl">FECHA</div>
              <div class="celda-valor celda-fecha-val">{{ datosSolicitud.fecha }}</div>
              <div class="celda-etiqueta celda-regional-lbl">REGIONAL</div>
              <div class="celda-valor celda-regional-val">{{ datosSolicitud.regional }}</div>
            </div>
            <div class="celda-identificacion-valor">
              {{ datosSolicitud.identificacion }}
            </div>
          </div>

          <!-- Fila 3: Dirección u Oficina donde se ejecutó el contrato -->
          <div class="fila-contratista-3">
            <div class="celda-etiqueta celda-direccion-lbl">
              DIRECCIÓN U OFICINA DONDE SE EJECUTÓ EL CONTRATO:
            </div>
            <div class="celda-valor celda-direccion-val">{{ datosSolicitud.direccion }}</div>
          </div>

          <!-- Fila 4: Número y Fecha de Contrato -->
          <div class="fila-contratista-4">
            <div class="celda-etiqueta celda-contrato-lbl">NÚMERO Y FECHA DE CONTRATO:</div>
            <div class="celda-valor celda-contrato-val">{{ datosSolicitud.contrato }}</div>
          </div>
        </div>

        <!-- Causal de Terminación del Contrato -->
        <div class="titulo-causal">CAUSAL DE TERMINACIÓN DEL CONTRATO</div>

        <div class="fila-causales">
          <div class="causal-item">
            <span class="causal-nombre">LIQUIDACIÓN POR MUTUO<br />ACUERDO</span>
            <div class="causal-caja-cuadrada"></div>
          </div>
          <div class="causal-item">
            <span class="causal-nombre">CESIÓN</span>
            <div class="causal-caja-rect"></div>
          </div>
          <div class="causal-item">
            <span class="causal-nombre">LIQUIDACIÓN ANTICIPADA<br />POR MUTUO ACUERDO</span>
            <div class="causal-caja-cuadrada"></div>
          </div>
          <div class="causal-item">
            <span class="causal-nombre">TERMINACIÓN<br />UNILATERAL</span>
            <div class="causal-caja-cuadrada"></div>
          </div>
        </div>

        <!-- Tabla de Dependencias Oficial (14 filas exactas de la foto) -->
        <div class="tabla-dep">
          <div class="tr-head">
            <div class="th-dep">DEPENDENCIA SENA</div>
            <div class="th-marca">Marcar<br />con x</div>
            <div class="th-resp-wrap">
              <div class="th-resp-top">RESPONSABLES</div>
              <div class="th-resp-sub">
                <div class="th-nombres">NOMBRES Y APELLIDOS</div>
                <div class="th-firma">FIRMA</div>
              </div>
            </div>
          </div>

          <!-- 1 -->
          <div class="tr-row">
            <div class="td-dep">GESTIÓN DE TIC</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Franklin Rolando Chacon Lopez</div>
            <div class="td-firma"></div>
          </div>

          <!-- 2 -->
          <div class="tr-row">
            <div class="td-dep">ADMINISTRACIÓN DE DOCUMENTOS</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Hilda Lucia Ramirez Alvarado</div>
            <div class="td-firma"></div>
          </div>

          <!-- 3 -->
          <div class="tr-row">
            <div class="td-dep">
              ENTREGA CARNÉ (Al Supervisor del Contrato en las Regionales y Centros de Formación)<br />SECRETARÍA
              GENERAL
            </div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Johon Fredy Sanabria Muñoz</div>
            <div class="td-firma"></div>
          </div>

          <!-- 4 -->
          <div class="tr-row">
            <div class="td-dep">ALMACÉN E INVENTARIOS</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">
              Generar reporte de https://miinventario.sena.edu.co/Inicio.aspx y anexar al formato,
              garantizando que no tiene elementos a su cargo.
            </div>
            <div class="td-firma"></div>
          </div>

          <!-- 5 -->
          <div class="tr-row">
            <div class="td-dep">
              SERVICIOS GENERALES, ADQUISICIONES<br />(Administración de edificio; Contratación)
            </div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Juan David Silva Gutierrez</div>
            <div class="td-firma"></div>
          </div>

          <!-- 6 -->
          <div class="tr-row">
            <div class="td-dep">CONTABILIDAD</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Zaida Leny Melgarejo Ballesteros</div>
            <div class="td-firma"></div>
          </div>

          <!-- 7 -->
          <div class="tr-row">
            <div class="td-dep">TESORERÍA</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Nelcy Mabel Mayorga Pinto</div>
            <div class="td-firma"></div>
          </div>

          <!-- 8 -->
          <div class="tr-row">
            <div class="td-dep">COORDINACIÓN DE: ÁREA/GRUPO/ACADÉMICA</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Johon Fredy Sanabria Muñoz</div>
            <div class="td-firma"></div>
          </div>

          <!-- 9 -->
          <div class="tr-row">
            <div class="td-dep">BIBLIOTECA</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">
              Andrea Juliana Celis Camacho / Yudith Milagros Martinez Bautista
            </div>
            <div class="td-firma"></div>
          </div>

          <!-- 10 -->
          <div class="tr-row">
            <div class="td-dep">OTRO (LÍDER SIGA)</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Zaida Jebridy Garcia Jaimes</div>
            <div class="td-firma"></div>
          </div>

          <!-- 11 -->
          <div class="tr-row">
            <div class="td-dep">OTRO (ADMINISTRACIÓN EDUCATIVA)</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Erika Johana Gómez Verdugo</div>
            <div class="td-firma"></div>
          </div>

          <!-- 12 -->
          <div class="tr-row">
            <div class="td-dep">
              APOYO AL SEGUIMIENTO DE LOS PROCESOS ADMINISTRATIVOS Y NOVEDADES
            </div>
            <div class="td-marca">X</div>
            <div class="td-nombres">
              Nelson Fabian Duarte Peñaloza / Eileen Erfensi Hurtado Ariza
            </div>
            <div class="td-firma"></div>
          </div>

          <!-- 13 -->
          <div class="tr-row">
            <div class="td-dep">APOYO ETAPA PRODUCTIVA</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Karen Andrea García Carreño</div>
            <div class="td-firma"></div>
          </div>

          <!-- 14 -->
          <div class="tr-row">
            <div class="td-dep">SUPERVISOR DE CONTRATO</div>
            <div class="td-marca">X</div>
            <div class="td-nombres">Johon Fredy Sanabria Muñoz</div>
            <div class="td-firma"></div>
          </div>
        </div>

        <!-- Sección Inferior: Elementos faltantes, Otros y Firma del Contratista -->
        <div class="seccion-inferior">
          <div class="fila-elementos">
            ELEMENTOS FALTANTES U OBLIGACIONES PENDIENTES (Relacionar con su respectivo valor)
          </div>
          <div class="espacio-elementos"></div>

          <div class="fila-otros-inf">
            <span class="otros-label">OTROS :</span>
            <span class="otros-puntos"></span>
          </div>

          <div class="linea-separador-inf"></div>

          <div class="zona-firma-inf">
            <div
              class="caja-firma-contratista cursor-pointer"
              @click="abrirModalFirma"
              title="Clic para estampar, cambiar o ajustar la firma del contratista"
            >
              <div v-if="firmaGuardada" class="contenedor-firma-img">
                <img :src="firmaGuardada" alt="Firma del Contratista" class="img-firma-estampada" />
                <q-tooltip>Clic para editar, agrandar o ajustar tu firma</q-tooltip>
              </div>
              <div v-else class="contenedor-firma-placeholder no-print">
                <q-btn flat dense size="xs" color="primary" icon="draw" label="Clic para firmar" />
              </div>
              <div class="linea-firma-sola"></div>
              <div class="texto-firma-sola">Firma del Contratista</div>
            </div>
          </div>

          <div class="linea-separador-inf"></div>
        </div>
      </div>
    </div>

    <!-- Diálogo para Pegar o Subir Firma directamente desde el Certificado -->
    <q-dialog v-model="dialogoFirma" persistent>
      <q-card style="min-width: 480px; max-width: 90vw">
        <q-card-section class="bg-primary text-white row items-center justify-between">
          <div class="text-h6">
            <q-icon name="content_paste" class="q-mr-sm" />
            Pegar o Cargar Firma en el Documento
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-8 q-mb-sm">
            Pegue su firma con <strong>Ctrl + V</strong>, cárguela como imagen o trácela en el
            recuadro. Se estampará directamente en este certificado.
          </div>
          <FirmaCanvas ref="canvasRef" />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            color="positive"
            icon="verified"
            label="Estampar en Certificado"
            @click="guardarFirmaCertificado"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSolicitudesStore } from '../stores/useSolicitudesStore.js'
import FirmaCanvas from '../components/FirmaCanvas.vue'
import logoSena from '../images/logo-sena.png'

const router = useRouter()
const route = useRoute()
const store = useSolicitudesStore()

const firmaGuardada = ref(null)
const dialogoFirma = ref(false)
const canvasRef = ref(null)

function abrirModalFirma() {
  dialogoFirma.value = true
  if (firmaGuardada.value) {
    nextTick(() => {
      if (canvasRef.value && typeof canvasRef.value.cargarDataUrl === 'function') {
        canvasRef.value.cargarDataUrl(firmaGuardada.value)
      }
    })
  }
}

function guardarFirmaCertificado() {
  if (!canvasRef.value) return
  const dataUrl = canvasRef.value.exportarBase64()
  firmaGuardada.value = dataUrl
  const codigo = route.query.codigo || route.params.id
  if (codigo) {
    localStorage.setItem(`firma_${codigo}`, dataUrl)
  }
  localStorage.setItem('ultima_firma', dataUrl)
  dialogoFirma.value = false
}
const datosSolicitud = ref({
  contratista: '',
  identificacion: '',
  ciudad: 'Ibagué',
  fecha: new Date().toLocaleDateString('es-CO'),
  regional: 'Tolima',
  direccion: 'Centro de Comercio y Servicios',
  contrato: '',
  responsable: '',
  estado: 'En revisión',
  observacionRechazo: '',
  bienesFaltantes: [],
  firmas: [],
})

onMounted(() => {
  const codigo = route.query.codigo || route.params.id
  if (codigo) {
    const f = localStorage.getItem(`firma_${codigo}`) || localStorage.getItem('ultima_firma')
    if (f) firmaGuardada.value = f

    let encontrada = null
    if (typeof store.obtenerPorCodigo === 'function') {
      encontrada = store.obtenerPorCodigo(codigo)
    } else if (Array.isArray(store.solicitudes)) {
      encontrada = store.solicitudes.find(
        (s) =>
          (s.numeroSolicitud || s.solicitud || s.codigo || s.numeroContrato || s.contrato) ===
          codigo,
      )
    }

    if (encontrada) {
      datosSolicitud.value = {
        contratista:
          encontrada.contratista || encontrada.nombreContratista || 'Paula Valentina Rache Fonseca',
        identificacion:
          encontrada.identificacion ||
          encontrada.documento ||
          encontrada.documentoContratista ||
          '1098765432',
        ciudad: encontrada.ciudad || 'Ibagué',
        fecha: encontrada.fecha || new Date().toLocaleDateString('es-CO'),
        regional: encontrada.regional || 'Tolima',
        direccion:
          encontrada.direccion || encontrada.dependencia || 'Centro de Comercio y Servicios',
        contrato: encontrada.numeroContrato || encontrada.contrato || codigo,
        responsable:
          encontrada.responsable || encontrada.supervisor || 'Johon Fredy Sanabria Muñoz',
        estado: encontrada.estado || 'En revisión',
        observacionRechazo:
          encontrada.observacionRechazo || encontrada.observaciones_supervisor || '',
        bienesFaltantes: encontrada.bienesFaltantes || [],
        firmas: encontrada.firmas || [],
      }
    }
  } else {
    const f = localStorage.getItem('ultima_firma')
    if (f) firmaGuardada.value = f
  }
})

function volver() {
  router.push({ name: 'solicitudes' })
}

function imprimir() {
  window.print()
}
</script>

<style scoped>
.page-formato {
  background: #7a7a7a;
  min-height: 100vh;
  padding: 20px 10px 40px;
  font-family: Arial, Helvetica, sans-serif;
  color: #000000;
  box-sizing: border-box;
}

.toolbar {
  max-width: 820px;
  margin: 0 auto 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 6px 14px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.documento-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 16px;
}

.documento {
  width: 100%;
  max-width: 820px;
  min-width: 680px;
  margin: 0 auto;
  background: #ffffff;
  border: 1.5px solid #000000;
  box-sizing: border-box;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

/* Encabezado simétrico: el logo queda 100% centrado sobre la barra PROCESO */
.encabezado-topo {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  align-items: stretch;
  border-bottom: 1.5px solid #000000;
  min-height: 72px;
}

.encabezado-spacer {
  width: 100%;
}

.logo-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 10px;
}

.logo-sena {
  height: 60px;
  width: auto;
  display: block;
}

.version-box {
  width: 100%;
  border-left: 1.5px solid #000000;
  display: flex;
  flex-direction: column;
}

.version-fila {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  font-weight: 700;
  text-align: center;
  padding: 4px;
  line-height: 1.2;
}

.version-fila:first-child {
  border-bottom: 1px solid #000000;
}

/* Barras Negras y Blancas */
.barra-negra {
  background: #000000;
  color: #ffffff;
  font-weight: 800;
  font-size: 10.5px;
  text-align: center;
  padding: 3.5px 4px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #000000;
}

.fila-blanca {
  background: #ffffff;
  color: #000000;
  font-weight: 800;
  font-size: 10.5px;
  text-align: center;
  padding: 4.5px 4px;
  border-bottom: 1px solid #000000;
  letter-spacing: 0.3px;
}

.texto-formato {
  font-size: 9.5px;
  padding: 5px 4px;
}

/* Clasificación de la Información */
.clasificacion-tabla {
  display: grid;
  grid-template-columns: 2.2fr 1fr 2.5fr 1fr 2.5fr 1fr;
  border-bottom: 1px solid #000000;
  background: #ffffff;
}

.clasif-col {
  padding: 3px 4px;
  font-size: 9.5px;
  font-weight: 800;
  text-align: center;
  border-right: 1px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clasif-check {
  padding: 2px;
  font-size: 10.5px;
  font-weight: 800;
  text-align: center;
  border-right: 1px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clasif-check:last-child {
  border-right: none;
}

/* Datos del Contratista - Exacto a Formato Oficial GCCON-F-088 */
.seccion-datos {
  border-bottom: 2px solid #000000;
  font-size: 8.5px;
  font-weight: 700;
  background: #ffffff;
}

.fila-contratista-1 {
  display: flex;
  border-bottom: 1px dotted #000000;
  min-height: 22px;
}

.celda-nombre-contratista {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 2.5px 6px;
  border-right: 1px dotted #000000;
}

.celda-identificacion-header {
  width: 22%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 800;
  padding: 2.5px 6px;
}

.fila-contratista-2 {
  display: flex;
  border-bottom: 1px dotted #000000;
  min-height: 22px;
}

.bloque-ciudad-fecha-regional {
  flex: 1;
  display: flex;
  border-right: 1px dotted #000000;
}

.celda-identificacion-valor {
  width: 22%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 700;
  padding: 2.5px 6px;
}

.celda-ciudad-lbl {
  width: 55px;
  flex-shrink: 0;
}

.celda-ciudad-val {
  flex: 1.2;
  border-right: 1px dotted #000000;
}

.celda-fecha-lbl {
  width: 50px;
  flex-shrink: 0;
}

.celda-fecha-val {
  flex: 1;
  border-right: 1px dotted #000000;
}

.celda-regional-lbl {
  width: 70px;
  flex-shrink: 0;
  border-right: 1px dotted #000000;
}

.celda-regional-val {
  flex: 1.5;
}

.fila-contratista-3 {
  display: flex;
  border-bottom: 1px dotted #000000;
  min-height: 22px;
}

.celda-direccion-lbl {
  width: 335px;
  flex-shrink: 0;
}

.celda-direccion-val {
  flex: 1;
}

.fila-contratista-4 {
  display: flex;
  min-height: 22px;
}

.celda-contrato-lbl {
  width: 225px;
  flex-shrink: 0;
}

.celda-contrato-val {
  flex: 1;
}

.celda-etiqueta {
  display: flex;
  align-items: center;
  padding: 2.5px 6px;
  border-right: 1px dotted #000000;
  font-weight: 800;
  white-space: nowrap;
}

.celda-valor {
  display: flex;
  align-items: center;
  padding: 2.5px 6px;
  font-weight: 700;
}

.etiqueta-form {
  font-weight: 800;
  margin-right: 6px;
  white-space: nowrap;
}

.valor-form {
  font-weight: 700;
}

/* Causal de Terminación */
.titulo-causal {
  text-align: center;
  font-size: 11px;
  font-weight: 800;
  padding: 8px 4px 5px;
  letter-spacing: 0.5px;
}

.fila-causales {
  display: grid;
  grid-template-columns: 1.25fr 1.3fr 1.35fr 1.1fr;
  padding: 3px 6px 8px;
  align-items: center;
  gap: 6px;
  border-bottom: 1.5px solid #000000;
}

.causal-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.causal-nombre {
  font-size: 7.5px;
  font-weight: 800;
  text-align: right;
  line-height: 1.15;
}

.causal-caja-cuadrada {
  width: 26px;
  height: 26px;
  border: 1.5px solid #000000;
  background: #ffffff;
  flex-shrink: 0;
}

.causal-caja-rect {
  width: 65px;
  height: 26px;
  border: 1.5px solid #000000;
  background: #ffffff;
  flex-shrink: 0;
}

/* Tabla de Dependencias */
.tabla-dep {
  border-bottom: 1.5px solid #000000;
  font-size: 7.5px;
  font-weight: 700;
}

.tr-head {
  display: grid;
  grid-template-columns: 155px 44px 1fr;
  border-bottom: 1.5px solid #000000;
  min-height: 28px;
}

.th-dep {
  border-right: 1px solid #000000;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 800;
  font-size: 8px;
}

.th-marca {
  border-right: 1.5px solid #000000;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 800;
  font-size: 7px;
  line-height: 1.1;
}

.th-resp-wrap {
  display: flex;
  flex-direction: column;
}

.th-resp-top {
  text-align: center;
  padding: 2px;
  border-bottom: 1px solid #000000;
  font-size: 7.5px;
  font-weight: 800;
}

.th-resp-sub {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  flex: 1;
}

.th-nombres {
  border-right: 1px solid #000000;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7.5px;
  font-weight: 800;
}

.th-firma {
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7.5px;
  font-weight: 800;
}

.tr-row {
  display: grid;
  grid-template-columns: 155px 44px 1.4fr 1fr;
  border-bottom: 1px solid #000000;
  min-height: 18px;
}

.tr-row:last-child {
  border-bottom: none;
}

.td-dep {
  border-right: 1px solid #000000;
  padding: 2.5px 4px;
  display: flex;
  align-items: center;
  font-size: 7px;
  line-height: 1.15;
}

.td-marca {
  border-right: 1.5px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
}

.td-nombres {
  border-right: 1px solid #000000;
  padding: 2.5px 4px;
  display: flex;
  align-items: center;
  font-size: 7px;
  line-height: 1.15;
}

.td-firma {
  padding: 2px;
  min-height: 16px;
}

/* Sección Inferior */
.seccion-inferior {
  font-size: 7.5px;
  font-weight: 700;
}

.fila-elementos {
  padding: 4px 6px 0;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.1px;
}

.espacio-elementos {
  height: 22px;
}

.fila-otros-inf {
  display: flex;
  align-items: baseline;
  padding: 2px 6px 6px;
}

.otros-label {
  white-space: nowrap;
  margin-right: 4px;
  font-weight: 700;
  font-size: 7.5px;
}

.otros-puntos {
  flex: 1;
  border-bottom: 1px dotted #000000;
  height: 1px;
  margin-bottom: 2px;
}

.linea-separador-inf {
  border-bottom: 1.5px solid #000000;
  width: 100%;
}

.zona-firma-inf {
  min-height: 65px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 8px 30px 10px 8px;
}

.caja-firma-contratista {
  width: 180px;
  text-align: center;
}

.contenedor-firma-img {
  width: 100%;
  height: 52px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 2px;
}

.img-firma-estampada {
  max-width: 175px;
  max-height: 50px;
  object-fit: contain;
  transition: transform 0.15s ease;
}

.caja-firma-contratista:hover .img-firma-estampada {
  transform: scale(1.04);
}

.linea-firma-sola {
  width: 100%;
  border-bottom: 1.5px solid #000000;
  margin-bottom: 3px;
}

.texto-firma-sola {
  font-size: 7.5px;
  font-weight: 700;
  color: #000000;
  text-align: center;
}

/* ===================== IMPRESIÓN ===================== */
@media print {
  @page {
    size: letter portrait;
    margin: 6mm 8mm;
  }

  *,
  *::before,
  *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .toolbar,
  .no-print {
    display: none !important;
  }

  .page-formato {
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
    min-height: auto !important;
  }

  .documento-wrapper {
    overflow: visible !important;
    padding: 0 !important;
    display: block !important;
    max-width: none !important;
    width: 100% !important;
  }

  .documento {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    border: 1.5px solid #000000 !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }

  .encabezado-topo {
    grid-template-columns: 120px 1fr 120px !important;
  }

  .barra-negra {
    background: #000000 !important;
    color: #ffffff !important;
  }

  .causal-caja-cuadrada,
  .causal-caja-rect {
    border: 1.5px solid #000000 !important;
    background: #ffffff !important;
  }
}

@media (max-width: 600px) {
  .page-formato {
    padding: 8px 4px 16px;
  }
  .toolbar {
    padding: 6px 10px;
    margin-bottom: 8px;
  }
}
</style>
