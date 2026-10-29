# PRD de Pruebas por Rol — Administrador

> Documento de requisitos redactado para ser consumido por **TestSprite** (agente de testing
> autónomo vía MCP). Cubre **únicamente** los flujos, permisos y criterios de aceptación del rol
> **Administrador** en el sistema Paz y Salvo Contractual SENA (GCCON-F-088).
> El PRD general del sistema está en `PRD-TestSprite-GCCON-F-088.md`.

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Rol bajo prueba   | Administrador                                                         |
| Herramienta       | TestSprite (MCP: UI + API + E2E)                                       |
| Versión           | 2.0                                                                   |
| Fecha             | 2026-10-28                                                            |
| Frontend          | Vue 3 + Quasar + Vite (SPA) — `http://localhost:9000`                 |
| Backend           | Node.js + Express + MongoDB — `http://localhost:3000/api`             |
| Estado            | Listo para importar en TestSprite                                     |

---

## 1. Qué es el Administrador en este sistema

Es el rol **más alto de la jerarquía**, pero **no participa en el flujo contractual** (no crea
contratos, no evalúa y no firma). Su función es **administrar la plataforma**:
usuarios (supervisores), la consulta global de contratos,
la consulta de firmas y la **auditoría**.

> **Nota (2026-10-17):** la **plantilla del formato GCCON-F-088 es fija** (el paz y salvo no se
> edita); se retiró la pantalla "Plantilla GCCON-F-088". La administración del formato queda
> fuera del alcance funcional de la UI. Sí existe la pantalla **Auditoría** (`/app/auditoria`).

Cadena jerárquica: `Administrador -> Supervisor -> (Contratista | ResponsableArea)`.
El Administrador **solo puede crear Supervisores**.

---

## 2. Cuenta de prueba

| Correo                          | Contraseña         |
|---------------------------------|--------------------|
| `admin@gccon.com`      | `admin`  |

Carga con `backend/scripts/cargarUsuariosGccon.js`. Bloqueo: 3 intentos fallidos bloquean 15 min.

---

## 3. Rutas UI accesibles

| Ruta                          | Uso para el Administrador                          |
|-------------------------------|----------------------------------------------------|
| `/login`                      | Inicio de sesión                                   |
| `/app/dashboard`              | Panel general                                      |
| `/app/usuarios`               | Gestión de usuarios (todas las cuentas)            |
| `/app/supervisores`           | Coordinadores/Supervisores, **dependencia propia**, **apoyo de supervisión** |
| `/app/contratistas`           | Listado de contratistas                            |
| `/app/dependencias`           | Gestión de dependencias/áreas (**multi-responsables**, activar/desactivar) |
| `/app/plantillas`            | Plantillas por contrato                           |
| `/app/solicitudes`            | Consulta global de contratos y observaciones       |
| `/app/solicitudes/certificado`| Descarga de certificado (solo contratos finalizados) |
| `/app/auditoria`              | Registro de trazabilidad del sistema (solo lectura) |
| `/app/perfil`                 | Perfil y cambio de contraseña                      |
| `/app/reportes`               | Métricas                                           |
| `/app/notificaciones`         | Notificaciones                                     |
| `/recuperar`                  | Solicitar recuperación de contraseña               |
| `/restablecer`                | Restablecer contraseña con token (público)         |

> **NO** debe operar `/app/solicitudes/nueva` (crear solicitud): es exclusivo del Contratista;
> la ruta responde `no-permisos` y el botón no se muestra.
> **NO** tiene acceso a `/app/firmas` (solo `ResponsableArea`).
> **Plantillas y firmantes no aparece en el certificado/PDF.** Los casilleros solo se generan para dependencias **activas**.

---

## 4. Capacidades y límites (matriz del rol)

