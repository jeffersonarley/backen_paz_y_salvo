# PRD de Pruebas por Rol — Contratista

> Documento de requisitos para **TestSprite**. Cubre **únicamente** los flujos, permisos y
> criterios de aceptación del rol **Contratista** en el sistema Paz y Salvo Contractual SENA
> (GCCON-F-088). El PRD general está en `PRD-TestSprite-GCCON-F-088.md`.

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Rol bajo prueba   | Contratista                                                            |
| Herramienta       | TestSprite (MCP: UI + API + E2E)                                       |
| Versión           | 1.0                                                                   |
| Fecha             | 2026-10-16                                                            |
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
| `/dashboard`                  | Panel / resumen de sus solicitudes                  |
| `/solicitudes`                | Sus contratos y su estado                           |
| `/solicitudes/nueva`          | **Crear** contrato + inventario                     |
| `/solicitudes/certificado`    | Ver/descargar el certificado PDF (si `Finalizado`)  |
| `/firmas`                     | Vista de su firma (no persiste en backend, ver brechas) |
| `/perfil`                     | Perfil y cambio de contraseña                       |
| `/notificaciones`             | Notificaciones                                      |
| `/recuperar`                  | Solicitar recuperación de contraseña                |

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
- **CON-AC-01.2** `/dashboard` carga sin errores visibles de permisos.

### RF-CON-02 — Registro contractual e inventario
- **CON-AC-02.1** Crea contrato con ≥1 bien (`POST /api/contratos/nuevo`) -> `201`, estado `Borrador`.
- **CON-AC-02.2** Bien sin `codigo_inventario` o sin `descripcion` -> `400`.
- **CON-AC-02.3** `bienes` vacío o con más de 200 -> `400`.
- **CON-AC-02.4** `cantidad` ≤ 0 o no entera -> `400`.
- **CON-AC-02.5** `fecha_fin` anterior a `fecha_inicio` -> `400`.
- **CON-AC-02.6** Número de contrato duplicado -> `400` (no `500`).
- **CON-AC-02.7** El contrato hereda la versión vigente del formato (`version_formato`).
- **CON-AC-02.8** Desde la UI `/solicitudes/nueva` se puede crear el contrato y este aparece en
  `/solicitudes` con estado `Borrador`.

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

## 7. Brechas conocidas (a verificar contra la implementación actual)

1. **`NuevaSolicitudPage` con datos hardcodeados:** el teléfono va fijo (`'3001234567'`) y los
   bienes son un ítem genérico sin UI real de captura; el supervisor seleccionado se ignora
   (el backend lo deriva del `supervisor_id` del contratista). La creación puede no reflejar lo
   que el usuario cree que envía.
2. **`/firmas` del contratista no persiste:** la firma del contratista (`FirmasPage.vue`) solo se
   guarda en `localStorage`; no llama al backend.
3. **`CertificadoPdfPage` estático:** no usa `GET /contratos/:id/pdf`, no valida `Finalizado` y usa
   dependencias hardcodeadas.
4. **Perfil en blanco:** `PerfilPage.vue` usa campos inexistentes del store y rutas con `/api` duplicado.
5. **Dashboard:** `DashboardPage.vue` llama `GET /api/usuarios` (no permitido para Contratista)
   -> `403` silencioso y métricas en 0.
6. **Recuperación de contraseña rota (UI):** sin página/ruta `/restablecer` y con `/api` duplicado.

---

## 8. Definition of Done del rol

- Todas las `CON-AC-xx` de prioridad alta pasan (UI y API).
- El Contratista puede crear/editar/cancelar su contrato y descargar el PDF solo cuando está
  `Finalizado`.
- Nunca puede evaluar, firmar ni gestionar usuarios/dependencias (`403`).
- Ningún `500` en validaciones (deben ser `4xx`).
