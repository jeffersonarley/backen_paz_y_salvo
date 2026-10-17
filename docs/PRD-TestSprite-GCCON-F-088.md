# PRD de Pruebas — Paz y Salvo Contractual SENA (GCCON-F-088)

> Documento de requisitos de producto (PRD) redactado para ser consumido por **TestSprite**
> (agente de testing autónomo vía MCP). Describe el sistema, sus flujos de extremo a extremo
> (E2E), los contratos de API y los criterios de aceptación para que TestSprite genere y
> ejecute planes de prueba funcionales de UI y API.

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Producto          | Paz y Salvo Contractual SENA — Formato institucional GCCON-F-088      |
| Tipo de documento | PRD de pruebas (QA / E2E)                                             |
| Herramienta       | TestSprite (MCP: UI + API + E2E)                                      |
| Versión           | 1.1                                                                   |
| Fecha             | 2026-10-17                                                            |
| Frontend          | Vue 3 + Quasar + Vite (SPA)                                           |
| Backend           | Node.js + Express + MongoDB (Mongoose)                                |
| Autenticación     | JWT (Bearer) + cadena jerárquica de roles                             |
| Estado            | Listo para importar en TestSprite                                     |

---

## 1. Resumen ejecutivo

El sistema gestiona el **paz y salvo contractual** del SENA bajo el formato **GCCON-F-088**.
Un **Contratista** registra un contrato con su inventario de bienes; un **Supervisor** evalúa
y aprueba o rechaza; las **dependencias (áreas)** emiten su dictamen de firma con trazabilidad
criptográfica (SHA-256/HMAC); al completarse todas las firmas el contrato pasa a **Finalizado**
y se genera un **PDF** en memoria. Un **Administrador** administra usuarios y auditoría
(la **plantilla del formato es fija**: el paz y salvo no se edita).

El objetivo de este PRD es servir de **spec** para TestSprite: éste normaliza los requisitos y
los convierte en un plan de pruebas priorizado, los ejecuta en sandbox (navegador real para UI y
llamadas reales para API) y devuelve bundles de fallo con pasos, capturas y causa raíz.

---

## 2. Objetivos de la prueba

1. Validar de extremo a extremo el flujo contractual `Borrador -> Pendiente de Firmas -> Finalizado`.
2. Validar la **seguridad de acceso**: roles, jerarquía de creación, IDOR y aislamiento por dependencia.
3. Validar las **reglas de negocio**: bloqueo de login, validación de inventario, rechazo de firmas, atomicidad.
4. Validar la **integridad documental**: PDF descargable y verificación pública del hash de firma.
5. Validar los **flujos de cuenta**: recuperación, restablecimiento y cambio de contraseña.
6. Validar **UI** (SPA Quasar) y **API** (Express) contra el mismo conjunto de requisitos.

---

## 3. Alcance

### 3.1 Dentro del alcance (E2E completo)

- Autenticación, bloqueo por intentos y control de sesión.
- Jerarquía de usuarios (Administrador, Supervisor, ResponsableArea, Contratista).
- CRUD de dependencias y asignación de responsables.
- Registro contractual e inventario de bienes.
- Evaluación del supervisor.
- Ronda de firmas por dependencia (aprobar / rechazar / finalización).
- Generación y descarga de PDF.
- Verificación pública de firma por hash.
- Recuperación / restablecimiento / cambio de contraseña.
- Auditoría (la plantilla del formato GCCON-F-088 es fija).
- Deshabilitación de cuentas en tiempo real.

### 3.2 Fuera del alcance

- Envío real de correos (Nodemailer): en pruebas se valida el token en base de datos, no el email.
- Infraestructura de despliegue (Vercel), DNS, Atlas, TLS.
- Pruebas de carga/estrés y de penetración profundas (se cubren señales básicas de seguridad).
- Envío de PDF a impresión física / firma biométrica real (se usa imagen PNG/JPEG de prueba).

---

## 4. Entornos y configuración

| Entorno    | Frontend                          | API base                          | Notas                                              |
|------------|-----------------------------------|-----------------------------------|----------------------------------------------------|
| Local      | `http://localhost:9000` (o `5173`) | `http://localhost:3000/api`       | Requiere backend + MongoDB activos y `seedDev`     |
| Staging    | `https://<staging-domain>`        | `https://<staging-domain>/api`    | Recomendado para TestSprite (datos desechables)    |

