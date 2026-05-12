# Referencia tecnica: Outlook Graph en OFERTAS

Esta referencia describe el proceso real de conexion Outlook usado en OFERTAS para poder clonarlo en otro proyecto sin arrastrar dependencias accidentales de esta aplicacion.

## 1. Arquitectura actual

El flujo esta dividido en cuatro capas:

1. Configuracion OAuth y deteccion de modo en `api/outlook_service.py`.
2. Rutas Flask que separan login Microsoft general y conexion Outlook en `api/app_ofertas.py`.
3. Widget de sesion/cabecera que muestra conectar o desconectar Outlook en `static/js/loginModal.js`.
4. Modal de negocio que abre el buzón, lista mensajes y rellena el formulario en `templates/index.html` y `static/js/ofertas.js`.

## 2. Modos de autenticacion soportados

### Delegated

Usalo cuando el buzón a consultar o el remitente del correo debe ser el usuario autenticado.

Comportamiento:

1. Requiere `redirect_uri`.
2. Usa `initiate_auth_code_flow` y `acquire_token_by_auth_code_flow`.
3. Guarda token cache en sesion Flask.
4. Opera contra endpoints `/me/...`.
5. Puede enriquecer el perfil con `GET /me` despues del callback.

### App-only

Usalo cuando el proyecto necesita operar siempre sobre un mailbox configurado en servidor.

Comportamiento:

1. Requiere `mailbox`.
2. Usa `acquire_token_for_client` con scope `https://graph.microsoft.com/.default`.
3. No inicia login interactivo de usuario para Outlook.
4. Opera contra endpoints `/users/{mailbox}/...`.

## 3. Servicio reusable minimo

El servicio reusable debe ofrecer, como minimo, estas funciones:

1. `get_config()`
2. `get_status(session_store=None)`
3. `start_auth_flow(session_store, scopes=None, redirect_uri=None)`
4. `complete_auth_flow(session_store, auth_response, require_access_token=True)`
5. `disconnect(session_store)`
6. `list_messages(session_store, folder='inbox', top=20)`
7. `get_message(session_store, message_id)`
8. `send_mail(session_store, subject, body, to_recipients, cc_recipients=None, is_html=True, save_to_sent_items=True)`

Dependencias del servicio:

1. `msal`
2. `requests`

## 4. Contrato de configuracion

Mantener compatibilidad de alias evita romper despliegues distintos. El proyecto actual acepta varios nombres para cada secreto o parametro OAuth.

Contrato recomendado:

```env
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
OAUTH_TENANT_ID=
OAUTH_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
OAUTH_REDIRECT_URI=https://miapp.midominio/auth/callback
OAUTH_LOGIN_SCOPES=openid profile offline_access User.Read
OAUTH_SCOPES=openid profile offline_access User.Read Mail.Send
OAUTH_AUTH_MODE=delegated

# Solo para app-only
OUTLOOK_MAILBOX=shared-mailbox@empresa.com
```

Regla de resolucion que merece ser copiada tal cual:

1. `auth_mode` explicito tiene prioridad.
2. Si no hay `auth_mode` y existe `mailbox`, resolver `app-only`.
3. Si no hay `auth_mode` y existe `redirect_uri`, resolver `delegated`.

## 5. Rutas Flask a replicar

### Login Microsoft general

Objetivo: crear la sesion normal de la app usando identidad Microsoft.

Rutas:

1. `GET /auth/microsoft/login`
2. `GET /auth/microsoft/callback`

Contrato:

1. Guardar un contexto de autenticacion en sesion, por ejemplo `microsoft_auth_context = 'app'`.
2. Guardar un redirect post-login, por ejemplo `microsoft_post_auth_redirect`.
3. Reusar `OutlookGraphService.start_auth_flow(...)`.
4. Completar callback con `require_access_token=False` o segun la necesidad del login app.
5. Resolver el usuario interno del proyecto a partir del perfil Microsoft antes de abrir la app.

### Conexion Outlook especifica

Objetivo: conectar Outlook solo cuando un usuario ya autenticado en la app quiere leer o enviar correo.

Rutas:

