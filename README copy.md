# Certificado Digitalizacion HTTPS

Paquete independiente para montar HTTPS por IP con una CA interna propia para las aplicaciones del departamento de Digitalizacion de EMESA, sin mezclar utilidades de certificados dentro de un proyecto concreto.

## Contenido

- generate_internal_ca.py: genera la CA raiz y el certificado del servidor para una IP concreta.
- Instalaccion_Manual_CA_Windows/install_root_ca.ps1: instala la CA raiz en Windows.
- Instalaccion_Manual_CA_Windows/install_root_ca_windows.bat: lanzador simple para instalar root_ca.cer en otros equipos Windows.
- Instalaccion_Manual_CA_Android/README_ANDROID.md: guia corta para instalar root_ca.cer manualmente en Android.
- GUIA_DESPLIEGUE.md: procedimiento completo de despliegue y validacion.

## Uso rapido

```powershell
python .\generate_internal_ca.py --ip <IP_DE_LA_API> --out-dir .\salida
```

Si la carpeta de salida ya contiene `root_ca.*`, `cert.pem` o `key.pem`, el generador ahora aborta.
Eso evita regenerar una CA por accidente y dejar inservibles certificados ya desplegados o forzar a reinstalar la CA en clientes.

Solo sobrescribir de forma consciente:

```powershell
python .\generate_internal_ca.py --ip <IP_DE_LA_API> --out-dir .\salida --force-overwrite
```

Luego:

1. Copiar cert.pem y key.pem al servidor donde corre la API.
2. Instalar root_ca.cer en los clientes como CA raiz de confianza.
3. Mantener las URLs HTTPS, redirect URIs OAuth y CORS con la misma IP y puerto reales publicados por la aplicacion.

Para equipos Windows de prueba tambien puedes usar directamente el lanzador BAT:

```bat
Instalaccion_Manual_CA_Windows\install_root_ca_windows.bat
```

Si quieres forzar la instalacion indicando el archivo y el almacen:

```bat
Instalaccion_Manual_CA_Windows\install_root_ca_windows.bat "C:\ruta\root_ca.cer" CurrentUser
Instalaccion_Manual_CA_Windows\install_root_ca_windows.bat "C:\ruta\root_ca.cer" LocalMachine
```

El instalador elimina primero cualquier CA previa instalada con el mismo `Subject` y luego instala la CA correcta del paquete. Esto evita conflictos cuando existe otra raiz con el mismo nombre visible pero distinta huella.

Para Android, usa la carpeta:

```text
Instalaccion_Manual_CA_Android
```

Esa carpeta contiene `root_ca.cer` y una guia breve de instalacion manual.

## Seguridad

- root_ca.key.pem es la clave privada de la CA raiz. Guardarla fuera del servidor.
- Los clientes solo deben recibir root_ca.cer.
- No distribuir key.pem ni root_ca.key.pem a clientes.
- No regenerar la CA raiz sobre una salida existente salvo que se quiera reemplazar deliberadamente toda la confianza anterior.