### 4.1 Puesta en marcha local

```bash
# Backend
cd backend
npm install
cp .env.example .env          # MONGODB_URI y JWT_SECRET son obligatorios
node scripts/seedDev.js       # crea y desbloquea las 4 cuentas demo
node server.js                # http://localhost:3000

# Frontend
cd frontend
npm install
npm run dev                   # abre la SPA (proxy /api -> :3000)
```

### 4.2 Superficies a descubrir por TestSprite

- **UI:** `/<login>` y la SPA autenticada (ver sección 7).
- **API:** `GET /health`, `GET /` y todos los endpoints de la sección 9.
- **OpenAPI (dev):** `GET /api-docs` (Swagger interactivo).

> Recomendación: apuntar TestSprite a **staging** (no a producción) para evitar ensuciar la
> base `pazysalvo_sena`. Usar una base desechable y re-ejecutar `seedDev` antes de cada ciclo.

---

## 5. Cuentas de prueba

Creadas por `backend/scripts/seedDev.js` (idempotente y desbloqueante):

| Rol               | Correo                              | Contraseña          |
|-------------------|-------------------------------------|---------------------|
| Administrador     | `admin@institucion.edu.co`          | `AdminSeguro123!`   |
| Supervisor        | `supervisor.demo@sena.edu.co`       | `Supervisor123!`    |
| Contratista       | `contratista.demo@sena.edu.co`      | `Contratista123!`   |
| Responsable Área  | `responsable.demo@sena.edu.co`      | `Responsable123!`   |

**Política de contraseñas:** mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.

**Bloqueo:** 3 intentos fallidos bloquean la cuenta 15 minutos (`seedDev` la desbloquea).

---

## 6. Roles y matriz de permisos

La jerarquía se valida con `verificarJerarquia`: un rol **no puede crear** un rol de nivel igual o superior.

| Capacidad                                   | Administrador | Supervisor | ResponsableArea | Contratista |
|---------------------------------------------|:-------------:|:----------:|:---------------:|:-----------:|
| Crear Supervisor                            | Sí            | No         | No              | No          |
| Crear Contratista / ResponsableArea         | No*           | Sí         | No              | No          |
| Listar usuarios                             | Todos         | Solo los suyos | No           | No          |
| Habilitar/deshabilitar cuentas              | Sí            | No         | No              | No          |
| Crear/gestionar dependencias                | No*           | Sí         | No              | No          |
| Registrar contrato + bienes                 | No            | No         | No              | Sí          |
| Evaluar contrato                            | No            | Sí         | No              | No          |
| Firmar (aprobar/rechazar)                   | No†           | No         | Sí              | No          |
| Descargar PDF                               | Sí            | No         | No              | Sí (dueño)  |
| Actualizar plantilla del formato            | No aplica     | No         | No              | No          |
| Ver auditoría                               | Sí            | No         | No              | No          |

\* El Administrador queda restringido por la jerarquía en esos endpoints (la API responde 403).
† La UI no muestra "Firmar" al Admin y `/app/firmas` es exclusiva de `ResponsableArea`; a nivel
API la ruta permite el rol, pero responde `403` porque el Admin no tiene dependencia asignada.
`Evaluar contrato` permite hoy a `Administrador` en la API (brecha conocida, ver PRD del rol).

\* El Administrador queda restringido por la jerarquía en esos endpoints (la API responde 403).

**Cadena de creación:**
`Administrador -> Supervisor -> (Contratista | ResponsableArea)`.

---

## 7. Flujos de usuario y criterios de aceptación

Formato de criterios: **Dado / Cuando / Entonces** (Gherkin simplificado). IDs `RF-xx` y `AC-xx`.

### RF-01 — Autenticación y bloqueo (Flujo 1)

- **AC-01.1** Dado credenciales válidas de un usuario activo, cuando inicia sesión, entonces
  responde `200` con `token` y `usuario.rol` correcto.
- **AC-01.2** Dado un correo inexistente, cuando inicia sesión, entonces responde `401` con
  mensaje genérico "Credenciales inválidas." (sin revelar si el correo existe ni intentos restantes).
