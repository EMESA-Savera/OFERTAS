# Como replica DECOCAB el login de Outlook solo en produccion

## Objetivo

Este documento explica el flujo real de inicio de sesion con Microsoft/Outlook en DECOCAB cuando la aplicacion corre en produccion.

El foco aqui no es el entorno local ni pruebas con `localhost`. El caso documentado es el despliegue del servidor con:

- `APP_ENV=production`
- HTTPS real
- `OAUTH_REDIRECT_URI` fija y registrada en Azure
- cache OAuth persistente en disco
- confianza TLS corporativa a Microsoft

En produccion, DECOCAB autentica al usuario contra Microsoft Entra ID y luego usa Microsoft Graph para operar con su buzon de Outlook sin exponer tokens al navegador.

## Resumen del flujo en produccion

El flujo completo es este:

1. El usuario abre la web productiva de DECOCAB.
2. La aplicacion redirige al usuario a `/auth/login`.
3. El backend genera la URL de Microsoft Entra ID con el `redirect_uri` productivo.
4. Microsoft autentica al usuario y devuelve un `authorization code` a `/auth/callback`.
5. El backend intercambia ese codigo por tokens con MSAL.
6. El backend consulta `https://graph.microsoft.com/v1.0/me` para identificar al usuario real.
7. El backend crea una sesion propia de DECOCAB con cookie HTTP-only.
8. Los tokens quedan guardados solo en servidor, en cache persistente.
9. Las rutas protegidas renuevan el token de forma silenciosa cuando hace falta.
10. Las operaciones de Outlook se hacen desde backend usando Microsoft Graph.

## Configuracion real de produccion en DECOCAB

La referencia productiva sale de `.env.production`.

Las piezas importantes son:

```env
APP_ENV=production

OAUTH_CLIENT_ID=<client-id>
OAUTH_CLIENT_SECRET=<client-secret>
OAUTH_TENANT_ID=<tenant-id>
OAUTH_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
OAUTH_REDIRECT_URI=https://<host-productivo>:3548/auth/callback
OAUTH_POST_LOGOUT_REDIRECT_URI=https://<host-productivo>:3548/
OAUTH_SCOPES=https://graph.microsoft.com/.default

OAUTH_SESSION_MAX_AGE_DAYS=30
OAUTH_ACCESS_TOKEN_MAX_AGE_SECONDS=0
OAUTH_TOKEN_REFRESH_MARGIN_SECONDS=300

OAUTH_CACHE_DIR=C:/ProgramData/DECOCAB/data/oauth
OAUTH_USE_SYSTEM_TRUST_STORE=1

SESSION_SECRET=<flask-secret>
SESSION_COOKIE_SAMESITE=Lax

CORS_ALLOWED_ORIGINS=https://<host-productivo>:3548

HOST=0.0.0.0
PORT=3548
AUTO_GENERATE_SSL_CERT=0
```

### Que significa cada bloque en produccion

`APP_ENV=production`

- activa el modo productivo del backend
- hace que el proyecto trate la app como despliegue real
- fuerza comportamiento de cookies seguras y desactiva atajos de desarrollo

`OAUTH_REDIRECT_URI`

- es la URL exacta registrada en Azure App Registration
- en produccion no debe improvisarse ni depender del host actual del navegador
- DECOCAB la toma como origen canonico para el flujo OAuth

`OAUTH_POST_LOGOUT_REDIRECT_URI`

- es la URL a la que vuelve el usuario tras cerrar sesion
- debe apuntar al front productivo

`OAUTH_SCOPES=https://graph.microsoft.com/.default`

- indica que la app pide los permisos Graph concedidos a la App Registration
- en produccion esto evita mezclar scopes manuales distintos entre entornos

`OAUTH_CACHE_DIR=C:/ProgramData/DECOCAB/data/oauth`

- es la ruta persistente donde se guardan la cache MSAL y el indice de sesiones OAuth
- permite que el servidor no pierda estado por simple recarga del proceso

`OAUTH_USE_SYSTEM_TRUST_STORE=1`

- en produccion el proyecto usa el almacen de certificados de Windows del servidor
- esto es importante si la red corporativa tiene proxy SSL o CA interna

`AUTO_GENERATE_SSL_CERT=0`

- en produccion DECOCAB no genera certificados autofirmados
- se espera usar `cert.pem` y `key.pem` reales en el servidor

## Componentes que participan en produccion

Los archivos principales son:

- `api/oauth_config.py`: carga `.env.production`, configura TLS saliente, inicializa MSAL y mantiene caches persistentes.
- `api/app_usuarios.py`: contiene las rutas `/auth/login`, `/auth/callback`, `/auth/logout` y el decorador `require_oauth_session`.
- `api/graph_client.py`: encapsula las llamadas a Microsoft Graph.
- `app/web/routes.py`: redirige `/login` a `/auth/login`.
- `scripts/validate_oauth.py`: valida que la configuracion OAuth de servidor sea coherente.

