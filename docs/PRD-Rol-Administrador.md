# PRD de Pruebas por Rol — Administrador

> Documento de requisitos redactado para ser consumido por **TestSprite** (agente de testing
> autónomo vía MCP). Cubre **únicamente** los flujos, permisos y criterios de aceptación del rol
> **Administrador** en el sistema Paz y Salvo Contractual SENA (GCCON-F-088).
> El PRD general del sistema está en `PRD-TestSprite-GCCON-F-088.md`.

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Rol bajo prueba   | Administrador                                                          |
| Herramienta       | TestSprite (MCP: UI + API + E2E)                                       |
| Versión           | 1.0                                                                   |
| Fecha             | 2026-10-16                                                            |
| Frontend          | Vue 3 + Quasar + Vite (SPA) — `http://localhost:9000`                 |
| Backend           | Node.js + Express + MongoDB — `http://localhost:3000/api`             |
| Estado            | Listo para importar en TestSprite                                     |

---

## 1. Qué es el Administrador en este sistema

Es el rol **más alto de la jerarquía**, pero **no participa en el flujo contractual** (no crea
contratos, no evalúa y no firma). Su función es **administrar la plataforma**:
usuarios (supervisores), la plantilla del formato GCCON-F-088, la consulta global de contratos,
la consulta de firmas y la **auditoría**.

Cadena jerárquica: `Administrador -> Supervisor -> (Contratista | ResponsableArea)`.
El Administrador **solo puede crear Supervisores**.

---

## 2. Cuenta de prueba

| Correo                          | Contraseña         |
|---------------------------------|--------------------|
| `admin@institucion.edu.co`      | `AdminSeguro123!`  |

Creada por `backend/scripts/seedDev.js` (idempotente y desbloqueante).
Bloqueo: 3 intentos fallidos bloquean 15 min.

---

## 3. Rutas UI accesibles

| Ruta                          | Uso para el Administrador                          |
|-------------------------------|----------------------------------------------------|
| `/login`                      | Inicio de sesión                                   |
| `/dashboard`                  | Panel general                                      |
| `/usuarios`                   | Gestión de usuarios (todas las cuentas)            |
| `/supervisores`               | Listado/gestión de supervisores                    |
| `/contratistas`               | Listado de contratistas (solo lectura para Admin)  |
| `/dependencias`               | Consulta de dependencias                           |
| `/solicitudes`                | Consulta global de contratos y observaciones       |
| `/solicitudes/certificado`    | Descarga de certificado (solo contratos finalizados) |
| `/firmas`                     | Consulta de firmas (solo lectura)                  |
| `/perfil`                     | Perfil y cambio de contraseña                      |
| `/reportes`                   | Métricas                                           |
| `/notificaciones`             | Notificaciones                                     |
| `/recuperar`                  | Solicitar recuperación de contraseña               |

> **NO** debe operar `/solicitudes/nueva` (crear solicitud): es exclusivo del Contratista.

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
| Actualizar plantilla del formato                       | Sí        | —                                 |
| Consultar auditoría                                    | Sí        | —                                 |

---

## 5. Criterios de aceptación (Gherkin simplificado)

Prefijo de IDs: **ADM-AC-xx**.

### RF-ADM-01 — Autenticación
- **ADM-AC-01.1** Dado credenciales válidas del Administrador, cuando inicia sesión, entonces
  responde `200` con `token` y `usuario.rol = "Administrador"`.
- **ADM-AC-01.2** Dado el Administrador autenticado, cuando abre `/dashboard`, entonces se
  muestra el panel sin errores de permisos.

### RF-ADM-02 — Gestión de usuarios
- **ADM-AC-02.1** Dado el Administrador, cuando crea un **Supervisor** (`POST /api/usuarios`
  con `rol:"Supervisor"`), entonces `201` y aparece en `/usuarios`.
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