- **AC-01.3** Dado un usuario `activo: false` con credenciales correctas, cuando inicia sesión,
  entonces responde `401` con "Usuario deshabilitado.".
- **AC-01.4** Dado un usuario activo, cuando falla 3 veces, entonces el 4.º intento responde `403`
  (cuenta bloqueada 15 min); tras ese bloqueo incluso la contraseña correcta es rechazada.
- **AC-01.5** Dado un body con objeto NoSQL (`{"correo_institucional":{"$ne":null}}`), cuando
  inicia sesión, entonces responde `400` sin emitir token.
- **AC-01.6** Dado un JWT con `alg: "none"` o firma inválida, cuando se usa en un endpoint
  protegido, entonces responde `401`.
- **AC-01.7** Dado un usuario al que cambian el rol estando su token vigente, cuando consulta un
  endpoint, entonces ve aplicado el rol nuevo de inmediato (`403` si ya no tiene permiso).

### RF-02 — Jerarquía de usuarios (RF-009, RF-011)

- **AC-02.1** Administrador crea Supervisor -> `201`.
- **AC-02.2** Supervisor crea Contratista -> `201` (y el nuevo usuario queda con `supervisor_id`).
- **AC-02.3** Supervisor intenta crear Administrador -> `403`.
- **AC-02.4** Crear usuario con contraseña débil (p. ej. `abc`) -> `400`.
- **AC-02.5** Supervisor lista usuarios -> solo ve los creados por él.

### RF-03 — Dependencias y responsables (RF-012)

- **AC-03.1** Supervisor crea dependencia -> `201`.
- **AC-03.2** Supervisor asigna responsable a una dependencia y el vínculo queda en ambos lados.
- **AC-03.3** Cualquier usuario autenticado puede **listar** dependencias.
- **AC-03.4** Solo Supervisor puede crear/actualizar/asignar; otro rol -> `403`.

### RF-04 — Registro contractual e inventario (Flujo 2, RF-002/003)

- **AC-04.1** Contratista crea contrato con ≥1 bien -> `201`, estado `Borrador`.
- **AC-04.2** Bien sin `codigo_inventario` o sin `descripcion` -> `400`.
- **AC-04.3** `bienes` vacío o con más de 200 -> `400`.
- **AC-04.4** `cantidad` ≤ 0 o no entera -> `400`.
- **AC-04.5** `fecha_fin` anterior a `fecha_inicio` -> `400`.
- **AC-04.6** Número de contrato duplicado -> `400` (no `500`).
- **AC-04.7** Solo Contratista puede crear; otro rol -> `403`.
- **AC-04.8** El contrato hereda la versión vigente del formato (`version_formato`).

### RF-05 — Consulta y edición de solicitudes (RF-002/005)

- **AC-05.1** Contratista consulta `GET /api/contratos/mis-solicitudes` -> `200` (array).
- **AC-05.2** Contratista actualiza un contrato en `Borrador` -> `200`.
- **AC-05.3** Actualizar un contrato que ya no está en `Borrador` -> `409`/`400`.
- **AC-05.4** Contratista cancela un contrato en `Borrador` -> `200` (estado cancelado/eliminado).
- **AC-05.5** No se puede eliminar el **último** bien del inventario -> `400`.
- **AC-05.6** Contratista elimina un bien cuando hay >1 -> `200`.

### RF-06 — Evaluación del supervisor (Flujo 3)

- **AC-06.1** Supervisor evalúa un contrato en `Borrador` con `aprobado: true` -> `200` y estado
  `Pendiente de Firmas`.
- **AC-06.2** Al aprobar, se abre **un casillero de firma por cada dependencia activa** en
  `trazabilidad_firmas` (las inactivas no cuentan).
- **AC-06.3** Rechazo (`aprobado: false`) -> el contrato vuelve a `Borrador` y se registra observación.
- **AC-06.4** Solo Supervisor puede evaluar; Administrador -> `403`.
- **AC-06.5** Evaluar un contrato ya en firmas o finalizado -> `409`.
- **AC-06.6** Re-aprobar tras un rechazo **no duplica** los casilleros de firma.