| Acción                                                | Permitido | Resultado esperado si no lo está |
|-------------------------------------------------------|:---------:|-----------------------------------|
| Iniciar sesión                                         | Sí        | —                                 |
| Crear **Supervisor**                                   | Sí        | —                                 |
| Crear Supervisor/Contratista/ResponsableArea con otro rol | —     | `403` (jerarquía)                  |
| Listar **todos** los usuarios                          | Sí        | —                                 |
| Consultar un usuario por id                            | Sí        | —                                 |
| Actualizar usuario (`PATCH /usuarios/:id`)             | Sí        | —                                 |
| Habilitar/deshabilitar cuenta                          | Sí        | —                                 |
| Eliminar usuario                                       | Sí (no a sí mismo) | `400` si es la propia cuenta |
| Listar dependencias                                    | Sí        | —                                 |
| Crear/editar/desactivar dependencia o asignar responsable | **No** | `403`                             |
| Crear contrato                                         | **No**    | `403`                             |
| Evaluar contrato (`/contratos/evaluar/:id`)            | **No**    | `403`                             |
| Firmar (`/firmas/procesar`)                            | **No**    | `403`                             |
| Listar contratos / detalle / PDF / observaciones       | Sí        | —                                 |
| Listar firmas pendientes / historial                   | Sí (lectura) | —                              |
| Actualizar plantilla del formato                       | **No aplica** | — (formato GCCON-F-088 fijo; sin UI) |
| Consultar auditoría                                    | Sí        | —                                 |

---

## 5. Criterios de aceptación (Gherkin simplificado)

Prefijo de IDs: **ADM-AC-xx**.

### RF-ADM-01 — Autenticación
- **ADM-AC-01.1** Dado credenciales válidas del Administrador, cuando inicia sesión, entonces
  responde `200` con `token` y `usuario.rol = "Administrador"`.
- **ADM-AC-01.2** Dado el Administrador autenticado, cuando abre `/app/dashboard`, entonces se
  muestra el panel sin errores de permisos.

### RF-ADM-02 — Gestión de usuarios
- **ADM-AC-02.1** Dado el Administrador, cuando crea un **Supervisor** (`POST /api/usuarios`
  con `rol:"Supervisor"`), entonces `201` y aparece en `/app/usuarios`.
- **ADM-AC-02.2** Dado el Administrador, cuando intenta crear un `Administrador`, `Contratista`
  o `ResponsableArea`, entonces `403` (solo puede crear Supervisores).
- **ADM-AC-02.3** Dado dos usuarios, cuando crea un tercero con un correo ya existente,
  entonces `400` con mensaje de duplicado (nunca `500`).
- **ADM-AC-02.4** Dado un usuario existente, cuando lo deshabilita
  (`PATCH /api/usuarios/estado/:id` con `activo:false`), entonces `200`; y el usuario
  deshabilitado recibe `401` en su siguiente petición.
- **ADM-AC-02.5** Dado el Administrador, cuando intenta deshabilitar o eliminar **su propia**
  cuenta, entonces `400`.
- **ADM-AC-02.6** Dado un usuario creado por un Supervisor, cuando el Administrador lo
  actualiza o cambia su rol a Supervisor, entonces `200`.

### RF-ADM-03 — Dependencias
- **ADM-AC-03.1** Dado el Administrador, cuando abre `/app/dependencias`, entonces ve el listado
  de dependencias.
- **ADM-AC-03.2** Dado el Administrador, puede crear/editar/activar/desactivar una dependencia y asignar
  **múltiples responsables** (`POST/PUT/DELETE /api/dependencias*`).
- **ADM-AC-03.3** El cambio de estado (activar/desactivar) debe reflejarse inmediatamente usando el **`_id` real** de la dependencia.
- **ADM-AC-03.4** **Las dependencias desactivadas NO generan casilleros** ni aparecen como firmantes.
- **ADM-AC-03.5** Al remover responsables, estos pierden acceso al casillero correspondiente.

### RF-ADM-04 — Supervisión de contratos (solo lectura)
- **ADM-AC-04.1** Dado el Administrador, cuando abre `/app/solicitudes`, entonces ve **todos** los
  contratos con su estado y cadena de firmas.
- **ADM-AC-04.2** Dado un contrato finalizado, cuando el Administrador descarga
  `GET /api/contratos/:id/pdf`, entonces `200` con `Content-Type: application/pdf`.
