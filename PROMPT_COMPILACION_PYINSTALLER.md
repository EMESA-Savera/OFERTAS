# Prompt para Compilar .EXE con PyInstaller Correctamente

Pasa este prompt a Copilot en el otro proyecto:

---

## Contexto
Necesito compilar un proyecto Python con PyInstaller (crear un .exe) correctamente incluyendo TODOS los archivos necesarios: archivos de datos (templates, static, etc.), certificados, configuraciones, y módulos que importa (especialmente para funcionalidades como email/Outlook, bases de datos, etc.).

El problema es que la compilación actual está incompleta:
- **No incluye archivos de datos** (templates HTML, archivos CSS, JSON, etc.)
- **No encuentra módulos de email/Outlook** cuando debería incluirlos
- **No es "one file"** - debería ser un ejecutable standalone con todo incluido
- **Falta importar librerías ocultas** que no se detectan automáticamente
- **No copia archivos necesarios** como certificados, configuraciones, o archivos de utilidad

## Solución: Archivo .spec correcto

Mi archivo `.spec` de PyInstaller funciona correctamente y está estructurado así:

```python
# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules

project_root = Path(SPECPATH)
app_script = project_root / "api" / "app_ofertas.py"  # AJUSTA A TU SCRIPT PRINCIPAL

# FUNCIÓN CRÍTICA: Recopila RECURSIVAMENTE todos los archivos de un directorio
def collect_tree(source, target):
    source_path = project_root / source
    if not source_path.exists():
        return []
    
    items = []
    for file_path in source_path.rglob("*"):  # rglob = recursivo
        if file_path.is_file():
            relative_parent = file_path.relative_to(source_path).parent
            destination = Path(target) / relative_parent
            items.append((str(file_path), str(destination).replace("\\", "/")))
    return items

# DATOS: Todos los directorios que necesitas en la compilación
datas = []
# AJUSTA ESTOS DIRECTORIOS A LOS QUE USES EN TU PROYECTO:
for source_dir in (
    "templates",           # HTML, Jinja2, etc.
    "static",             # CSS, JS, imágenes
    "sql",                # Scripts SQL
    "docs",               # Documentación
    "skills",             # Módulos de funcionalidad
    "tools",              # Utilidades
    "certificados_ofertas",  # Certificados SSL/TLS
    "Instalaccion_Manual_CA_Windows",  # Instaladores
    # AGREGA AQUÍ CUALQUIER OTRO DIRECTORIO CON DATOS:
    # "config", "data", "resources", etc.
):
    datas += collect_tree(source_dir, source_dir)

# ARCHIVOS INDIVIDUALES que necesitas
for single_file in (
    "requirements.txt",
    ".env.production",
    ".env.example",
    "README.md",
    # AGREGA AQUÍ OTROS ARCHIVOS:
    # "config.json", "credenciales.json", etc.
):
    file_path = project_root / single_file
    if file_path.exists():
        datas.append((str(file_path), "."))

# IMPORTACIONES OCULTAS: Librerías que PyInstaller NO detecta automáticamente
hiddenimports = []

# PARA EMAIL/OUTLOOK (CRÍTICO):
hiddenimports += collect_submodules("extract_msg")  # Para leer emails
hiddenimports += collect_submodules("msal")         # Microsoft Authentication Library
hiddenimports += collect_submodules("outlook")      # Si usas outlook

# PARA WEB/API:
hiddenimports += collect_submodules("flask")
hiddenimports += collect_submodules("flask_cors")
hiddenimports += collect_submodules("flask_session")

# PARA CONFIGURACIÓN:
hiddenimports += collect_submodules("dotenv")

# PARA BASE DE DATOS:
hiddenimports += collect_submodules("pyodbc")
hiddenimports += collect_submodules("sqlalchemy")  # Si usas SQLAlchemy

# PARA REQUESTS/HTTP:
hiddenimports += collect_submodules("requests")

# AGREGA AQUÍ OTRAS LIBRERÍAS QUE USES:
# hiddenimports += collect_submodules("nombre_libreria")

# ANÁLISIS Y COMPILACIÓN
a = Analysis(
    [str(app_script)],
    pathex=[str(project_root)],  # CRÍTICO: Asegura que encuentre todos los módulos
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    exclude_binaries=False,  # IMPORTANTE: Incluye TODOS los binarios
    name="nombre_de_tu_app",  # AJUSTA AL NOMBRE DESEADO
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,  # True si es app de consola, False si es GUI
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
```

## Pasos para arreglarlo en tu proyecto

1. **Identifica tu script principal**: ¿Cuál es el archivo Python que ejecuta tu app? (ej: `main.py`, `app.py`, etc.)

2. **Lista todos los directorios de datos**:
   - ¿Tienes `templates/`? ¿Tiene HTML con referencias a recursos?
   - ¿Tienes `static/`? ¿CSS, JS, imágenes?
   - ¿Tienes directorios de certificados?
   - ¿Tienes configs, datos, recursos especiales?
   - TODO ESTO debe estar en la sección `for source_dir in (...):`

3. **Identifica todas las librerías que importas**:
   - Especialmente: email, Outlook, MSAL, extract_msg, pyodbc, Flask, etc.
   - Si haces `import algo` en tu código, probablemente necesites: `hiddenimports += collect_submodules("algo")`

4. **Crea el archivo `.spec`** (o reemplaza el existente) con la configuración anterior, ajustando:
   - El nombre del script principal
   - Los directorios en `for source_dir in (...)`
   - Los archivos en `for single_file in (...)`
   - Las librerías en `hiddenimports`

5. **Compila con**:
   ```bash
   pyinstaller nombre_archivo.spec --clean
   ```
   O vía Python:
   ```bash
   python -m PyInstaller nombre_archivo.spec --clean
   ```

## Checklist de verificación

Después de compilar, verifica en `dist/`:
- [ ] Existe la carpeta `templates/` con todos tus HTML
- [ ] Existe la carpeta `static/` con CSS, JS, imágenes
- [ ] Existen tus certificados/configs
- [ ] El .exe ejecuta sin errores de módulos faltantes
- [ ] Puedes navegar a las rutas web sin errores 404
- [ ] El email/Outlook funciona sin "ModuleNotFoundError"

## Problemas comunes y soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| `ModuleNotFoundError: No module named 'x'` | Falta en `hiddenimports` | Agrega `hiddenimports += collect_submodules("x")` |
| `FileNotFoundError: templates/...` | Directorio no incluido en `datas` | Agrega el directorio a `for source_dir in (...)` |
| `No module named 'outlook'` o `extract_msg` | No incluidos | Agrega `collect_submodules("extract_msg")` y `collect_submodules("msal")` |
| El .exe es gigante | Incluyes demasiado | Usa `excludes=` para excluir paquetes innecesarios |
| `pathlib not found` | Path no correcta | Usa `pathex=[str(project_root)]` como en el ejemplo |

---

**Nota importante**: El problema más común es no incluir los directorios de datos (templates, static, certificados, etc.) o no agregar los `hiddenimports` correctos. Sigue este template exactamente y debería funcionar.