## Paso a paso del login en produccion

## Paso 1. El usuario entra por la URL HTTPS productiva

El usuario accede a la aplicacion por una URL como esta:

```text
https://<host-productivo>:3548/
```

En produccion esto importa porque:

- el host debe coincidir con el registrado en Azure
- el navegador debe confiar en el certificado HTTPS del servidor
- la cookie de sesion se emite como segura

Si el host publico no coincide con `OAUTH_REDIRECT_URI`, el callback OAuth fallara.

## Paso 2. La entrada al login redirige a `/auth/login`

DECOCAB tiene una ruta de apoyo en `app/web/routes.py`:

```python
@web_bp.get("/login")
def login_redirect():
    return redirect("/auth/login")
```

La logica real vive en `/auth/login`, dentro de `api/app_usuarios.py`.

## Paso 3. El backend fija el origen canonico productivo

Antes de construir la redireccion a Microsoft, el backend usa `OAUTH_REDIRECT_URI` como fuente de verdad.

Esto ocurre porque:

- `_get_oauth_base_url()` extrae `scheme://host[:port]` desde `OAuthConfig.REDIRECT_URI`
- `_get_runtime_oauth_redirect_uri()` devuelve la `redirect_uri` configurada

En produccion esto evita que el flujo dependa del host con el que haya entrado el usuario si hay proxy, DNS alternativo o nombres antiguos.

## Paso 4. `/auth/login` construye la URL de Microsoft Entra ID

La funcion `oauth_login()` hace estas tareas en produccion:

1. Lee `return_to` para saber a que pagina volver.
2. Obtiene el `redirect_uri` productivo.
3. Resuelve, si existe, el correo esperado del usuario local para usar `login_hint`.
4. Reconstuye la app MSAL con `get_msal_app(force_recreate=True, reason='oauth_login')`.
5. Genera la URL de autorizacion.
6. Guarda en sesion Flask:
   - `oauth_state`
   - `oauth_return_to`
   - `oauth_redirect_uri`
7. Guarda tambien el `state` en una cache temporal server-side.
8. Redirige al usuario a Microsoft.

Conceptualmente la llamada es esta:

```python
auth_url = self._app.get_authorization_request_url(
    scopes=OAuthConfig.SCOPES,
    state=state,
    redirect_uri=effective_redirect_uri,
    login_hint=login_hint,
    prompt='login',
    domain_hint='organizations',
)
```

En produccion, los dos valores que no deben variar son:

- `OAuthConfig.SCOPES`
- `effective_redirect_uri`

## Paso 5. Microsoft autentica y redirige al callback productivo

Tras autenticarse, Microsoft redirige exactamente a:

```text
https://<host-productivo>:3548/auth/callback?code=...&state=...
```

Ese `code`:

- es temporal
- caduca rapido
- no puede reutilizarse

## Paso 6. `/auth/callback` valida CSRF en backend

La funcion `oauth_callback()` hace primero la validacion del `state`.

Compara el valor recibido contra:

- `session['oauth_state']`
- `_oauth_state_pop(state)`

Esto en produccion protege frente a callbacks no iniciados por la aplicacion y tambien tolera algunos problemas de perdida de cookie de sesion intermedia.

Si `state` no cuadra, el backend corta el flujo.

## Paso 7. El backend intercambia el `authorization code` por tokens

Si el callback es valido, DECOCAB usa la app MSAL productiva para cambiar el codigo por tokens.

La llamada real es:

```python
result = self._app.acquire_token_by_authorization_code(
    code=code,
    scopes=OAuthConfig.SCOPES,
    redirect_uri=effective_redirect_uri,
)
```

Esto ocurre dentro del wrapper `MSALApp.acquire_token_by_code()` de `api/oauth_config.py`.

En produccion este paso depende de tres cosas:

1. `client_id` correcto
2. `client_secret` correcto
3. `redirect_uri` exactamente igual a la registrada en Azure

Si cualquiera de esas tres falla, lo normal es ver errores como:

- `invalid_client`
- `invalid_grant`
- `redirect_uri_mismatch`

## Paso 8. El backend consulta Microsoft Graph para fijar la identidad del usuario

Con el `access_token` ya obtenido, DECOCAB llama a:

```text
GET https://graph.microsoft.com/v1.0/me
```

Esta llamada se hace en `api/graph_client.py`, en `get_user_info(access_token)`.

La app obtiene datos como:

- `id`
- `userPrincipalName`
- `mail`
- `displayName`

En produccion este paso es obligatorio porque la identidad valida para la aplicacion sale del token de Microsoft, no del frontend.

## Paso 9. DECOCAB crea una sesion propia de aplicacion

