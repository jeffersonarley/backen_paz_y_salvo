# PRD de Pruebas por Rol — Contratista

> Documento de requisitos para **TestSprite**. Cubre **únicamente** los flujos, permisos y
> criterios de aceptación del rol **Contratista** en el sistema Paz y Salvo Contractual SENA
> (GCCON-F-088). El PRD general está en `PRD-TestSprite-GCCON-F-088.md`.

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Rol bajo prueba   | Contratista                                                            |
| Herramienta       | TestSprite (MCP: UI + API + E2E)                                       |
| Versión           | 1.1                                                                   |
| Fecha             | 2026-10-17                                                            |
| Frontend          | Vue 3 + Quasar + Vite (SPA) — `http://localhost:9000`                 |
| Backend           | Node.js + Express + MongoDB — `http://localhost:3000/api`             |
| Estado            | Listo para importar en TestSprite                                     |

---

## 1. Qué es el Contratista en este sistema

Es el **inicio del flujo**: registra el contrato con su **inventario de bienes**, hace
seguimiento al estado de su solicitud, la edita/cancela mientras está en `Borrador` y, al
finalizar, **descarga el PDF** oficial GCCON-F-088.

Cadena jerárquica: `Administrador -> Supervisor -> (Contratista | ResponsableArea)`.
El Contratista queda vinculado a un Supervisor (`supervisor_id`) que será quien evalúe su contrato.

---

## 2. Cuenta de prueba

| Correo                              | Contraseña         |
|-------------------------------------|--------------------|
| `contratista.demo@sena.edu.co`      | `Contratista123!`  |

Creada por `backend/scripts/seedDev.js`. Bloqueo: 3 intentos -> 15 min.

---

## 3. Rutas UI accesibles

| Ruta                          | Uso para el Contratista                             |
|-------------------------------|-----------------------------------------------------|
| `/login`                      | Inicio de sesión                                    |
| `/app/dashboard`              | Panel / resumen de sus solicitudes                  |
| `/app/solicitudes`            | Sus contratos y su estado                           |
| `/app/solicitudes/nueva`      | **Crear** contrato + inventario (ruta exclusiva)    |
| `/app/solicitudes/certificado`| Ver/descargar el certificado PDF (si `Finalizado`)  |
| `/app/perfil`                 | Perfil y cambio de contraseña                       |
| `/app/notificaciones`         | Notificaciones                                      |
| `/recuperar`                  | Solicitar recuperación de contraseña                |
| `/restablecer`                | Restablecer contraseña con token (público)          |

> El Contratista **no** tiene acceso a `/app/firmas` (exclusiva de `ResponsableArea`). Su firma,
> cuando aplica, se captura dentro de `/app/solicitudes/certificado`.

---

## 4. Capacidades y límites (matriz del rol)

| Acción                                                    | Permitido | Resultado esperado si no lo está |
|-----------------------------------------------------------|:---------:|-----------------------------------|
| Iniciar sesión                                             | Sí        | —                                 |
| Crear contrato con inventario                              | Sí        | —                                 |
| Listar **sus** solicitudes                                 | Sí        | —                                 |
| Ver detalle de **su** contrato                             | Sí        | `403` si es ajeno (IDOR)           |
| Editar/cancelar su contrato (solo en `Borrador`)          | Sí        | `400` en otro estado              |
| Eliminar un bien de su inventario (en `Borrador`)         | Sí (deja ≥1) | `400` si dejaría el inventario vacío |
| Descargar su PDF (solo si `Finalizado`)                   | Sí        | `400` si no ha finalizado          |
| Ver sus observaciones del trámite                          | Sí        | —                                 |
| Listar dependencias (para elegir al crear)                | Sí        | —                                 |
| Crear usuarios                                             | **No**    | `403`                             |
| Crear/editar dependencias                                  | **No**    | `403`                             |
| Evaluar contratos (`/contratos/evaluar/:id`)              | **No**    | `403`                             |
| Firmar dictamen de área (`/firmas/procesar`)              | **No**    | `403`                             |
| Formato / auditoría / gestión de otros usuarios           | **No**    | `403`                             |