### RF-07 — Firmas por dependencia y finalización (Flujo 4, RF-013)

- **AC-07.1** ResponsableArea con casillero aprueba -> `200`.
- **AC-07.2** Cuando todas las áreas aprueban, el contrato pasa a `Finalizado` (una sola vez).
- **AC-07.3** Un rechazo de cualquier área deja el contrato en `Rechazado`; otra área que intente
  aprobar recibe `409` y el estado no cambia.
- **AC-07.4** Tras `Rechazado`, la descarga de PDF -> `400`.
- **AC-07.5** Firma con imagen inválida (no PNG/JPEG) -> `400` y el casillero permanece `Pendiente`.
- **AC-07.6** **Atomicidad:** dos aprobaciones simultáneas finalizan y notifican **una sola vez**
  (una sola entrada `FINALIZAR_CONTRATO` en auditoría).
- **AC-07.7** Cada firma genera `hash_verificacion` de 64 caracteres hex.
- **AC-07.8** **IDOR:** un ResponsableArea **sin casillero** en el contrato no puede consultarlo
  (`403`); el que sí tiene casillero -> `200`.
- **AC-07.9** Tamaño máximo de firma: PNG/JPEG de hasta 512 KB.

### RF-08 — Documento PDF (RF-010)

- **AC-08.1** Contratista dueño descarga `GET /api/contratos/:id/pdf` de un contrato finalizado
  -> `200`, `Content-Type: application/pdf`, cabecera `%PDF-`.
- **AC-08.2** El PDF muestra el **nombre de la dependencia** (no el ObjectId).
- **AC-08.3** El PDF se genera en memoria (no expone rutas del servidor).

### RF-09 — Verificación pública de firma

- **AC-09.1** `GET /api/firmas/verificar/:hash` con un hash válido -> `200`, `valido: true`.
- **AC-09.2** Si se altera el inventario tras firmar, la verificación del mismo hash -> `valido: false`.
- **AC-09.3** Hash con formato inválido -> `400`; hash válido inexistente -> `404`.
- **AC-09.4** La respuesta **no** incluye datos personales como el correo del contratista.

### RF-10 — Gestión de cuentas y contraseñas (Flujo 5, RF-015)

- **AC-10.1** `POST /api/auth/recuperar` siempre `200` (anti-enumeración) y guarda en BD el
  **hash SHA-256** del token (64 hex), nunca el token en claro.
- **AC-10.2** Recuperar con objeto NoSQL (`{"$ne":null}`) -> `400` y no genera tokens.
- **AC-10.3** Restablecer con token válido y contraseña que cumple política -> `200`.
- **AC-10.4** Restablecer **reutilizando el hash guardado** como token -> `400` (no sirve una BD filtrada).
- **AC-10.5** Restablecer con `{"token":{"$ne":null}}` NO permite tomar la cuenta de otro -> `400`.
- **AC-10.6** Cambiar contraseña con la actual correcta -> `200` y devuelve un **token nuevo**.
- **AC-10.7** El token anterior al cambio queda invalidado (`401`).
- **AC-10.8** Nueva contraseña que no cumple política o igual a la actual -> `400`.

### RF-11 — Auditoría (y plantilla del formato, fuera de alcance de la UI)

- **AC-11.1** **No aplica a la UI:** la plantilla del formato GCCON-F-088 es **fija** y se retiró
  la pantalla "Plantilla GCCON-F-088". `PUT /api/formatos/actualizar` sigue existiendo en la API,
  pero no forma parte de los flujos de UI a probar.
- **AC-11.2** `GET /api/formatos/vigente` es público -> `200` con la versión vigente.
- **AC-11.3** Solo Administrador actualiza la plantilla (`PUT /api/formatos/actualizar`); otro rol -> `403`.
- **AC-11.4** `GET /api/auditoria` lista acciones de trazabilidad; solo Administrador -> `200`.
- **AC-11.5** Tras firmar/finalizar existen registros de auditoría de las acciones correspondientes.

### RF-12 — Control administrativo en tiempo real (Flujo 7)

- **AC-12.1** Administrador deshabilita una cuenta (`PATCH /api/usuarios/estado/:id`).
- **AC-12.2** El usuario deshabilitado es expulsado en su **siguiente** petición (`401`), aunque
  su token siga vigente.