Despues del `GET /me`, el backend genera un `session_id` interno:

```python
session_id = secrets.token_urlsafe(32)
```

Ese `session_id` no es el token Microsoft. Es el identificador de sesion propio de DECOCAB.

Luego guarda metadata en `TokenCache.save_tokens(...)`:

- `session_id`
- `access_token`
- `user_id`
- `username`
- `home_account_id`
- expiracion del access token
- expiracion total de sesion

## Paso 10. Los tokens quedan persistidos en servidor

En produccion DECOCAB usa dos capas de persistencia:

### `PersistentMsalTokenCache`

- serializa a disco la cache interna de MSAL
- permite que MSAL recuerde cuentas y refresh tokens

### `TokenCache`

- enlaza el `session_id` del navegador con la identidad OAuth
- guarda expiraciones, usuario y `home_account_id`

La persistencia cuelga del directorio definido por `OAUTH_CACHE_DIR`, que en produccion apunta a `C:/ProgramData/DECOCAB/data/oauth`.

## Paso 11. El navegador solo recibe una cookie segura

Cuando el callback termina bien, el backend envia una cookie HTTP-only con el `session_id`.

La idea es esta:

```python
response.set_cookie(
    'decocab_oauth_session',
    session_id,
    httponly=True,
    secure=True,
    samesite='Lax',
)
```

Esto significa que en produccion el navegador no guarda:

- `access_token`
- `refresh_token`
- `client_secret`

Solo guarda el identificador de sesion de DECOCAB.

## Paso 12. Las rutas productivas usan `require_oauth_session`

Cada endpoint que necesita Outlook o Graph pasa por `require_oauth_session`.

Ese decorador hace este trabajo:

1. Lee `session_id` desde la cookie.
2. Busca la sesion asociada en `TokenCache`.
3. Si hay token aun valido, lo usa.
4. Si el token esta cerca de expirar o ya expiro, intenta renovarlo con `acquire_token_silent(session_id)`.
5. Si la renovacion funciona, actualiza el cache.
6. Inyecta en `flask.g`:
   - `g.session_id`
   - `g.access_token`
   - `g.user_id`
7. Deja continuar al endpoint.

Esto es lo que hace que en produccion el usuario no tenga que autenticarse en cada llamada a Outlook.

## Paso 13. Outlook se consume via Microsoft Graph desde backend

DECOCAB no habla con Outlook desde Javascript del navegador.

Lo que hace es:

1. El frontend llama a endpoints propios de la app.
2. El backend valida la sesion OAuth.
3. El backend usa `g.access_token` para llamar a Graph.
4. El backend devuelve al frontend solo el resultado funcional.

En `api/graph_client.py` aparecen operaciones como:

- `get_user_info()` sobre `/me`
- `list_messages()` sobre `/me/messages`
- `list_unread_messages()` sobre `/me/messages`
- `send_mail()` sobre `/me/sendMail`

Ese es el motivo por el que hablamos de login de Outlook: la identidad Microsoft obtenida en produccion se usa para operar con el correo del usuario.

## Paso 14. Logout en produccion

La ruta `/auth/logout` hace estas dos cosas:

1. invalida la sesion server-side borrando el `session_id` del `TokenCache`
2. borra la cookie HTTP-only del navegador

Despues redirige a `OAUTH_POST_LOGOUT_REDIRECT_URI`.

## Como es la conexion TLS saliente a Microsoft en produccion

Este punto es importante en DECOCAB porque la red corporativa puede interceptar TLS.

En produccion el proyecto prioriza este comportamiento:

1. intenta usar `OAUTH_CA_BUNDLE` si se ha configurado explicitamente
2. si no, limpia bundles heredados que puedan interferir
3. activa `truststore` para usar el almacen Windows del servidor
4. si eso falla, cae a `certifi`

Con `.env.production`, la opcion activa es:

```env
OAUTH_USE_SYSTEM_TRUST_STORE=1
```

Eso significa que el servidor confia en la CA corporativa instalada por IT en Windows. Es la forma correcta de salir hacia:

- `login.microsoftonline.com`
- `graph.microsoft.com`

sin depender de un bundle PEM creado en otra maquina.

## Como replica el arranque productivo

En produccion, segun `.env.production`, el servidor arranca con:

- `HOST=0.0.0.0`
- `PORT=3548`
- `APP_ENV=production`
- `AUTO_GENERATE_SSL_CERT=0`

Eso implica:

- escucha en todas las interfaces del servidor
- usa el puerto 3548
- corre en modo productivo
- espera certificados reales ya desplegados junto al binario o servidor

En el propio archivo de entorno hay una nota operativa importante:

1. copiar `.env.production` junto a `API_DECOCAB.exe`
2. copiar tambien `cert.pem` y `key.pem` emitidos por la CA interna EMESA
3. no copiar claves raiz privadas al servidor