---

## 5. Criterios de aceptación (Gherkin simplificado)

Prefijo de IDs: **CON-AC-xx**.

### RF-CON-01 — Autenticación
- **CON-AC-01.1** Credenciales válidas -> `200`, `usuario.rol = "Contratista"`.
- **CON-AC-01.2** `/app/dashboard` carga sin errores visibles de permisos.

### RF-CON-02 — Registro contractual e inventario
- **CON-AC-02.1** Crea contrato con ≥1 bien (`POST /api/contratos/nuevo`) -> `201`, estado `Borrador`.
- **CON-AC-02.2** Bien sin `codigo_inventario` o sin `descripcion` -> `400`.
- **CON-AC-02.3** `bienes` vacío o con más de 200 -> `400`.
- **CON-AC-02.4** `cantidad` ≤ 0 o no entera -> `400`.
- **CON-AC-02.5** `fecha_fin` anterior a `fecha_inicio` -> `400`.
- **CON-AC-02.6** Número de contrato duplicado -> `400` (no `500`).
- **CON-AC-02.7** El contrato hereda la versión vigente del formato (`version_formato`).
- **CON-AC-02.8** Desde la UI `/app/solicitudes/nueva` se puede crear el contrato y este aparece en
  `/app/solicitudes` con estado `Borrador`.

### RF-CON-03 — Consulta y edición
- **CON-AC-03.1** `GET /api/contratos/mis-solicitudes` -> `200` (array solo con sus contratos).
- **CON-AC-03.2** `GET /api/contratos` -> `200` (solo los suyos).
- **CON-AC-03.3** `GET /api/contratos/:id` de un contrato **ajeno** -> `403` (IDOR).
- **CON-AC-03.4** Actualiza su contrato en `Borrador` (`PUT /api/contratos/:id`) -> `200`.
- **CON-AC-03.5** Actualizar un contrato **no** `Borrador` -> `400`.
- **CON-AC-03.6** Cancela su contrato en `Borrador` (`DELETE /api/contratos/:id`) -> `200`.
- **CON-AC-03.7** Elimina un bien estando en `Borrador` (`DELETE /api/contratos/:id/bienes/:bienId`)
  -> `200`; si dejaría el inventario vacío -> `400`.

### RF-CON-04 — Documento PDF
- **CON-AC-04.1** Con el contrato en `Finalizado`, `GET /api/contratos/:id/pdf` -> `200`,
  `Content-Type: application/pdf`, cabecera `%PDF-`.
- **CON-AC-03.x** Con el contrato **no** finalizado -> `400`.
- **CON-AC-03.8** Descargar PDF de un contrato ajeno -> `403`.
- **CON-AC-03.9** El PDF muestra el **nombre de la dependencia** (no el ObjectId).

### RF-CON-04b — Observaciones
- **CON-AC-04.1** `GET /api/contratos/:id/observaciones` de su contrato -> `200` con
  observaciones del Supervisor y de las áreas.
- **CON-AC-04.2** De un contrato ajeno -> `403`.

### RF-CON-04 — Límites del rol
- **CON-AC-04.1** `POST /api/usuarios` -> `403`.
- **CON-AC-04.2** `POST/PUT/DELETE /api/dependencias*` -> `403`.
- **CON-AC-04.3** `PUT /api/contratos/evaluar/:id` -> `403`.
- **CON-AC-04.4** `POST /api/firmas/procesar` -> `403`.
- **CON-AC-04.5** `GET /api/auditoria`, `PUT /api/formatos/actualizar` -> `403`.

