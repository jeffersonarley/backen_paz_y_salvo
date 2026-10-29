# PRD de Pruebas por Rol — Coordinador / Supervisor

> Documento de requisitos para **TestSprite**. Cubre **únicamente** los flujos, permisos y
> criterios de aceptación del rol **Coordinador / Supervisor** en el sistema Paz y Salvo Contractual SENA
> (GCCON-F-088). El PRD general está en `PRD-TestSprite-GCCON-F-088.md`.

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Rol bajo prueba   | Coordinador / Supervisor                                              |
| Herramienta       | TestSprite (MCP: UI + API + E2E)                                       |
| Versión           | 2.0                                                                   |
| Fecha             | 2026-10-28                                                            |
| Frontend          | Vue 3 + Quasar + Vite (SPA) — `http://localhost:9000`                 |
| Backend           | Node.js + Express + MongoDB — `http://localhost:3000/api`             |
| Estado            | Listo para importar en TestSprite                                     |

---

## 1. Qué es el Coordinador / Supervisor en este sistema

Es el **responsable de coordinación** del trámite GCCON-F-088. Sus funciones:

1. Crear **Contratistas** y **Responsables de Área**.
2. Gestionar **dependencias (áreas)** con **múltiples responsables** y activar/desactivar.
3. **Tener siempre una dependencia propia** (se crea/asigna automáticamente si no tiene).
4. **Asignar apoyo de supervisión** desde la vista *Coordinadores/Supervisores*.
5. **Configurar la plantilla por contrato** desde el menú lateral *Plantillas* (editable **por fila**, con responsables visibles al frente de cada dependencia).
6. **Evaluar** cada contrato (`Borrador` -> `Pendiente de Firmas`), o rechazarlo (`-> Borrador` con observación).
7. Consultar los contratos que tiene asignados y las observaciones del trámite.

> Importante: El Coordinador **no firma** por las áreas. La firma la realiza el **Responsable de Área** en su **casillero exacto**. Los casilleros solo se generan para **dependencias activas**. La plantilla define qué filas aplican y **quién** firma cada una. Cada contratista ve la **plantilla del coordinador** que le corresponde.

Cadena jerárquica: `Administrador -> Coordinador/Supervisor -> (Contratista | ResponsableArea)`.

---

## 2. Cuenta de prueba

| Correo                              | Contraseña         |
|-------------------------------------|--------------------|
| `supervisor@gccon.com`              | `super`            |

Carga con `backend/scripts/cargarUsuariosGccon.js`. Bloqueo: 3 intentos -> 15 min (configurable). **Debe tener dependencia propia asignada**.

---

## 3. Rutas UI accesibles

| Ruta                          | Uso para el Coordinador/Supervisor                  |
|-------------------------------|-----------------------------------------------------|
| `/login`                      | Inicio de sesión                                    |
| `/app/dashboard`              | Panel general                                       |
| `/app/contratistas`           | Gestión de contratistas que él creó                 |
| `/app/dependencias`           | Crear / editar / activar/desactivar dependencias con múltiples responsables |
| `/app/supervisores`           | Gestión de coordinadores, **dependencia propia**, **apoyo de supervisión** |
| `/app/plantillas`            | **Plantillas por contrato** (editable por fila, responsables visibles al frente) |
| `/app/solicitudes`            | Contratos asignados: evaluar, devolver a corrección, ver observaciones |
| `/app/solicitudes/certificado`| Certificado (visualización)                         |
| `/app/perfil`                 | Perfil y cambio de contraseña (puede editar su propio perfil) |
| `/app/reportes`               | Métricas                                            |
| `/app/notificaciones`         | Notificaciones                                      |
| `/recuperar`                  | Solicitar recuperación de contraseña                |
| `/restablecer`                | Restablecer contraseña con token (público)          |

> El Coordinador **no** ve el ítem "Firmas" ni `/app/solicitudes/nueva`: la ruta `/app/firmas` es exclusiva de `ResponsableArea` y `/app/solicitudes/nueva` de `Contratista`. El menú muestra **"Coordinador (Supervisor de Contrato)"**. **"Plantillas y firmantes" no aparece en el certificado/PDF.**

---

## 4. Capacidades y límites (matriz del rol)

