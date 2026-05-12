---
name: conexion-outlook-graph
description: Replicar la conexion con Outlook/Microsoft Graph usada en OFERTAS para login Microsoft, conexion de Outlook, lectura de correos, detalle de mensajes, envio de correo y reapertura del flujo tras autenticacion. Usar cuando el usuario pida portar la integracion Outlook existente de este proyecto a otra app Flask, SPA web o proyecto interno que necesite Microsoft Graph con MSAL.
---

# Conexion Outlook Graph

Esta skill empaqueta el patron real ya implementado en OFERTAS para conectar una aplicacion con Outlook mediante Microsoft Graph. No describe una integracion teorica: documenta el flujo que ya funciona en este proyecto para poder replicarlo con el menor numero de decisiones nuevas posible.

## Cuando usar esta skill

Usa esta skill cuando necesites cualquiera de estas tareas:

1. Portar el login Microsoft existente a otro proyecto.
2. Conectar Outlook para leer correos sin descargar `.msg` o `.eml`.
3. Reutilizar el flujo MSAL + Graph para listar mensajes, ver detalle y enviar email.
4. Implementar una UI que redirige a Microsoft y luego reabre automaticamente el modal de Outlook.
5. Separar login de aplicacion y conexion Outlook, pero compartiendo la misma base OAuth.

## Fuente de verdad en este repo

- Servicio Graph: `api/outlook_service.py`
- Rutas Flask: `api/app_ofertas.py`
- Estado de conexion en cabecera/login: `static/js/loginModal.js`
- Modal de importacion Outlook: `templates/index.html`
- Flujo frontend de apertura, redirect e importacion: `static/js/ofertas.js`
- Referencia detallada de portado: `references/ofertas-outlook-graph.md`

## Lo que replica exactamente

Esta skill replica estas decisiones tecnicas del proyecto:

1. Cliente MSAL confidencial en backend Python con `msal`.
2. Llamadas a Microsoft Graph con `requests`.
3. Dos modos de autenticacion soportados:
   - `delegated`: usuario real inicia sesion y Graph opera sobre `/me`.
   - `app-only`: la app opera sobre un mailbox configurado y usa `.default`.
4. Cache de token delegada persistida en sesion Flask.
5. Rutas separadas para login Microsoft general y conexion Outlook especifica.
6. API backend para estado, listar mensajes, cargar detalle, desconectar y enviar correo.
7. Frontend que consulta estado antes de abrir Outlook y redirige solo si falta la conexion.
8. Reapertura del flujo funcional con `open_outlook=1` tras volver desde Microsoft.

## Flujo recomendado de portado

1. Copiar primero la capa de servicio Graph y dejarla operativa con variables de entorno.
2. Copiar despues las rutas de autenticacion y API Outlook del backend.
3. Integrar el chequeo de sesion de aplicacion antes de permitir uso de Outlook.
4. Portar luego el contrato frontend de estado + modal + redirect post-auth.
5. Validar primero `status -> login -> callback -> status`.
6. Validar despues `messages -> message detail -> importacion`.
7. Validar por ultimo `sendMail` si el proyecto tambien debe enviar correo.

## Contrato minimo que debe mantenerse

### Backend

Debes conservar estas capacidades:

1. Resolver configuracion desde variables de entorno con alias compatibles.
2. Detectar si Outlook opera en modo `delegated` o `app-only`.
3. Exponer una forma de obtener el estado: configurado, disponible, conectado, mailbox y URLs de accion.
4. Iniciar el auth code flow con MSAL cuando Outlook no este conectado.
5. Completar el callback y persistir el token cache.
6. Listar mensajes de bandeja.
7. Cargar detalle de un mensaje y normalizarlo para el dominio del proyecto.
8. Enviar correo mediante Graph.

### Frontend

Debes conservar estas decisiones:

1. Consultar `/api/outlook/status` antes de abrir el modal.
2. Redirigir a `login_url` cuando el backend informa que no hay conexion activa.
3. Volver al proyecto con un parametro tipo `open_outlook=1` para reabrir el modal.
4. Leer `/api/outlook/messages` y `/api/outlook/messages/<id>`.
5. Rellenar el formulario destino solo con datos ya normalizados por backend.

## Variables de entorno a portar

No copies valores concretos de este repo. Solo replica el contrato de nombres.

Variables base admitidas por el servicio:

- `OAUTH_CLIENT_ID`, `AZURE_CLIENT_ID`, `MICROSOFT_CLIENT_ID`, `CLIENT_ID`
- `OAUTH_CLIENT_SECRET`, `AZURE_CLIENT_SECRET`, `MICROSOFT_CLIENT_SECRET`, `CLIENT_SECRET`
- `OAUTH_TENANT_ID`, `AZURE_TENANT_ID`, `MICROSOFT_TENANT_ID`, `TENANT_ID`
- `OAUTH_AUTHORITY`, `AZURE_AUTHORITY`, `MICROSOFT_AUTHORITY_BASE`
- `OAUTH_REDIRECT_URI`, `AZURE_REDIRECT_URI`, `MICROSOFT_REDIRECT_URI`, `OUTLOOK_REDIRECT_URI`
- `OAUTH_SCOPES`, `AZURE_SCOPES`, `MICROSOFT_SCOPES`, `OUTLOOK_SCOPES`
- `OAUTH_LOGIN_SCOPES`, `AZURE_LOGIN_SCOPES`, `MICROSOFT_LOGIN_SCOPES`
- `OAUTH_AUTH_MODE`, `AZURE_AUTH_MODE`, `MICROSOFT_AUTH_MODE`, `OUTLOOK_AUTH_MODE`
- `AZURE_MAILBOX`, `OUTLOOK_MAILBOX`, `OUTLOOK_MAILBOX_MATCH`, `MICROSOFT_GRAPH_MAILBOX`

Regla actual del proyecto:

1. Si hay `mailbox`, el servicio puede resolver `app-only`.
2. Si hay `redirect_uri`, el servicio puede resolver `delegated`.
3. Si se informa `auth_mode`, ese valor manda.

## Rutas que forman el proceso completo

Rutas de autenticacion:

1. `/auth/microsoft/login`
2. `/auth/microsoft/callback`
3. `/auth/outlook/login`
4. `/auth/outlook/callback`

Rutas API Outlook:

1. `/api/outlook/status`
2. `/api/outlook/disconnect`
3. `/api/outlook/messages`
4. `/api/outlook/messages/<message_id>`
5. `/api/outlook/send`

## Restricciones importantes

1. No mezclar secretos reales en la skill ni en snippets de ejemplo.
2. No asumir que Graph siempre devuelve `mail`, `upn` o `employeeId` en `id_token`; si hace falta, enriquecer con `/me`.
3. No forzar el uso de `.default` si el proyecto necesita flujo delegado interactivo.
4. No hacer la importacion de datos del correo en frontend si el backend ya tiene logica de normalizacion.
5. No abrir Outlook si la aplicacion todavia no tiene sesion propia.

## Checklist corto de validacion

1. El backend devuelve `configured=true` y `available=true` en `/api/outlook/status`.
2. El login Microsoft redirige y vuelve sin error de `state mismatch`.
3. Tras el callback, `/api/outlook/status` devuelve `connected=true`.
4. `/api/outlook/messages` devuelve mensajes del buzón esperado.
5. `/api/outlook/messages/<id>` devuelve detalle y payload normalizado.
6. `/api/outlook/send` envia correo con asunto, cuerpo y destinatarios validos.

## Referencia detallada

Consulta `references/ofertas-outlook-graph.md` para el contrato tecnico completo, snippets minimos y orden de implementacion.