## Condiciones que deben cumplirse para que funcione en produccion

Para replicar este flujo en otro proyecto productivo necesitas cumplir todo esto:

1. La App Registration de Azure debe tener registrada la `Redirect URI` exacta del servidor.
2. El servidor debe publicar HTTPS con un certificado confiable para los clientes.
3. El servidor debe confiar en la cadena TLS saliente hacia Microsoft.
4. El backend debe usar `ConfidentialClientApplication`.
5. Los tokens deben guardarse server-side, no en navegador.
6. Debe existir un directorio persistente para cache OAuth.
7. Las rutas que consumen Graph deben pasar por un middleware o decorador que renueve el token silenciosamente.

## Como replicarlo en otro proyecto solo para produccion

## Paso A. Registrar la aplicacion en Azure pensando en el host real

Debes crear una App Registration con:

1. `Client ID`
2. `Client Secret`
3. permisos Graph adecuados
4. `Redirect URI` exacta productiva, por ejemplo:

```text
https://mi-servidor-empresa:3548/auth/callback
```

## Paso B. Preparar el servidor productivo

Necesitas:

1. certificado HTTPS real para la web
2. clave privada asociada
3. confianza de clientes hacia ese certificado
4. confianza del servidor hacia Microsoft y su proxy corporativo si existe

## Paso C. Configurar variables de entorno productivas

Define al menos:

```env
APP_ENV=production
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
OAUTH_TENANT_ID=...
OAUTH_AUTHORITY=https://login.microsoftonline.com/...
OAUTH_REDIRECT_URI=https://mi-servidor:3548/auth/callback
OAUTH_POST_LOGOUT_REDIRECT_URI=https://mi-servidor:3548/
OAUTH_SCOPES=https://graph.microsoft.com/.default
OAUTH_CACHE_DIR=C:/ProgramData/MiApp/data/oauth
OAUTH_USE_SYSTEM_TRUST_STORE=1
SESSION_SECRET=...
HOST=0.0.0.0
PORT=3548
AUTO_GENERATE_SSL_CERT=0
```

## Paso D. Implementar backend OAuth server-side

Tu backend debe tener:

1. un modulo de configuracion OAuth
2. una instancia `msal.ConfidentialClientApplication`
3. rutas `/auth/login`, `/auth/callback` y `/auth/logout`
4. cache persistente de MSAL
5. indice propio de sesiones por `session_id`

## Paso E. Usar solo cookie HTTP-only en navegador

En produccion, no expongas el token a Javascript. El navegador solo debe recibir el `session_id` de la app.

## Paso F. Llamar a Graph solo desde backend

Para replicar el patron de DECOCAB, todo acceso a Outlook debe salir del backend usando el token asociado al usuario autenticado.

## Errores mas frecuentes en produccion

### `redirect_uri_mismatch`

La `redirect_uri` configurada en el backend no coincide exactamente con la registrada en Azure.

### `invalid_client`

El `client_secret` o el `client_id` no son validos en el servidor desplegado.

### `invalid_grant`

El `authorization code` expiro o ya se uso.

### Error SSL hacia Microsoft

El servidor no confia en la CA corporativa del proxy o la configuracion TLS saliente no esta bien preparada.

### Callback al host equivocado

La app avisa en logs si `OAUTH_REDIRECT_URI` apunta a otro host distinto del servidor real. En produccion eso suele indicar DNS antiguo, IP cambiada o configuracion desactualizada.

## Validacion minima antes de ponerlo en marcha

Antes de dar por buena la replica productiva, revisa esto:

1. Ejecutar un validador como `python validate_oauth.py`.
2. Confirmar que el host HTTPS abre correctamente desde cliente.
3. Confirmar que la App Registration tiene la URI exacta del callback.
4. Hacer login real contra Microsoft.
5. Verificar que `/auth/callback` recibe `code` y `state`.
6. Verificar que `GET /me` devuelve el usuario correcto.
7. Verificar que se crea la cookie de sesion de aplicacion.
8. Verificar que los ficheros de cache aparecen en `OAUTH_CACHE_DIR`.
9. Verificar que una ruta protegida puede renovar token sin pedir login otra vez.

## Resumen final

En produccion, DECOCAB replica el login de Outlook con este patron:

1. web HTTPS publica
2. callback fijo registrado en Azure
3. MSAL confidencial en backend
4. intercambio de codigo por token en servidor
5. identificacion del usuario con `GET /me`
6. sesion propia con cookie HTTP-only
7. tokens persistidos solo en servidor
8. renovacion silenciosa antes de acceder a Graph
9. consumo de Outlook exclusivamente desde backend

Si replicas esas nueve decisiones en otro proyecto, estaras replicando el modelo productivo real de DECOCAB y no una version simplificada de desarrollo.