1. `GET /auth/outlook/login`
2. `GET /auth/outlook/callback`

Contrato:

1. Verificar que ya existe sesion local de la app.
2. Guardar `microsoft_auth_context = 'outlook'`.
3. Guardar redirect post-login tipo `index?open_outlook=1`.
4. Completar callback con `require_access_token=True`.
5. Redirigir al modal de Outlook reabriendo el flujo si el login sale bien.

### API Outlook

Endpoints a clonar:

```text
GET  /api/outlook/status
POST /api/outlook/disconnect
GET  /api/outlook/messages?folder=inbox&top=20
GET  /api/outlook/messages/<message_id>
POST /api/outlook/send
```

Contrato esperado de cada endpoint:

#### Status

Debe devolver como minimo:

```json
{
  "success": true,
  "configured": true,
  "available": true,
  "connected": true,
  "auth_mode": "delegated",
  "mailbox": "usuario@empresa.com",
  "login_url": "/auth/outlook/login",
  "disconnect_url": "/api/outlook/disconnect"
}
```

#### Messages

Debe devolver un resumen listo para pintar en lista:

```json
{
  "success": true,
  "account": { "username": "usuario@empresa.com" },
  "folder": "inbox",
  "messages": [
    {
      "id": "...",
      "subject": "...",
      "received_at": "2026-05-11T08:40:00Z",
      "body_preview": "...",
      "sender_name": "...",
      "sender_email": "...",
      "is_read": false,
      "has_attachments": true,
      "web_link": "..."
    }
  ]
}
```

#### Message detail

Debe devolver el detalle Graph y el payload normalizado de dominio.

En OFERTAS, la normalizacion actual produce al menos:

```json
{
  "success": true,
  "outlook_message": {
    "id": "...",
    "subject": "...",
    "received_at": "...",
    "body_content": "...",
    "body_content_type": "html",
    "sender_name": "...",
    "sender_email": "..."
  },
  "import_data": {
    "emisor": "Nombre <correo@empresa.com>",
    "ref_cliente_asunto_email": "Asunto",
    "fecha_email": "2026-05-11",
    "observaciones": "Cuerpo limpio del email"
  }
}
```

## 6. Normalizacion de correo reutilizable

La decision correcta en OFERTAS es normalizar en backend y no en frontend.

Pasos del flujo actual:

1. Leer `body_content` o `body_preview`.
2. Si `body_content_type == html`, convertir HTML a texto.
3. Limpiar ruido del correo.
4. Normalizar nombre y email del remitente.
5. Construir un `sender_display` tipo `Nombre <correo@empresa.com>`.
6. Convertir `received_at` a fecha util para el formulario.

Snippet minimo equivalente:

```python
def normalize_outlook_message_for_target(message):
    body_content = message.get("body_content") or message.get("body_preview") or ""
    body_type = str(message.get("body_content_type") or "text").strip().lower()
    body_text = html_to_text(body_content) if body_type == "html" else str(body_content)
    body_text = clean_email_body(body_text)

    sender_name = normalize_optional_text(message.get("sender_name"), 255)
    sender_email = normalize_optional_text(message.get("sender_email"), 255)
    if sender_email:
        sender_email = sender_email.lower()

    return {
        "sender_name": sender_name,
        "sender_email": sender_email,
        "sender_display": format_sender_display(sender_name, sender_email),
        "subject": normalize_optional_text(message.get("subject"), 500),
        "received_at": normalize_email_datetime(message.get("received_at")),
        "body": body_text,
    }
```

## 7. Contrato frontend a replicar

### Estado de conexion en header o login widget

El proyecto actual mantiene un estado cliente simple:

```javascript
let outlookConnectionState = {
  checked: false,
  connected: false,
  mailbox: '',
  disconnectUrl: '/api/outlook/disconnect'
};
```

Comportamiento minimo:

1. Si no hay usuario autenticado en la app, resetear el estado Outlook.
2. Consultar `/api/outlook/status`.
3. Si esta conectado, mostrar mailbox y boton de desconexion.
4. Si no esta conectado, mostrar boton `Conectar Outlook`.

