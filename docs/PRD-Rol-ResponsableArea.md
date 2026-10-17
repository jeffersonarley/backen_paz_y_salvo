# PRD de Pruebas por Rol — Responsable de Área

> Documento de requisitos para **TestSprite**. Cubre **únicamente** los flujos, permisos y
> criterios de aceptación del rol **Responsable de Área** (`ResponsableArea`) en el sistema
> Paz y Salvo Contractual SENA (GCCON-F-088). El PRD general está en
> `PRD-TestSprite-GCCON-F-088.md`.

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Rol bajo prueba   | Responsable de Área (`ResponsableArea`)                                |
| Herramienta       | TestSprite (MCP: UI + API + E2E)                                       |
| Versión           | 1.0                                                                   |
| Fecha             | 2026-10-16                                                            |
| Frontend          | Vue 3 + Quasar + Vite (SPA) — `http://localhost:9000`                 |
| Backend           | Node.js + Express + MongoDB — `http://localhost:3000/api`             |
| Estado            | Listo para importar en TestSprite                                     |

---

## 1. Qué es el Responsable de Área en este sistema

Es quien **evalúa/dictamina por su dependencia** en la etapa de firmas. Recibe un **casillero
de firma** por cada contrato que entra en `Pendiente de Firmas` y lo resuelve **Aprobando** o
**Rechazando** (con observación). Cuando **todas** las áreas aprueban, el contrato pasa a
`Finalizado` y se genera el PDF.

> La evaluación es un proceso de dos etapas: **Supervisor (valida el contrato) + Responsable de
> Área (dictamina/firma su casillero)**. El Responsable de Área **sí evalúa**, a través de la
> firma.

Requisito clave: el usuario `ResponsableArea` **debe tener `dependencia_id`** (estar asignado a un
área). Sin él, el backend responde `403` ("No se pudo identificar el área del usuario").

---

## 2. Cuenta de prueba

| Correo                              | Contraseña         |
|-------------------------------------|--------------------|
| `responsable.demo@sena.edu.co`      | `Responsable123!`  |

Creada por `backend/scripts/seedDev.js`. Bloqueo: 3 intentos -> 15 min.
Precondición: esta cuenta debe estar **asignada a una dependencia activa** con al menos un
contrato en `Pendiente de Firmas`.

---

## 3. Rutas UI accesibles

| Ruta                          | Uso para el Responsable de Área                    |
|-------------------------------|----------------------------------------------------|
| `/login`                      | Inicio de sesión                                   |
| `/dashboard`                  | Panel general                                      |
| `/solicitudes`                | Contratos de su área (con casillero)               |
| `/solicitudes/certificado`    | Certificado (solo lectura)                         |
| `/firmas`                     | Aprobar / Rechazar sus casilleros pendientes       |
| `/perfil`                     | Perfil y cambio de contraseña                      |
| `/notificaciones`             | Notificaciones                                     |
| `/recuperar`                  | Solicitar recuperación de contraseña               |

---

## 4. Capacidades y límites (matriz del rol)

| Acción                                             | Permitido | Resultado esperado si no lo está |
|----------------------------------------------------|:---------:|-----------------------------------|
| Iniciar sesión                                      | Sí        | —                                 |
| Ver contratos donde su área tiene casillero        | Sí        | —                                 |
| Ver detalle de un contrato con casillero           | Sí        | `403` si no tiene casillero (IDOR) |
| Listar sus firmas pendientes (`/firmas/pendientes`) | Sí       | —                                 |
| Listar su historial (`/firmas/historial`)          | Sí        | —                                 |
| **Firmar / dictaminar** (`/firmas/procesar`)       | Sí        | —                                 |
| Listar dependencias                                | Sí        | —                                 |
| Crear usuarios                                     | **No**    | `403`                             |
| Crear/editar dependencias o asignar responsable    | **No**    | `403`                             |
| Crear contratos                                    | **No**    | `403`                             |
| Evaluar por endpoint del supervisor (`/contratos/evaluar/:id`) | **No** (ver nota) | `403` |
| Firmar fuera de su casillero / fuera de estado     | **No**    | `403` / `400` / `409`             |
| Descargar PDF                                      | **No**    | `403`                             |
| Ver observaciones del trámite                      | **No**    | `403`                             |
| Formato / auditoría                                | **No**    | `403`                             |

> **Nota / decisión pendiente:** definir si el Responsable de Área debe poder llamar además a
> `PUT /api/contratos/evaluar/:id`. En el diseño actual su evaluación es la **firma**
> (`/firmas/procesar`). El endpoint `/evaluar` hoy exige ser el **supervisor asignado**.

---

## 4. Criterios de aceptación (Gherkin simplificado)

Prefijo de IDs: **RA-AC-xx**.

### RF-RA-01 — Autenticación
- **RA-AC-01.1** Credenciales válidas -> `200`, `usuario.rol = "ResponsableArea"`.
- **RA-AC-01.2** `/dashboard` carga sin errores visibles.

### RF-RA-02 — Solicitudes de firma
- **RA-AC-02.1** `GET /api/firmas/pendientes` -> `200` con **solo** los casilleros de **su**
  dependencia en estado `Pendiente`.
- **RA-AC-02.2** `GET /api/contratos` -> `200` con los contratos donde su área tiene casillero.
- **RA-AC-02.3** `GET /api/contratos/:id` de un contrato **sin** casillero de su área -> `403` (IDOR).
- **RA-AC-02.4** `GET /api/firmas/historial` -> `200` con las firmas ya gestionadas por su área.