---

## 8. Máquina de estados del contrato

```
Borrador ──(evaluar: aprobado=true)──> Pendiente de Firmas ──(todas las áreas aprueban vía firma)──> Finalizado
   ▲                                            │
   │                                            └──(evaluar: aprobado=false)──> Borrador (con observación)
   │
   └──(alguna área Rechazar)──> Rechazado (terminal para el trámite: no finaliza)
```

Estados válidos: `Borrador`, `Pendiente de Firmas`, `Finalizado`, `Rechazado`.

Reglas:
- Solo se edita/cancela en `Borrador`.
- No se evalúa si no está en `Borrador` (`409`).
- Tras `Rechazado` no se puede finalizar; el Supervisor puede re-evaluar sin duplicar casilleros.

---

## 9. Contratos de API

Todos los endpoints requieren `Authorization: Bearer <JWT>` salvo los públicos indicados.
Errores estándar: `400` validación, `401` no autenticado, `403` sin permiso, `404` no encontrado,
`409` conflicto de estado, `429` rate limit.

### 9.1 Autenticación

| Método | Ruta                          | Acceso        | Body                                                                 | Éxito |
|--------|-------------------------------|---------------|----------------------------------------------------------------------|-------|
| POST   | `/api/auth/login`             | público       | `{ correo_institucional, password }`                                 | `200` `{ mensaje, token, usuario:{id,nombre,correo,rol} }` |
| POST   | `/api/auth/recuperar`         | público       | `{ correo_institucional }`                                           | `200` `{ mensaje }` |
| POST   | `/api/auth/restablecer`       | público       | `{ token, nueva_password }`                                          | `200` `{ mensaje }` |
| PUT    | `/api/auth/cambiar-password`  | autenticado   | `{ password_actual, nueva_password }`                                | `200` `{ mensaje, token }` |

> Rate limit estricto en `login`, `recuperar`, `restablecer` y `cambiar-password`.

### 9.2 Usuarios

| Método | Ruta                              | Acceso                | Body / Notas |
|--------|-----------------------------------|-----------------------|--------------|
| POST   | `/api/usuarios`                   | Admin / Supervisor    | `{ nombre_completo, correo_institucional, password, rol }` |
| GET    | `/api/usuarios`                   | Admin / Supervisor    | Supervisor solo ve los suyos |
| GET    | `/api/usuarios/:id`               | autenticado           | detalle |
| PATCH  | `/api/usuarios/:id`               | Admin / Supervisor    | actualización; cambio de rol re-validado por jerarquía |
| PATCH  | `/api/usuarios/estado/:id`        | Admin                 | habilitar/deshabilitar |
| DELETE | `/api/usuarios/:id`               | Admin                 | eliminar |

### 9.3 Contratos e inventario

| Método | Ruta                                  | Acceso                        | Body / Notas |
|--------|---------------------------------------|-------------------------------|--------------|
| POST   | `/api/contratos/nuevo` (y `/api/contratos`) | Contratista               | `{ numero, telefono, dependencia, objeto_contractual?, fecha_inicio?, fecha_fin?, bienes:[{descripcion, codigo_inventario, cantidad?, estado_bien?}] }` |
| GET    | `/api/contratos/mis-solicitudes`      | Contratista                   | array de contratos |
| GET    | `/api/contratos`                      | Supervisor / Admin / Resp.   | listado por rol |
| GET    | `/api/contratos/:id`                  | dueño/supervisor/admin/resp. | detalle + bienes (IDOR controlado) |
| PUT    | `/api/contratos/:id`                  | Contratista                   | solo en `Borrador` |
| DELETE | `/api/contratos/:id`                  | Contratista                   | cancela en `Borrador` |
| DELETE | `/api/contratos/:id/bienes/:bienId`   | Contratista                   | no permite dejar el inventario vacío |
| PUT    | `/api/contratos/evaluar/:id`          | Supervisor                    | `{ aprobado: boolean, observaciones? }` |
| GET    | `/api/contratos/:id/pdf`              | Contratista dueño / Admin     | `application/pdf` |
| GET    | `/api/contratos/:id/observaciones`    | dueño/supervisor/admin        | observaciones del trámite |