### Modal de importacion

El modal necesita tres piezas:

1. Lista de mensajes.
2. Panel de detalle.
3. Accion para importar el correo seleccionado.

Contrato DOM minimo:

```html
<div id="outlookImportModal" aria-hidden="true">
  <div id="outlookMailboxLabel"></div>
  <div id="outlookMessagesList"></div>
  <div id="outlookMessageDetail"></div>
  <button id="outlookImportSelectedButton" type="button">Importar</button>
  <div id="outlookImportFeedback"></div>
</div>
```

### Redireccion y reapertura automatica

La parte importante del proyecto no es solo autenticar: es volver al punto funcional correcto.

Contrato recomendado:

1. Antes de redirigir, backend guarda un redirect con `open_outlook=1`.
2. Al cargar la pagina, frontend lee `open_outlook` y `outlook_error` desde query string.
3. Limpia esos parametros de la URL.
4. Si `open_outlook=1`, reabre el modal o reintenta abrir Outlook.

Snippet minimo equivalente:

```javascript
const currentUrl = new URL(window.location.href);
const shouldOpenOutlookAfterAuth = currentUrl.searchParams.get('open_outlook') === '1';
const outlookAuthError = currentUrl.searchParams.get('outlook_error') || '';

if (shouldOpenOutlookAfterAuth || outlookAuthError) {
  currentUrl.searchParams.delete('open_outlook');
  currentUrl.searchParams.delete('outlook_error');
  window.history.replaceState({}, document.title, `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
}
```

### Apertura del modal con chequeo de estado

Orden correcto del flujo:

1. Abrir modal en estado loading.
2. Consultar `/api/outlook/status`.
3. Si no esta conectado y existe `login_url`, redirigir a Microsoft.
4. Si esta conectado, cargar `/api/outlook/messages`.
5. Cargar el detalle del primer correo si existe.

## 8. Envio de correo

El endpoint de envio solo debe aceptar payload ya validado.

Contrato minimo:

```json
{
  "subject": "Asunto",
  "body": "<p>Mensaje</p>",
  "to_recipients": ["destino@empresa.com"],
  "cc_recipients": ["copia@empresa.com"],
  "is_html": true,
  "save_to_sent_items": true
}
```

Validaciones que merece la pena clonar:

1. `to_recipients` obligatorio.
2. `subject` obligatorio.
3. `body` obligatorio.
4. Normalizar listas separadas por coma o punto y coma.
5. Deduplicar direcciones.

## 9. Riesgos y errores reales que esta implementacion ya cubre

1. `state mismatch` al volver del callback: se mitiga guardando multiples flows por `state` en sesion.
2. Falta de `mail` o `upn` en `id_token`: se mitiga enriqueciendo perfil con `GET /me`.
3. Sesion caducada para Graph: el servicio devuelve un error claro pidiendo reconectar.
4. Entornos productivos empaquetados: la app debe cargar `.env.production` del directorio del ejecutable antes de cualquier `.env` generico.
5. App-only y delegated no comparten el mismo contrato de usuario conectado: en app-only el `account` efectivo es el mailbox configurado.

## 10. Checklist de portado

1. Instalar `msal` y `requests`.
2. Registrar app en Microsoft Entra ID con redirect URI correcto.
3. Definir scopes segun modo delegado o app-only.
4. Implementar `OutlookGraphService` o equivalente.
5. Implementar rutas `auth/microsoft/*` y `auth/outlook/*`.
6. Implementar `/api/outlook/status`, `/messages`, `/messages/<id>`, `/send`, `/disconnect`.
7. Portar el modal y el redirect `open_outlook=1`.
8. Validar manualmente login, callback, listado, detalle e importacion.
9. Validar envio de correo si aplica.

## 11. Que no copiar ciegamente

1. Los valores concretos de `.env.production` de este repo.
2. La logica de resolucion de usuario interno si el proyecto destino no usa `General.Usuarios`.
3. La transformacion exacta del email al dominio OFERTAS si el formulario destino necesita otros campos.
4. El uso de `Mail.Send` si el nuevo proyecto solo va a leer correos.