- **ADM-AC-04.3** Dado un contrato, cuando el Administrador consulta
  `GET /api/contratos/:id/observaciones`, entonces `200` con las observaciones del trámite.
- **ADM-AC-04.4** Dado el Administrador, cuando intenta **evaluar** un contrato
  (`PUT /api/contratos/evaluar/:id`), entonces `403` (solo el Supervisor evalúa por este endpoint).
- **ADM-AC-04.5** Dado el Administrador, cuando intenta **crear** un contrato
  (`POST /api/contratos/nuevo` o `/api/contratos`), entonces `403`.

### RF-ADM-05 — Firmas (solo lectura)
- **ADM-AC-05.1** Dado el Administrador, cuando consulta `GET /api/firmas/pendientes` y
  `GET /api/firmas/historial`, entonces `200` con el listado global.
- **ADM-AC-05.2** Dado el Administrador, cuando intenta **firmar**
  (`POST /api/firmas/procesar`), entonces `403` (no tiene dependencia/asignación de área). La UI
  ya **no** muestra el botón "Firmar" al Admin (`SolicitudesPage.vue`); la ruta `/app/firmas` es
  exclusiva de `ResponsableArea`.

### RF-ADM-06 — Plantillas, formato y auditoría
- **ADM-AC-06.1** El Admin puede acceder a **Plantillas** (`/app/plantillas`) para configurar la plantilla por contrato.
- **ADM-AC-06.2** La plantilla es **editable por fila** con responsables visibles al frente de cada dependencia (multi-select). **"Plantillas y firmantes" no aparece en el certificado/PDF.**
- **ADM-AC-06.3** Dado el Administrador, cuando consulta `GET /api/auditoria`, entonces `200` con las acciones de trazabilidad (login, creación de usuarios, contratos, evaluaciones, firmas).
- **ADM-AC-06.4** Dado otro rol, cuando consulta `GET /api/auditoria`, entonces `403`.
- **ADM-AC-06.5** El coordinador debe tener **dependencia propia** y puede tener **apoyo de supervisión** (visible desde Coordinadores/Supervisores).
- **ADM-AC-06.4 (UI)** Dado el Administrador, cuando abre `/app/auditoria`, entonces ve el listado
  de acciones con filtros y detalle (sin bloque JSON de datos adicionales).

### RF-ADM-07 — Cuenta y contraseña
- **ADM-AC-07.1** Dado el Administrador, cuando cambia su contraseña en `/app/perfil` con la
  actual correcta, entonces `200` y se emite un token nuevo.
- **ADM-AC-07.2 (UI)** Dado el Administrador, cuando abre `/app/perfil`, entonces se muestran sus
  datos (nombre, correo, rol) cargados desde el backend.
- **ADM-AC-07.3** Dado el Administrador, cuando solicita recuperación en `/recuperar`, entonces
  `200` (anti-enumeración) y recibe (en un entorno con correo configurado) un enlace a
  `/restablecer?token=...` que **abre una página funcional**.

---

## 6. Contratos de API usados por el rol