### 9.4 Dependencias

| Método | Ruta                                  | Acceso            |
|--------|---------------------------------------|-------------------|
| POST   | `/api/dependencias`                   | Supervisor        |
| GET    | `/api/dependencias`                   | autenticado       |
| PUT    | `/api/dependencias/:id`               | Supervisor        |
| POST   | `/api/dependencias/:id/responsable`   | Supervisor        |
| DELETE | `/api/dependencias/:id`               | Supervisor (toggle estado) |

### 9.5 Firmas

| Método | Ruta                                  | Acceso                          | Body / Notas |
|--------|---------------------------------------|---------------------------------|--------------|
| POST   | `/api/firmas/procesar`                | ResponsableArea / Admin         | `{ contratoId, accion:"Aprobar"\|"Rechazar", observacion_rechazo?, firma_base64? }` |
| GET    | `/api/firmas/pendientes`              | ResponsableArea / Admin         | solicitudes pendientes |
| GET    | `/api/firmas/historial`               | ResponsableArea / Admin         | historial gestionado |
| GET    | `/api/firmas/verificar/:hash`         | público                         | `valido: true/false`, sin datos personales |

### 9.6 Formato y auditoría

| Método | Ruta                          | Acceso   | Notas |
|--------|-------------------------------|----------|-------|
| PUT    | `/api/formatos/actualizar`    | Admin    | actualiza plantilla (upsert; sin UI, formato fijo) |
| GET    | `/api/formatos/vigente`       | público  | versión vigente |
| GET    | `/api/auditoria`              | Admin    | trazabilidad |

### 9.7 Infra

| Método | Ruta       | Acceso  | Notas |
|--------|------------|---------|-------|
| GET    | `/health`  | público | `{ ok: true }` |
| GET    | `/`        | público | mensaje de API activa |
| GET    | `/api-docs`| dev     | Swagger UI (deshabilitado en prod salvo `ENABLE_DOCS=true`) |

---

## 10. Reglas de negocio transversales

1. **Anti-enumeración:** login/recuperar no revelan existencia de cuentas.
2. **Anti inyección NoSQL:** todos los campos de entrada de auth se validan como texto (`isString`).
3. **Tokens:** JWT fijado a HS256; `alg: none` rechazado; cambio/restablecimiento de contraseña
   invalida tokens anteriores (`password_changed_at`).
