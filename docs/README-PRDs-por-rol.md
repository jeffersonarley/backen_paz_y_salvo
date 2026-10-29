# PRDs de pruebas por rol — GCCON-F-088 (TestSprite)

Documentos de requisitos por rol para ejecutar pruebas automatizadas con **TestSprite**
(UI + API + E2E). Cada archivo es autocontenido: credenciales, rutas UI, matriz de permisos,
criterios de aceptación (Gherkin), contratos de API y **defectos conocidos** a detectar.

| Rol | Documento | Correo de prueba |
|-----|-----------|------------------|
| Administrador | [`PRD-Rol-Administrador.md`](./PRD-Rol-Administrador.md) | `admin@gccon.com` |
| Coordinador/Supervisor | [`PRD-Rol-Supervisor.md`](./PRD-Rol-Supervisor.md) | `supervisor@gccon.com` |
| Responsable de Área | [`PRD-Rol-ResponsableArea.md`](./PRD-Rol-ResponsableArea.md) | `franklin.chacon@gccon.com` |
| Contratista | [`PRD-Rol-Contratista.md`](./PRD-Rol-Contratista.md) | `proyecto.gas@gccon.com` |

Contraseñas y PRD general de la aplicación: ver [`PRD-TestSprite-GCCON-F-088.md`](./PRD-TestSprite-GCCON-F-088.md).

## Orden de ejecución recomendado (flujo E2E)

```
Coordinador/Supervisor crea la solicitud / Contratista registra contrato
   -> Coordinador gestiona la plantilla por contrato (editable por fila, responsables asignables)
      -> Coordinador abre casilleros / se evalúa -> Pendiente de Firmas
         -> Responsable de Área firma **solo su casillero exacto** (validado por dependencia/responsable)
            -> Todas las áreas aprueban => Finalizado
               -> Contratista firma su casilla final y descarga el PDF
```

De forma transversal: **Administrador** solo administra (usuarios, dependencias y auditoría) y
**no** participa en evaluación ni firma.  
**Plantillas**: configurables por contrato desde el menú lateral **"Plantillas"** (editable por fila, con responsables visibles al frente de cada dependencia). Cada coordinador tiene **dependencia propia** y puede asignar un **apoyo de supervisión**. **Los casilleros solo se generan para dependencias activas**.

> **Rutas UI (actualizadas 2026-10-17):** la SPA quedó montada bajo el prefijo `/app`
> (p. ej. `/app/dashboard`, `/app/solicitudes`, `/app/auditoria`). Rutas públicas:
> `/login`, `/recuperar`, `/restablecer`. Existen redirecciones de compatibilidad para
> `/solicitudes`, `/solicitudes/certificado` y `/certificado`.

## Entorno

- Frontend: `http://localhost:9000`
- Backend: `http://localhost:3000/api`
- Seed: `backend/scripts/seedDev.js` (idempotente).
- Rate limit de login: 10 intentos / 15 min (`RATE_LIMIT_MAX`) — evita reintentos agresivos.
