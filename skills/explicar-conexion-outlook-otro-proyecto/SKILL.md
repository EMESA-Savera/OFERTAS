---
name: explicar-conexion-outlook-otro-proyecto
description: Explicar y transferir de forma completa la integracion Outlook/Microsoft Graph de OFERTAS a otro proyecto, incluyendo arquitectura, prerequisitos, implementacion paso a paso, validaciones, riesgos y un bloque explicito de contexto que debe preparar el propietario funcional antes del handoff tecnico.
---

# Skill: Explicar conexion a Outlook para otro proyecto

Esta skill sirve para hacer un handoff completo y ordenado de la conexion Outlook/Microsoft Graph ya validada en OFERTAS hacia otro proyecto.

No es una explicacion teorica generica. Es una guia de transferencia real para que el otro equipo pueda replicar el flujo con menos riesgo de errores en OAuth, callback, permisos o UX post-login.

## Cuando usar esta skill

Usa esta skill cuando te pidan:

1. Explicar en detalle como funciona la conexion Outlook del proyecto actual.
2. Pasar la integracion a otro repositorio o producto.
3. Documentar todo el proceso end-to-end (infra + backend + frontend + pruebas).
4. Dejar claro que debe preparar el responsable funcional/tecnico antes de que el otro equipo implemente.

## Resultado esperado

Al terminar de aplicar esta skill, el otro proyecto debe tener:

1. Login Microsoft funcional para Outlook (delegated o app-only, segun el caso).
2. Endpoint de estado de conexion Outlook.
3. Flujo de redireccion y callback estable.
4. Listado y detalle de correos por Graph.
5. Envio de correo (si aplica al alcance).
6. Checklist de validacion ejecutado.

## Fuente base en OFERTAS

La implementacion de referencia de este repo esta en:

1. Servicio Graph/OAuth: api/outlook_service.py
2. Rutas auth + API Outlook: api/app_ofertas.py
3. Estado de conexion en UI login/header: static/js/loginModal.js
4. Flujo modal Outlook/importacion: static/js/ofertas.js
5. Referencia tecnica de detalle: skills/conexion-outlook-graph/references/ofertas-outlook-graph.md
6. Skill base de conexion Graph: skills/conexion-outlook-graph/SKILL.md

## Vista general de arquitectura

La integracion se divide en 4 capas:

1. Configuracion y autenticacion OAuth (MSAL).
2. Capa de servicio para Microsoft Graph.
3. Endpoints backend para auth/status/messages/detail/send/disconnect.
4. Frontend que consulta estado, redirige a login si falta conexion y reabre el flujo tras callback.

## Paso a paso completo para el proyecto destino

## Paso 1. Definir modo de autenticacion

Elegir uno de estos modos antes de picar codigo:

1. delegated:
- El usuario inicia sesion y se opera sobre su propio buzon.
- Requiere redirect URI y flujo interactivo OAuth.

2. app-only:
- El sistema usa un mailbox configurado en servidor.
- No depende de login interactivo para Outlook.

Regla recomendada (igual que OFERTAS):

1. Si auth_mode viene explicito, respetarlo.
2. Si no viene y hay mailbox, usar app-only.
3. Si no viene y hay redirect_uri, usar delegated.

## Paso 2. Registrar aplicacion en Microsoft Entra ID

Crear o reutilizar una App Registration y configurar:

1. Client ID.
2. Client Secret.
3. Tenant ID.
4. Redirect URI exacta del callback.
5. Permisos de Graph segun modo:
- delegated: al menos User.Read, Mail.Read, Mail.Send, offline_access, openid, profile.
- app-only: Mail.Read/Mail.Send via Application permissions + admin consent.

## Paso 3. Preparar variables de entorno

Mantener contrato compatible por alias para facilitar despliegues:

1. OAUTH_CLIENT_ID | AZURE_CLIENT_ID | MICROSOFT_CLIENT_ID | CLIENT_ID
2. OAUTH_CLIENT_SECRET | AZURE_CLIENT_SECRET | MICROSOFT_CLIENT_SECRET | CLIENT_SECRET
3. OAUTH_TENANT_ID | AZURE_TENANT_ID | MICROSOFT_TENANT_ID | TENANT_ID
4. OAUTH_AUTHORITY | AZURE_AUTHORITY | MICROSOFT_AUTHORITY_BASE
5. OAUTH_REDIRECT_URI | AZURE_REDIRECT_URI | MICROSOFT_REDIRECT_URI | OUTLOOK_REDIRECT_URI
6. OAUTH_SCOPES | AZURE_SCOPES | MICROSOFT_SCOPES | OUTLOOK_SCOPES
7. OAUTH_LOGIN_SCOPES | AZURE_LOGIN_SCOPES | MICROSOFT_LOGIN_SCOPES
8. OAUTH_AUTH_MODE | AZURE_AUTH_MODE | MICROSOFT_AUTH_MODE | OUTLOOK_AUTH_MODE
9. AZURE_MAILBOX | OUTLOOK_MAILBOX | OUTLOOK_MAILBOX_MATCH | MICROSOFT_GRAPH_MAILBOX

Dependencias Python minimas:

1. msal
2. requests

## Paso 4. Implementar servicio reusable Outlook/Graph

Crear una clase equivalente a OutlookGraphService con estas funciones minimas:

1. get_config()
2. get_status(session_store=None)
3. start_auth_flow(session_store, scopes=None, redirect_uri=None)
4. complete_auth_flow(session_store, auth_response, require_access_token=True)
5. disconnect(session_store)
6. list_messages(session_store, folder='inbox', top=20)
7. get_message(session_store, message_id)
8. send_mail(session_store, subject, body, to_recipients, cc_recipients=None, is_html=True, save_to_sent_items=True)

Requisitos tecnicos:

1. Resolver endpoints /me/* o /users/{mailbox}/* segun modo.
2. Gestionar tokens con cache de sesion en delegated.
3. Devolver errores claros para reconexion cuando la sesion caduque.

## Paso 5. Implementar rutas de autenticacion

Rutas a crear:

1. /auth/microsoft/login
2. /auth/microsoft/callback
3. /auth/outlook/login
4. /auth/outlook/callback

Buenas practicas obligatorias:

1. Guardar state para proteger CSRF.
2. Guardar contexto de autenticacion (app vs outlook).
3. Guardar redirect post-auth (ejemplo: index?open_outlook=1).
4. En callback, validar state y completar auth flow.

## Paso 6. Implementar API Outlook

Rutas minimas:

1. GET /api/outlook/status
2. POST /api/outlook/disconnect
3. GET /api/outlook/messages
4. GET /api/outlook/messages/<message_id>
5. POST /api/outlook/send

Contrato recomendado de status:

1. configured
2. available
3. connected
4. auth_mode
5. mailbox
6. login_url
7. disconnect_url

## Paso 7. Normalizar datos de correo en backend

No delegar parseo de body o limpieza de texto en frontend.

En backend:

1. Convertir HTML a texto cuando proceda.
2. Limpiar ruido de firmas/hilos.
3. Normalizar sender_name/sender_email.
4. Normalizar received_at.
5. Entregar payload de importacion listo para el dominio del proyecto destino.

## Paso 8. Integrar frontend con redireccion controlada

Flujo correcto del cliente:

1. Usuario pulsa abrir Outlook.
2. Frontend llama /api/outlook/status.
3. Si no conectado y existe login_url, redirigir a login_url.
4. Tras callback, volver con open_outlook=1.
5. Frontend limpia query params y reabre modal.
6. Cargar lista de mensajes y detalle.

## Paso 9. Implementar envio de correo (si aplica)

Validaciones minimas en backend:

1. to_recipients obligatorio.
2. subject obligatorio.
3. body obligatorio.
4. Normalizar separadores coma/punto y coma.
5. Deduplicar correos.

## Paso 10. Ejecutar validacion end-to-end

Checklist obligatorio:

1. /api/outlook/status devuelve configured=true y available=true.
2. Login redirige y callback vuelve sin state mismatch.
3. Tras callback, status.connected=true.
4. /api/outlook/messages devuelve mensajes.
5. /api/outlook/messages/<id> devuelve detalle y payload normalizado.
6. /api/outlook/send envia correctamente (si esta en alcance).

## Lo que debes preparar tu antes del handoff (contexto obligatorio)

Este bloque es clave. Sin esto, el otro equipo pierde tiempo y toma decisiones funcionales incorrectas.

Debes entregarles un paquete de contexto con:

1. Objetivo de negocio exacto:
- Solo leer correos.
- Leer + importar datos.
- Leer + enviar respuestas.

2. Modo de autenticacion elegido y motivo:
- delegated o app-only.
- Quien sera el remitente/buzon efectivo.

3. Entorno objetivo:
- URLs reales de DEV/QA/PROD.
- Redirect URI de cada entorno.
- Politica de certificados/TLS/proxy corporativo.

4. App Registration y permisos:
- Tenant.
- Permisos aprobados.
- Si requiere admin consent y quien lo concede.

5. Contrato funcional de importacion:
- Que campos del correo se mapean al formulario destino.
- Reglas de limpieza del cuerpo.
- Formato de fecha esperado.

6. Reglas de seguridad/compliance:
- Retencion de datos.
- Si se guarda body completo o solo extracto.
- Reglas de auditoria de envio.

7. Criterio de exito:
- Casos de prueba que deben pasar para aceptar la integracion.

## Plantilla corta que debes enviar al otro proyecto

Usa esta plantilla de handoff:

1. Contexto funcional:
- Queremos integrar Outlook para [leer/importar/enviar].
- El flujo aplica a [tipo de usuario/rol].

2. Decision tecnica:
- Modo: [delegated/app-only].
- Mailbox operativo: [usuario real/shared mailbox].

3. Infra y seguridad:
- Tenant: [id o nombre].
- Redirect URIs por entorno: [lista].
- Permisos Graph aprobados: [lista].

4. Contrato API esperado:
- /api/outlook/status
- /api/outlook/messages
- /api/outlook/messages/<id>
- /api/outlook/send (si aplica)
- /api/outlook/disconnect

5. UX esperada:
- Si no hay conexion, redirigir a login Microsoft.
- Al volver, reabrir modal con open_outlook=1.

6. Criterio de aceptacion:
- Lista los 6 checks del bloque de validacion end-to-end.

## Errores comunes y como evitarlos

1. redirect_uri_mismatch:
- El redirect URI del runtime no coincide exactamente con Azure.

2. invalid_client:
- Secret incorrecto, caducado o tenant mal configurado.

3. state mismatch:
- Se pierde estado en sesion o no se valida correctamente en callback.

4. Login correcto pero sin datos de usuario:
- Falta enrich con GET /me o scopes insuficientes.

5. Funciona en local y falla en produccion:
- Diferencias de dominio/HTTPS/proxy/certificados/cookies secure.

## Criterio de cierre de transferencia

La transferencia a otro proyecto se considera completa cuando:

1. El otro equipo dispone de este documento + variables + decisiones funcionales.
2. Se ha ejecutado el checklist end-to-end en su entorno.
3. Han validado al menos un caso feliz y un caso de error de reconexion.
4. Queda definida la operativa de soporte (quien revisa si falla OAuth/Graph).

## Referencias utiles dentro de OFERTAS

1. skills/conexion-outlook-graph/SKILL.md
2. skills/conexion-outlook-graph/references/ofertas-outlook-graph.md
3. docs/COMO_REPLICAR_LOGIN_OUTLOOK.md
