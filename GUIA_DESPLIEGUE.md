# Guia de despliegue HTTPS por IP

## Objetivo

Servir cualquier aplicacion interna del departamento de Digitalizacion por HTTPS usando una CA interna propia y sin depender de una CA corporativa externa.

## Archivos que genera el paquete

- root_ca.key.pem: clave privada de la CA raiz
- root_ca.pem: certificado PEM de la CA raiz
- root_ca.cer: certificado DER/CER de la CA raiz para clientes Windows y Android
- cert.pem: certificado de servidor para la IP
- key.pem: clave privada del servidor
- cert_chain.pem: cadena completa del certificado del servidor

## Paso 1. Generar la CA y el certificado del servidor

```powershell
python .\generate_internal_ca.py --ip <IP_DE_LA_API> --out-dir .\salida
```

Proteccion incluida en el generador:

- Si `out-dir` ya contiene `root_ca.key.pem`, `root_ca.pem`, `root_ca.cer`, `cert.pem`, `key.pem` o `cert_chain.pem`, el script aborta.
- El motivo es evitar que una CA raiz nueva deje inservibles certificados ya desplegados y obligue a reinstalar la CA en todos los clientes.
- Solo usar `--force-overwrite` si se quiere reemplazar conscientemente la CA y el certificado previos.

Ejemplo forzado:

```powershell
python .\generate_internal_ca.py --ip <IP_DE_LA_API> --out-dir .\salida --force-overwrite
```

## Paso 2. Copiar el certificado del servidor a la API

Copiar estos dos archivos al servidor, junto al EXE o al directorio desde el que arranca la API:

- cert.pem
- key.pem

## Paso 3. Configurar la API

Mantener la configuracion publica de la aplicacion apuntando exactamente a la misma IP y puerto del certificado:

```text
OAUTH_REDIRECT_URI=https://<IP_DE_LA_API>:<PUERTO>/auth/callback
OAUTH_POST_LOGOUT_REDIRECT_URI=https://<IP_DE_LA_API>:<PUERTO>/
CORS_ALLOWED_ORIGINS=https://<IP_DE_LA_API>:<PUERTO>
AUTO_GENERATE_SSL_CERT=0
```

Si la aplicacion no usa OAuth o no dispone de una variable como `AUTO_GENERATE_SSL_CERT`, aplicar el mismo criterio a las variables equivalentes de URLs publicas y desactivacion de certificados autogenerados.

## Paso 4. Instalar la CA raiz en clientes Windows

Manual:

1. Copiar root_ca.cer al equipo cliente.
2. Abrir el archivo.
3. Instalar certificado.
4. Elegir Usuario actual o Equipo local.
5. Seleccionar Entidades de certificacion raiz de confianza.

PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\Instalaccion_Manual_CA_Windows\install_root_ca.ps1 -CertificatePath .\salida\root_ca.cer -StoreLocation CurrentUser
```

BAT recomendado para equipos de prueba:

```bat
Instalaccion_Manual_CA_Windows\install_root_ca_windows.bat
```

El BAT busca `root_ca.cer` junto al propio script o en `.\salida\root_ca.cer`, pregunta si quieres instalar en `CurrentUser` o `LocalMachine` y reutiliza `install_root_ca.ps1` por debajo.
Antes de instalar, elimina cualquier certificado previo del almacen `Root` con el mismo `Subject`, para evitar que quede una CA antigua con el mismo nombre visible.

Uso no interactivo:

```bat
Instalaccion_Manual_CA_Windows\install_root_ca_windows.bat "C:\ruta\root_ca.cer" CurrentUser
Instalaccion_Manual_CA_Windows\install_root_ca_windows.bat "C:\ruta\root_ca.cer" LocalMachine
```

## Paso 5. Instalar la CA raiz en Android

1. Copiar root_ca.cer al dispositivo.
2. Abrir Ajustes > Seguridad > Instalar certificado.
3. Elegir Certificado CA.
4. Seleccionar root_ca.cer.
5. Confirmar la instalación.

Paquete recomendado para entregar a usuarios de prueba:

```text
Instalaccion_Manual_CA_Android
```

Dentro incluye `root_ca.cer` y `README_ANDROID.md` con los pasos resumidos.

Nota: los navegadores suelen aceptar una CA de usuario instalada, pero algunas apps Android no confían en CAs de usuario si no están gestionadas por MDM.

## Validación final

1. Abrir https://<IP_DE_LA_API>:<PUERTO> desde un cliente.
2. Verificar que no aparece No seguro.
3. Ejecutar el flujo funcional completo de la aplicacion, incluido OAuth si aplica.
4. Confirmar que cualquier callback o retorno HTTPS vuelve sin errores de confianza ni timeout.

## Seguridad

- Guardar root_ca.key.pem fuera del servidor y con acceso restringido.
- No distribuir key.pem ni root_ca.key.pem a clientes.
- Si se cambia la CA raiz, hay que reinstalarla en todos los clientes.
- Regenerar una CA sobre la misma salida puede invalidar la cadena de confianza ya desplegada; tratarlo como una rotacion controlada, no como una operacion rutinaria.