| Método | Ruta                                  | Acceso | Éxito |
|--------|---------------------------------------|--------|-------|
| POST   | `/api/auth/login`                     | público | `200` `{ token, usuario }` |
| POST   | `/api/auth/recuperar`                 | público | `200` |
| POST   | `/api/auth/restablecer`               | público | `200` |
| PUT    | `/api/auth/cambiar-password`          | autenticado | `200` `{ mensaje, token }` |
| POST   | `/api/usuarios`                       | Admin (rol Supervisor) | `201` |
| GET    | `/api/usuarios`                       | Admin / Supervisor | `200` (Admin: todos) |
| GET    | `/api/usuarios/:id`                   | autenticado | `200` |
| PATCH  | `/api/usuarios/:id`                   | Admin / Supervisor | `200` |
| PATCH  | `/api/usuarios/estado/:id`            | Admin | `200` |
| DELETE | `/api/usuarios/:id`                   | Admin | `200` |
| GET    | `/api/dependencias`                   | autenticado | `200` |
| POST   | `/api/dependencias`                   | Admin/Supervisor      | `201` |
| PUT    | `/api/dependencias/:id`               | Admin/Supervisor      | `200` |
| DELETE | `/api/dependencias/:id`               | Admin/Supervisor      | `200` (toggle) |
| PUT    | `/api/dependencias/:id/responsables`  | Admin/Supervisor      | `200` |
| GET    | `/api/plantillas/filas`               | autenticado           | `200` |
| GET    | `/api/contratos/:id/plantilla`        | autenticado           | `200` |
| PUT    | `/api/contratos/:id/plantilla`        | Admin/Supervisor      | `200` |
| PUT    | `/api/plantillas/predeterminada`      | Admin/Supervisor      | `200` |
| GET    | `/api/contratos`                      | autenticado (roles del flujo) | `200` (Admin: todos) |
| GET    | `/api/contratos/:id`                  | autenticado | `200` |
| GET    | `/api/contratos/:id/pdf`              | Contratista dueño / Admin | `200` `application/pdf` |
| GET    | `/api/contratos/:id/observaciones`    | dueño/supervisor/admin | `200` |
| GET    | `/api/firmas/pendientes`              | ResponsableArea / Admin | `200` |
| GET    | `/api/firmas/historial`               | ResponsableArea / Admin | `200` |
| PUT    | `/api/formatos/actualizar`            | Admin | `200` (sin UI: formato fijo) |
| GET    | `/api/auditoria`                      | Admin | `200` |

---

## 6b. Brechas conocidas (a verificar contra la implementación actual)

Estas pruebas **se espera que fallen** mientras no se corrijan; TestSprite debe reportarlas:

1. **ADM-AC-04.4 PENDIENTE (API):** `PUT /api/contratos/evaluar/:id` permite `Administrador`
   (`backend/src/routes/supervisionRoutes.js:7`), devolviendo `200/400/409` en lugar de `403`.
   *(Backend fuera de alcance: se documenta como brecha.)*
2. **ADM-AC-03.2 PENDIENTE (UI):** `DependenciasPage.vue` muestra aun los botones de escritura
   ("Nueva Dependencia", editar, eliminar) al Administrador; el backend los rechaza con `403`.
   El botón "Nueva Solicitud" ya **no** se muestra.
3. **ADM-AC-05.2 RESUELTA (UI):** el botón "Firmar" ya no aparece para el Admin
   (`SolicitudesPage.vue` condiciona a `RESPONSABLE_AREA`) y `/app/firmas` es exclusiva de
   `ResponsableArea`. A nivel API la ruta `/firmas/procesar` aún lista `Administrador`, pero
   responde `403` porque el Admin no tiene `dependencia_id`.

### Resueltas en la migración (2026-10-17)

- **ADM-AC-04.5 / rutas:** se retiró del menú y de la protección la ruta `plantilla`; se añadió
  `/app/auditoria`. Todas las rutas privadas viven bajo `/app/...` y el guard redirige a
  `no-permisos` cuando el rol no aplica (`frontend/src/router/index.js`).
- **Perfil:** `PerfilPage` quedó funcional (usa los campos correctos y URL sin `/api` duplicado).
- **Recuperación:** existen `/recuperar` y `/restablecer` funcionales.

---

## 7. Datos de prueba y precondiciones

- Backend + MongoDB activos; `seedDev` ejecutado.
- Al menos 1 Supervisor existente para probar listados.
- Para PDF: un contrato en estado `Finalizado` (si no lo hay, ejecutar el flujo E2E completo).
- Números de contrato únicos (sufijo timestamp) por la restricción `unique`.

---

## 8. Definition of Done del rol

- Todas las `ADM-AC-xx` de prioridad alta pasan (UI y API).
- Ningún `403` donde se espera `200`, ni `500` donde se espera `4xx`.
- El Administrador **jamás** evalúa, firma ni crea contratos (siempre `403`).
- Perfil y recuperación de contraseña operativos.
