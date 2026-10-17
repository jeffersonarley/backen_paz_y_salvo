# PRDs de pruebas por rol — GCCON-F-088 (TestSprite)

Documentos de requisitos por rol para ejecutar pruebas automatizadas con **TestSprite**
(UI + API + E2E). Cada archivo es autocontenido: credenciales, rutas UI, matriz de permisos,
criterios de aceptación (Gherkin), contratos de API y **defectos conocidos** a detectar.

| Rol | Documento | Correo de prueba |
|-----|-----------|------------------|
| Administrador | [`PRD-Rol-Administrador.md`](./PRD-Rol-Administrador.md) | `admin@institucion.edu.co` |
| Supervisor | [`PRD-Rol-Supervisor.md`](./PRD-Rol-Supervisor.md) | `supervisor.demo@sena.edu.co` |
| Responsable de Área | [`PRD-Rol-ResponsableArea.md`](./PRD-Rol-ResponsableArea.md) | `responsable.demo@sena.edu.co` |
| Contratista | [`PRD-Rol-Contratista.md`](./PRD-Rol-Contratista.md) | `contratista.demo@sena.edu.co` |

Contraseñas y PRD general de la aplicación: ver [`PRD-TestSprite-GCCON-F-088.md`](./PRD-TestSprite-GCCON-F-088.md).

## Orden de ejecución recomendado (flujo E2E)

```
Contratista crea el contrato (Borrador)
   -> Supervisor evalúa (Pendiente de Firmas)
      -> Responsable de Área firma su casillero
         -> Todas las áreas aprueban => Finalizado
            -> Contratista descarga el PDF
```

De forma transversal: **Administrador** solo administra (usuarios y auditoría) y
**no** participa en evaluación ni firma.
La **plantilla del formato GCCON-F-088 es fija**: el paz y salvo no se edita, por lo que ya
no existe la pantalla "Plantilla GCCON-F-088".

> **Rutas UI (actualizadas 2026-10-17):** la SPA quedó montada bajo el prefijo `/app`
> (p. ej. `/app/dashboard`, `/app/solicitudes`, `/app/auditoria`). Rutas públicas:
> `/login`, `/recuperar`, `/restablecer`. Existen redirecciones de compatibilidad para
> `/solicitudes`, `/solicitudes/certificado` y `/certificado`.

## Entorno

- Frontend: `http://localhost:9000`
- Backend: `http://localhost:3000/api`
- Seed: `backend/scripts/seedDev.js` (idempotente).
- Rate limit de login: 10 intentos / 15 min (`RATE_LIMIT_MAX`) — evita reintentos agresivos.