| Acción                                                | Permitido | Resultado esperado si no lo está |
|-------------------------------------------------------|:---------:|-----------------------------------|
| Iniciar sesión                                         | Sí        | —                                 |
| Crear Contratista / ResponsableArea                    | Sí        | —                                 |
| Crear otro Coordinador/Supervisor o Administrador      | **No**    | `403`                             |
| Listar usuarios (solo los creados por él)              | Sí        | —                                 |
| Consultar/actualizar un usuario creado por él          | Sí        | `403` si no le pertenece          |
| Editar **su propio perfil**                             | **Sí**    | —                                 |
| Crear/editar/activar/desactivar dependencia            | Sí        | —                                 |
| Asignar **múltiples responsables** a una dependencia   | Sí        | —                                 |
| **Tener/asignar dependencia propia**                   | **Sí**    | —                                 |
| **Asignar apoyo de supervisión**                       | **Sí**    | —                                 |
| Listar dependencias                                    | Sí        | —                                 |
| **Configurar plantilla por contrato** (`/plantillas` o `/contratos/:id/plantilla`) | **Sí** | — |
| Editar plantilla **por fila** con responsables visibles | **Sí** | — |
| **Evaluar** contrato (`/contratos/evaluar/:id`)        | **Sí**    | —                                 |
| Listar contratos asignados / detalle                   | Sí        | —                                 |
| Consultar observaciones del trámite                    | Sí        | —                                 |
| Crear contrato                                         | **No**    | `403`                               |
| Firmar (`/firmas/procesar`)                            | **No**    | `403`                               |
| Descargar PDF                                          | **No**    | `403`                               |
| Actualizar formato / ver auditoría                     | **No**    | `403`                               |

---

## 5. Criterios de aceptación (Gherkin simplificado)

Prefijo de IDs: **SUP-AC-xx**.

### RF-SUP-01 — Autenticación
- **SUP-AC-01.1** Credenciales válidas -> `200`, `usuario.rol = "Supervisor"`.
- **SUP-AC-01.2** `/app/dashboard` carga sin errores de red ni `403` visible.

### RF-SUP-02 — Alta de usuarios (jerarquía)
- **SUP-AC-02.1** Crea **Contratista** (`POST /api/usuarios`, `rol:"Contratista"`) -> `201`;
  el nuevo usuario queda con `supervisor_id` = id del Supervisor creador.
- **SUP-AC-02.2** Crea **ResponsableArea** -> `201`. **Debe poder asociarse a una dependencia**
  (`dependencia_id`) para que luego pueda firmar.
- **SUP-AC-02.3** Intenta crear `Administrador` o `Supervisor` -> `403`.
- **SUP-AC-02.4** Contraseña débil (`abc`) -> `400`.
- **SUP-AC-02.5** `GET /api/usuarios` -> solo devuelve los usuarios que él creó.

### RF-SUP-03 — Dependencias y responsables
- **SUP-AC-03.1** Crea dependencia (`POST /api/dependencias`) -> `201`.
- **SUP-AC-03.2** Lista dependencias (`GET /api/dependencias`) -> `200`.
- **SUP-AC-03.3** Asigna **uno o varios responsables** (`PUT /api/dependencias/:id/responsables`) -> `200`;
  el vínculo queda en `dependencia.responsables_ids[]` y en `usuario.dependencia_id` según corresponda.
- **SUP-AC-03.4** Desactiva/activa dependencia (`DELETE /api/dependencias/:id` o `PUT /api/dependencias/:id`) -> `200`. **El cambio se refleja inmediatamente** usando el **`_id` real** de la dependencia.
- **SUP-AC-03.5** **Las dependencias desactivadas NO generan casilleros** ni aparecen como firmantes.
- **SUP-AC-03.6** Al remover responsables de una dependencia, estos **pierden** `dependencia_id`/acceso al casillero correspondiente.
- **SUP-AC-03.7** El Coordinador debe tener **siempre dependencia propia**; si no la tiene, se le crea/asigna automáticamente. Puede ser responsable de ella.

### RF-SUP-04 — Plantillas y evaluación de contratos
- **SUP-AC-04.1** Configura plantilla desde **Plantillas** (`GET/PUT /api/contratos/:id/plantilla`, `PUT /api/plantillas/predeterminada`) -> `200`. Se ve **al frente de cada dependencia/fila** la persona encargada/responsable con **multi-select editable**.
- **SUP-AC-04.2** Al guardar, los responsables se envían por **ids** y se reflejan en el **Certificado** y en la **plantilla**.
- **SUP-AC-04.3** Aprueba un contrato en `Borrador` (`PUT /api/contratos/evaluar/:id`, `{ aprobado:true }`) -> `200` y estado `Pendiente de Firmas`.
- **SUP-AC-04.4** Al aprobar se abren **casilleros solo para dependencias activas y aplicables según la plantilla**. **Los casilleros se generan según la plantilla del coordinador**.
- **SUP-AC-04.5** Rechaza (`{ aprobado:false, observaciones }`) -> el contrato vuelve a `Borrador` con la observación registrada.
- **SUP-AC-04.6** Re-evaluar/rea-probar tras un rechazo **no duplica** los casilleros de firma.
- **SUP-AC-04.7** Evaluar un contrato ya en `Pendiente de Firmas` o `Finalizado` -> `409`.
- **SUP-AC-04.8** Evaluar un contrato que **no le está asignado** -> `403`.
- **SUP-AC-04.9** Evaluar sin dependencias activas/aplicables -> `409` (no debe quedar "en firmas" sin firmantes).
- **SUP-AC-04.10** La evaluación completa requiere el dictamen de las áreas (ResponsableArea) en **su casillero exacto**; solo cuando todas aprueban el contrato pasa a `Finalizado`.