4. **Rate limiting:** límite global en `/api` y límite estricto en auth (`429` con cabeceras `RateLimit-*`).
5. **Cabeceras de seguridad:** Helmet (CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`).
6. **CORS:** lista blanca por `CORS_ORIGIN`; falla cerrado en producción si está vacío.
7. **Límite de body:** 1 MB.
8. **Auditoría (RNF-003):** acciones de contrato, evaluación, firma, usuarios y formato quedan registradas.
9. **Transacciones:** requieren replica set; en modo standalone el backend usa fallback secuencial
   con compensación, manteniendo la consistencia observable.

---

## 11. Datos de prueba y precondiciones

- **Base de datos desechable** (`pazysalvo_sena_test` o staging). Ejecutar `seedDev` antes del ciclo.
- **Dependencias:** al menos 2 dependencias **activas** y 1 **inactiva**; una con responsable asignado.
- **Bien válido:** `{ "descripcion": "Laptop", "codigo_inventario": "INV-001", "estado_bien": "Bueno" }`.
- **Firma válida:** PNG 1x1 en base64:
  `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`.
- **Firma inválida:** `base64("esto no es una imagen")`.
- **Unicidad:** cada ejecución debe usar números de contrato únicos (p. ej. sufijo timestamp) porque
  `numero_contrato` es único.
- **Estado de cuenta:** si una prueba bloquea un usuario, re-ejecutar `seedDev` lo desbloquea.

---

## 12. Matriz de cobertura (UI vs API)

| Requisito | UI (SPA) | API | Prioridad |
|-----------|:--------:|:---:|:---------:|
| RF-01 Login y bloqueo          | Sí | Sí | Alta   |
| RF-02 Jerarquía de usuarios    | Sí (Usuarios/Supervisores/Contratistas) | Sí | Alta |
| RF-03 Dependencias             | Sí (Dependencias) | Sí | Media |
| RF-04 Registro + inventario    | Sí (Nueva Solicitud) | Sí | Alta |
| RF-05 Consulta/edición         | Sí (Solicitudes) | Sí | Alta |
| RF-06 Evaluación supervisor    | Sí | Sí | Alta |
| RF-07 Firmas y finalización    | Sí (Firmas) | Sí | Alta |
| RF-08 PDF                      | Sí (Certificado) | Sí | Alta |
| RF-09 Verificación por hash    | No | Sí | Media |
| RF-10 Cuentas y contraseñas    | Sí (Recuperar/Perfil) | Sí | Alta |
| RF-11 Auditoría               | Sí | Sí | Media |
| RF-12 Deshabilitar cuenta      | Sí (Usuarios) | Sí | Media |

**Rutas UI relevantes** (actualizadas 2026-10-17; la SPA privada vive bajo el prefijo `/app`):
públicas `/login`, `/recuperar`, `/restablecer`; privadas `/app/dashboard`, `/app/usuarios`,
`/app/supervisores`, `/app/contratistas`, `/app/dependencias`, `/app/solicitudes`,
`/app/solicitudes/nueva` (solo Contratista), `/app/solicitudes/certificado`, `/app/firmas`
(solo ResponsableArea), `/app/auditoria` (Admin), `/app/perfil`, `/app/reportes`,
`/app/notificaciones`. Hay redirecciones de compatibilidad para `/solicitudes`,
`/solicitudes/certificado` y `/certificado`. Ya **no existe** la ruta `plantilla`.

---

## 13. Flujo E2E "camino feliz" (smoke dorado)

1. Login como **Contratista** (demo).
2. Crear contrato con 1 bien -> verlo en "Mis solicitudes" en `Borrador`.
3. Login como **Supervisor** -> evaluar y aprobar -> estado `Pendiente de Firmas`.
4. Login como **ResponsableArea** -> aprobar la firma con PNG válido.
5. Verificar que el contrato queda `Finalizado`.
6. Descargar el PDF (`200`, `application/pdf`).
7. Verificar públicamente el hash de la firma (`valido: true`).

Y su variante negativa: **rechazo de un área** deja el trámite detenido y bloquea el PDF.

---

## 14. Criterios de salida (Definition of Done)

- Todos los `AC-xx` de prioridad **Alta** pasan (UI y API).
- Sin fallos `500` inesperados en el camino feliz ni en las validaciones (deben ser `4xx`).
- Cero fugas de datos sensibles en respuestas públicas (sin correos/hashes internos).
- El PDF descargado es válido (`%PDF-`) y el hash de firma verifica correctamente.
- Las pruebas de seguridad básicas (NoSQL, `alg:none`, IDOR, bloqueo) pasan.
- Los fallos reportados por TestSprite llegan con pasos reproducibles, captura y causa raíz.

---

## 15. Riesgos y consideraciones para TestSprite

- **Datos compartidos:** si se apunta a la BD de desarrollo compartida, use números de contrato
  únicos y limpie sus datos; mejor usar staging aislado.
- **Bloqueo de cuentas:** las pruebas negativas de login pueden bloquear usuarios demo (15 min);
  re-ejecutar `seedDev` entre ciclos.
- **Rate limit:** el volumen de pruebas puede disparar `429`; espaciar o subir `RATE_LIMIT_MAX`
  en el entorno de pruebas.
- **Correo real:** deshabilitado en pruebas (EMAIL vacío); validar el token directamente en BD.
- **Concurrencia:** la prueba de atomicidad de firmas requiere MongoDB real (no emuladores como FerretDB).
- **Fechas:** usar valores ISO 8601 válidos y coherentes para evitar `400` no deseados.

---

## 16. Glosario

- **RF / RNF:** requisito funcional / no funcional.
- **Casillero de firma:** registro en `trazabilidad_firmas` por dependencia activa.
- **Hash de verificación:** HMAC/SHA-256 (64 hex) que acredita la firma e integridad del inventario.
- **IDOR:** acceso a un recurso ajeno cambiando el identificador; aquí un área sin casillero.
- **Paz y salvo contractual:** certificación de que el contratista no tiene pendientes con el SENA.