### RF-CON-05 — Estado de la solicitud
- **CON-AC-05.1** Tras la evaluación del Supervisor, el estado cambia a `Pendiente de Firmas`.
- **CON-AC-05.2** Cuando todas las áreas aprueban, el estado cambia a `Finalizado`.
- **CON-AC-05.3** Un rechazo de área muestra el trámite como `Rechazado` y sin PDF.

---

## 6. Contratos de API usados por el rol

| Método | Ruta                                  | Acceso          | Body / Notas |
|--------|---------------------------------------|-----------------|--------------|
| POST   | `/api/auth/login`                     | público         | `{ correo_institucional, password }` |
| POST   | `/api/contratos/nuevo` (y `/api/contratos`) | Contratista | `{ numero, telefono, dependencia, objeto_contractual?, fecha_inicio?, fecha_fin?, bienes:[{descripcion, codigo_inventario, cantidad?, estado_bien?}] }` |
| GET    | `/api/contratos/mis-solicitudes`      | Contratista     | array |
| GET    | `/api/contratos`                      | Contratista     | solo los suyos |
| GET    | `/api/contratos/:id`                  | dueño           | detalle + bienes |
| PUT    | `/api/contratos/:id`                  | Contratista     | solo en `Borrador` |
| DELETE | `/api/contratos/:id`                  | Contratista     | cancela en `Borrador` |
| DELETE | `/api/contratos/:id/bienes/:bienId`   | Contratista     | no deja el inventario vacío |
| GET    | `/api/contratos/:id/pdf`              | dueño / Admin   | `application/pdf` (solo `Finalizado`) |
| GET    | `/api/contratos/:id/observaciones`    | dueño/supervisor/admin | observaciones del trámite |
| GET    | `/api/dependencias`                   | autenticado     | para elegir dependencia |

---

## 6b. Datos de prueba

- **Bien válido:** `{ "descripcion": "Laptop", "codigo_inventario": "INV-001", "estado_bien": "Bueno" }`.
- **Fechas ISO 8601** válidas y coherentes.
- **Números de contrato únicos** por ejecución (sufijo timestamp) — `numero_contrato` es `unique`.
- Dep. de al menos 2 dependencias activas + 1 inactiva para validar el flujo completo.

---

## 7. Brechas conocidas (estado 2026-10-17)

### Pendientes

1. **`NuevaSolicitudPage` con datos hardcodeados (PENDIENTE):** el formulario **no tiene campo de
   teléfono** y el store envía uno fijo (`'3001234567'`) en `useSolicitudesStore.js`
   (~`:522`); además los bienes se envían como **un único ítem genérico** (`INV-<timestamp>`) sin
   UI real de captura. La selección de supervisor sí consulta `GET /usuarios?rol=Supervisor`.
2. **`CertificadoPdfPage` estático (PENDIENTE):** no usa `GET /contratos/:id/pdf`; renderiza su
   propio documento desde `GET /contratos` y `GET /usuarios?rol=Contratista`.
3. **Dashboard 403 silencioso (PENDIENTE):** `DashboardPage.vue` llama `/usuarios` (no permitido
   para Contratista); el fallo se ignora (`allSettled`) y algunos contadores quedan en 0.

### Resueltas en la migración (2026-10-17)

- **Perfil:** `PerfilPage` quedó funcional (campos correctos, sin `/api` duplicado).
- **Recuperación:** `/recuperar` y `/restablecer` existen y funcionan.
- **`/app/firmas` sin acceso:** el Contratista ya no ve el ítem "Firmas"; la ruta es exclusiva de
  `ResponsableArea`. La antigua firma en `localStorage` dejó de ser el mecanismo del contratista.

---

## 8. Definition of Done del rol

- Todas las `CON-AC-xx` de prioridad alta pasan (UI y API).
- El Contratista puede crear/editar/cancelar su contrato y descargar el PDF solo cuando está
  `Finalizado`.
- Nunca puede evaluar, firmar ni gestionar usuarios/dependencias (`403`).
- Ningún `500` en validaciones (deben ser `4xx`).
