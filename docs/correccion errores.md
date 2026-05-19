# Correccion de errores

## Contexto

Durante la revision del login de Microsoft y la conexion de Outlook aparecian varios fallos que, vistos desde el navegador, parecian un unico problema. En realidad habia varios errores distintos encadenados.

El efecto visible era este:

- el alta o login con Microsoft fallaba en produccion
- Outlook no quedaba conectado a la primera
- a veces el frontend mostraba errores poco claros
- en algunos entornos aparecia tambien el aviso de certificado o fallos SSL al salir hacia Microsoft

## Que pasaba realmente

### 1. El frontend recibia HTML 500 en vez de JSON

La ruta `GET /api/outlook/status` era consumida desde JavaScript esperando una respuesta JSON. Cuando el backend encontraba una excepcion no controlada, devolvia un error HTML 500 de Flask. Eso provocaba errores en cascada en el frontend porque intentaba parsear como JSON una pagina HTML.

### 2. La cache de token de Outlook podia quedar corrupta en sesion

El token cache de MSAL se guardaba en sesion bajo `outlook_token_cache`. Si ese valor llegaba corrupto o incompleto, `deserialize(...)` lanzaba una excepcion y la consulta del estado de Outlook terminaba en 500.

### 3. El login de Microsoft y Outlook no siempre devolvia errores legibles

Algunas rutas de autenticacion podian propagar excepciones internas hasta el navegador. El usuario acababa viendo un fallo generico o un comportamiento poco claro en vez de un mensaje util para reintentar o revisar configuracion.

### 4. El servidor tenia un problema real de confianza SSL saliente hacia Microsoft

Habia dos problemas de certificados diferentes:

- confianza del navegador cliente hacia la web de OFERTAS
- confianza del servidor de OFERTAS hacia Microsoft Graph y login.microsoftonline.com

El segundo era el relevante para Outlook. En produccion el entorno no confiaba siempre de forma correcta en la cadena usada por Microsoft, probablemente por combinacion de proxy corporativo, almacen de certificados y variables heredadas de CA bundle.

### 5. El certificado HTTPS realmente servido no coincidia con el esperado

Se comprobo que el certificado entregado por el servidor en produccion no era criptograficamente el mismo que el que habia en `certificados_ofertas`, aunque el subject y el issuer visibles parecieran coincidir. Eso podia hacer pensar que el despliegue estaba bien cuando en realidad el servidor estaba usando otra copia distinta.

### 6. El build no estaba empaquetando todos los recursos necesarios

El ejecutable de PyInstaller no incluia inicialmente algunos recursos operativos importantes, en especial:

- `certificados_ofertas`
- `Instalaccion_Manual_CA_Windows`

Eso hacia mas fragil el despliegue porque parte del comportamiento dependia de archivos externos dejados al lado del exe.

### 7. El primer login de Outlook podia perder el flujo OAuth guardado en sesion

Este era el ultimo fallo detectado. A la primera conexion con Outlook podia aparecer el mensaje de que la sesion habia caducado, pero al segundo intento funcionaba.

La causa mas probable era que, en el viaje de ida y vuelta del callback OAuth, el `auth flow` guardado en sesion no siempre estaba disponible en el primer regreso desde Microsoft. En ese caso el callback no encontraba el `state`/`flow` esperado y devolvia:

- `La sesion de autenticacion de Outlook ha caducado. Vuelve a intentarlo.`

## Como se ha solucionado

### 1. Se ha blindado `api/outlook/status`

Se actualizo la ruta para que devuelva JSON de forma consistente incluso cuando ocurre una excepcion inesperada. Con eso el frontend deja de romperse por intentar parsear HTML como JSON.

### 2. Se limpia automaticamente la cache de token corrupta

En `api/outlook_service.py` se modifico la lectura de `outlook_token_cache` para que, si el contenido no se puede deserializar, se elimine de sesion y Outlook pase a estado "no conectado" en vez de provocar un 500.

### 3. Se endurecieron las rutas de autenticacion

Las rutas de inicio y callback de Microsoft y Outlook ahora capturan mejor los errores y redirigen con mensajes legibles (`auth_error` y `outlook_error`) en lugar de dejar caer errores internos al navegador.

### 4. Se implemento una estrategia de TLS saliente mas robusta

Se adapto OFERTAS para que maneje mejor la confianza SSL hacia Microsoft:

- soporte de `truststore` para usar el almacen de certificados de Windows
- limpieza de variables heredadas como `REQUESTS_CA_BUNDLE`, `CURL_CA_BUNDLE`, `SSL_CERT_FILE` y `SSL_CERT_DIR` cuando interfieren
- soporte de `OAUTH_CA_BUNDLE`
- soporte de `OAUTH_AUTO_GENERATE_CA_BUNDLE`
- generacion automatica de bundle PEM combinando certificados de Windows, `certifi` y cadena observada en conexiones reales con Microsoft

Tambien se anadio el script:

- `scripts/fix_ssl_bundle.ps1`

Ese script genera el bundle de confianza saliente para Microsoft en:

- `C:\ProgramData\OFERTAS\certs\msft_outbound_ca_bundle.pem`

### 5. Se corrigio la prioridad de certificados en builds congelados

La resolucion de `SSL_CERT_FILE` y `SSL_KEY_FILE` se ajusto para que un build congelado priorice los certificados empaquetados dentro del propio exe cuando se usan rutas relativas, evitando reutilizar copias antiguas dejadas junto al ejecutable.

### 6. Se empaquetaron los recursos necesarios en PyInstaller

Se actualizo `ofertassavera_vReunion.spec` para incluir:

- `certificados_ofertas`
- `Instalaccion_Manual_CA_Windows`

De ese modo el exe es mas autosuficiente y el despliegue es menos propenso a inconsistencias por archivos sueltos.

### 7. Se corrigio el fallo del primer login de Outlook

En `api/outlook_service.py` se ha añadido un respaldo temporal en memoria del flujo OAuth usando el `state` como clave, con expiracion corta.

Funcionamiento del fix:

- al iniciar el login, el flujo OAuth se sigue guardando en sesion
- ademas, se guarda una copia temporal en cache servidor asociada al `state`
- cuando vuelve el callback de Microsoft, si la sesion no trae el flujo esperado, se intenta recuperarlo desde esa cache temporal
- si el `state` coincide, el login puede completarse igualmente en el primer intento

Con esto se evita el falso mensaje de sesion caducada cuando el primer callback pierde el `flow` en sesion pero el `state` sigue siendo valido.

## Resultado

Tras estas correcciones, el sistema queda mas estable en cuatro frentes:

- el frontend ya no se rompe por respuestas HTML inesperadas en las APIs de Outlook
- la autenticacion de Outlook tolera mejor caches corruptas y errores de primer acceso
- la salida SSL hacia Microsoft es mas robusta en entornos corporativos
- el ejecutable de produccion incluye mejor sus certificados y scripts auxiliares

## Archivos principales tocados

- `api/app_ofertas.py`
- `api/outlook_service.py`
- `.env.production`
- `requirements.txt`
- `scripts/fix_ssl_bundle.ps1`
- `ofertassavera_vReunion.spec`
- `Instalaccion_Manual_CA_Windows/install_root_ca.ps1`
- `Instalaccion_Manual_CA_Windows/install_root_ca_windows.bat`

## Nota final

Si despues de estas correcciones vuelve a fallar el login de Outlook en un entorno concreto, lo mas probable ya no es un fallo de codigo base sino una diferencia de despliegue: variables de entorno, certificado realmente servido, proxy corporativo, o bundle SSL no generado en esa maquina.