### RF-RA-03 — Dictamen (aprobar / rechazar)
- **RA-AC-03.1** Aprueba su casillero (`POST /api/firmas/procesar`,
  `{ contratoId, accion:"Aprobar", firma_base64:<PNG válido> }`) -> `200`.
- **RA-AC-03.2** Cuando **todas** las áreas aprueban, el contrato pasa a `Finalizado` (una sola vez).
- **RA-AC-03.3** Rechaza (`accion:"Rechazar", observacion_rechazo` obligatoria) -> `200`; el
  contrato queda `Rechazado` y ya no puede finalizarse.
- **RA-AC-03.4** Tras un rechazo de otra área, intentar aprobar -> `409` y el estado no cambia.
- **RA-AC-03.5** Cada aprobación genera `hash_verificacion` de 64 caracteres hex.
- **RA-AC-03.6** Firma con imagen inválida (no PNG/JPEG) -> `400` y el casillero sigue `Pendiente`.
- **RA-AC-03.7** Firma PNG/JPEG mayor a 512 KB -> `400`.
- **RA-AC-03.8** `POST /api/firmas/procesar` sin `dependencia_id` asignada -> `403`
  (precondición a garantizar: cuenta con dependencia).

### RF-RA-04 — Límites del rol
- **RA-AC-04.1** `POST /api/usuarios` -> `403`.
- **RA-AC-04.2** `POST/PUT/DELETE /api/dependencias*` -> `403`.
- **RA-AC-04.3** `POST /api/contratos/nuevo` -> `403`.
- **RA-AC-04.4** `GET /api/contratos/:id/pdf` -> `403`.
- **RA-AC-04.5** `GET /api/contratos/:id/observaciones` -> `403`.
- **RA-AC-04.6** `GET /api/auditoria` y `PUT /api/formatos/actualizar` -> `403`.

### RF-RA-05 — UI de firmas
- **RA-AC-05.1** En `/firmas` se listan sus pendientes y se puede firmar con el canvas (dibujar/png).
- **RA-AC-05.2** Tras firmar, la solicitud desaparece de pendientes y aparece en historial.
- **RA-AC-05.3** El contrato finalizado es visible como `Finalizado` en `/solicitudes`.

---

## 5. Contratos de API usados por el rol

| Método | Ruta                                  | Acceso                        | Body / Notas |
|--------|---------------------------------------|-------------------------------|--------------|
| POST   | `/api/auth/login`                     | público                       | `{ correo_institucional, password }` |
| GET    | `/api/contratos`                      | ResponsableArea               | contratos con casillero de su área |
| GET    | `/api/contratos/:id`                  | ResponsableArea (con casillero) | detalle (IDOR controlado) |
| GET    | `/api/dependencias`                   | autenticado                   | listado |
| GET    | `/api/firmas/pendientes`              | ResponsableArea               | pendientes de su área |
| GET    | `/api/firmas/historial`               | ResponsableArea               | gestionadas por su área |
| POST   | `/api/firmas/procesar`                | ResponsableArea               | `{ contratoId, accion:"Aprobar"\|"Rechazar", observacion_rechazo?, firma_base64? }` |
| GET    | `/api/firmas/verificar/:hash`         | público                       | verificación de firma |

---

## 5b. Datos de prueba

- **Firma válida (PNG 1x1, base64):**
  `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
- **Firma inválida:** `base64("esto no es una imagen")`.
- **Precondición E2E:** un contrato en `Pendiente de Firmas` con casillero para la dependencia de
  esta cuenta (creado por el flujo Contratista -> Supervisor).

---

## 6. Brechas conocidas (a verificar contra la implementación actual)

1. **RA-AC-03.8 falla si la cuenta no tiene dependencia:** al crear un `ResponsableArea` desde la
   UI no se asigna `dependencia_id` (el formulario `UsuariosPage.vue:98-154` no lo incluye y
   `dependenciaService.asignarResponsable` — `frontend/src/services/dependenciaService.js:29` —
   no se invoca). El backend responde `403` en `/firmas/procesar`.
   (`backend/src/controllers/firmasController.js:38-41`)
2. **Certificado estático:** `CertificadoPdfPage.vue` no valida estado ni usa el PDF real del
   backend (`GET /contratos/:id/pdf` está además restringido y NO disponible para este rol).
3. **Perfil en blanco:** `PerfilPage.vue` usa campos inexistentes del store (`auth.id`...) y rutas
   con `/api` duplicado.
7. **Dashboard:** `DashboardPage.vue` usa `/usuarios` (rol no autorizado) -> `403` silencioso y
   contadores en 0.
8. **Registro/firmas del contratista confundido con firma de área:** en `/firmas` el contratista
   tiene una firma que solo se guarda en `localStorage` (`FirmasPage.vue`); no confundirla con el
   dictamen del área.

---

## 7. Definition of Done del rol

- Todas las `RA-AC-xx` de prioridad alta pasan (UI y API).
- El Responsable de Área puede **firmar** su casillero y la finalización ocurre cuando todas las
  áreas aprueban.
- Firma con dependencia asignada siempre `200`; sin dependencia, `403` documentado.
- Los accesos indebidos responden `403` (nunca `500`).