### RF-SUP-05 — Consulta
- **SUP-AC-05.1** `GET /api/contratos` -> solo los contratos con `supervisor` = él mismo.
- **SUP-AC-05.2** `GET /api/contratos/:id` de un contrato ajeno -> `403` (IDOR).
- **SUP-AC-05.4** `GET /api/contratos/:id/observaciones` de un contrato propio -> `200`.
- **SUP-AC-04.6b** `GET /api/contratos/:id/pdf` -> `403` (no es dueño ni Admin).
- **SUP-AC-04.7** `POST /api/firmas/procesar` -> `403`.

---

## 6. Contratos de API usados por el rol

| Método | Ruta                                  | Acceso                | Body / Notas |
|--------|---------------------------------------|-----------------------|--------------|
| POST   | `/api/auth/login`                     | público               | `{ correo_institucional, password }` |
| POST   | `/api/usuarios`                       | Supervisor            | `{ nombre_completo, correo_institucional, password, rol }` (`Contratista`/`ResponsableArea`) |
| GET    | `/api/usuarios`                       | Supervisor            | solo los creados por él |
| GET    | `/api/usuarios/:id`                   | autenticado           | solo los suyos |
| PUT/PATCH | `/api/usuarios/:id`                | Supervisor/Admin      | solo los suyos o admin; **el Coordinador puede editar su propio perfil** |
| POST   | `/api/dependencias`                   | Supervisor            | `{ nombre_dependencia }` |
| GET    | `/api/dependencias`                   | autenticado           | listado |
| PUT    | `/api/dependencias/:id`               | Supervisor            | `{ nombre_dependencia?, activo? }` |
| PUT    | `/api/dependencias/:id/responsables`  | Supervisor            | `{ responsables_ids: [id,...] }` (multi-responsables) |
| DELETE | `/api/dependencias/:id`               | Supervisor            | toggle activar/desactivar (usar `_id`) |
| GET    | `/api/contratos/:id/plantilla`        | Supervisor/Contratista| plantilla por contrato |
| PUT    | `/api/contratos/:id/plantilla`        | Supervisor            | `{ plantilla_tipo, filas: [{id_fila, responsables: [ids], aplica}] }` |
| PUT    | `/api/plantillas/predeterminada`      | Supervisor            | `{ plantilla_tipo }` |
| GET    | `/api/plantillas/filas`               | autenticado           | filas de plantilla |
| POST   | `/api/dependencias/:id/responsable`   | Supervisor            | `{ responsable_id }` |
| DELETE | `/api/dependencias/:id`               | Supervisor            | toggle estado |
| PUT    | `/api/contratos/evaluar/:id`          | Supervisor            | `{ aprobado: boolean, observaciones? }` |
| GET    | `/api/contratos`                      | Supervisor            | contratos asignados |
| GET    | `/api/contratos/:id`                  | Supervisor            | solo asignados |
| GET    | `/api/contratos/:id/observaciones`    | dueño/supervisor/admin | observaciones del trámite |

---

## 6b. Brechas conocidas (estado 2026-10-17)

1. **SUP-AC-04.x / permisos (PENDIENTE, API):** `PUT /api/contratos/evaluar/:id` permite también
   `Administrador` (`backend/src/routes/supervisionRoutes.js:7`); se espera **solo Supervisor**.
   *(Backend fuera de alcance: se documenta como brecha.)*
2. **Alta de ResponsableArea sin dependencia (PENDIENTE):** el formulario de `/app/usuarios` no
   incluye dependencia (`frontend/src/views/UsuariosPage.vue`); un ResponsableArea creado así
   **no podrá firmar** (`403` en `/firmas/procesar`). El backend tampoco la exige.
3. **Supervisor sin acceso a PDF (POR DISEÑO):** `GET /contratos/:id/pdf` solo permite
   Contratista/Admin -> `403`.

### Resueltas en la migración (2026-10-17)

- **SUP-04 (UI):** el menú ya no muestra "Firmas" al Supervisor y `/app/firmas` es exclusiva de
  `ResponsableArea`.
- **`/app/solicitudes/nueva`:** la ruta y el menú están restringidos a `Contratista`; el
  Supervisor no la ve.
- **Perfil:** `PerfilPage` quedó funcional.

---

## 7. Datos de prueba y precondiciones

- Backend + MongoDB activos; `seedDev` ejecutado.
- **Para SUP-AC-04.2:** al menos 2 dependencias **activas** y 1 **inactiva**.
- Un contrato en estado `Borrador` asignado a este Supervisor (creado por un Contratista suyo).
- Números de contrato únicos por ejecución.

---

## 8. Definition of Done del rol

- Todas las `SUP-AC-xx` de prioridad alta pasan (UI y API).
- El Supervisor puede crear usuarios y dependencias, y **evaluar** contratos, pero **no firmar**.
- Errores de permiso siempre `403` (nunca `500`).