### RF-ADM-03 — Dependencias (solo lectura)
- **ADM-AC-03.1** Dado el Administrador, cuando abre `/dependencias`, entonces ve el listado
  de dependencias.
- **ADM-AC-03.2** Dado el Administrador, cuando intenta crear/editar/desactivar una dependencia
  o asignar un responsable (`POST/PUT/DELETE /api/dependencias*`), entonces `403`.

### RF-ADM-04 — Supervisión de contratos (solo lectura)
- **ADM-AC-04.1** Dado el Administrador, cuando abre `/solicitudes`, entonces ve **todos** los
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
  (`POST /api/firmas/procesar`), entonces `403` (no tiene dependencia/asignación de área).

### RF-ADM-06 — Formato y auditoría
- **ADM-AC-06.1** Dado el Administrador, cuando actualiza la plantilla
  (`PUT /api/formatos/actualizar`) con `numero_version`, entonces `200` y el upsert queda guardado.
- **ADM-AC-06.2** Dado el Administrador, cuando consulta `GET /api/auditoria`, entonces `200`
  con las acciones de trazabilidad (login, creación de usuarios, contratos, evaluaciones, firmas).
- **ADM-AC-06.3** Dado otro rol, cuando consulta `GET /api/auditoria`, entonces `403`.

### RF-ADM-07 — Cuenta y contraseña
- **ADM-AC-07.1** Dado el Administrador, cuando cambia su contraseña en `/perfil` con la actual
  correcta, entonces `200` y se emite un token nuevo.
- **ADM-AC-06.3 (UI)** Dado el Administrador, cuando abre `/perfil`, entonces se muestran sus
  datos (nombre, correo, rol) cargados desde el backend.
- **ADM-AC-06.4** Dado el Administrador, cuando solicita recuperación en `/recuperar`, entonces
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
| GET    | `/api/contratos`                      | autenticado (roles del flujo) | `200` (Admin: todos) |
| GET    | `/api/contratos/:id`                  | autenticado | `200` |
| GET    | `/api/contratos/:id/pdf`              | Contratista dueño / Admin | `200` `application/pdf` |
| GET    | `/api/contratos/:id/observaciones`    | dueño/supervisor/admin | `200` |
| GET    | `/api/firmas/pendientes`              | ResponsableArea / Admin | `200` |
| GET    | `/api/firmas/historial`               | ResponsableArea / Admin | `200` |
| PUT    | `/api/formatos/actualizar`            | Admin | `200` |
| GET    | `/api/auditoria`                      | Admin | `200` |

---

## 6b. Brechas conocidas (a verificar contra la implementación actual)

Estas pruebas **se espera que fallen** mientras no se corrijan; TestSprite debe reportarlas:

1. **ADM-AC-04.4 falla hoy:** `PUT /api/contratos/evaluar/:id` permite `Administrador`
   (`backend/src/routes/supervisionRoutes.js:7`), devolviendo `200/400/409` en lugar de `403`.
2. **ADM-AC-04.5 parcial:** la ruta UI `/solicitudes/nueva` es visible para el Administrador
   (`frontend/src/router/routes.js:79`), pero el backend responde `403`.
3. **ADM-AC-05.2 falla hoy:** el botón "Firmar" está habilitado para Admin en
   `SolicitudesPage.vue:251`, y al usarlo el backend responde `403`.
4. **ADM-AC-03.2 parcial (UI):** `DependenciasPage` muestra acciones de escritura al
   Administrador aunque el backend las rechaza con `403`.
5. **Perfil en blanco:** `PerfilPage.vue` lee `auth.id`/`auth.nombre`/`auth.correo`/`auth.rol`,
   que **no existen** en el store; además usa rutas con `/api` duplicado (`:140`, `:177`).
6. **Recuperación de contraseña rota (UI):** no existe la página/ruta `/restablecer` y
   `RecuperarPage.vue:84` pega a `/api/api/auth/recuperar` (404), mostrando éxito falso.

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
