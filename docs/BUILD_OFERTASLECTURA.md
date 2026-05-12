# Compilación de ofertaslectura.exe

Este directorio contiene la configuración para compilar **ofertaslectura.exe**, una versión especial del ejecutable OFERTAS que incluye soporte nativo para usuarios en modo solo lectura.

## Cambios Incluidos

### 1. Modo Solo Lectura para num_operario = 4

**Backend (api/app_ofertas.py):**
- Usuarios con `num_operario = 4` se marcan automáticamente como `read_only = true` en sesión
- Todos los endpoints de escritura (`POST`, `PUT`, `DELETE`) verifican este flag
- Si está activo, devuelven `403 Forbidden` con mensaje descriptivo

**Frontend (static/js/ofertas.js):**
- Detecta usuarios solo lectura y bloquea antes de ejecutar cualquier acción
- Desactiva automáticamente drag & drop de reordenación
- Bloquea importación de correos, guardar, editar, eliminar
- Muestra alerta al intentar cualquier acción de escritura

### 2. Traducciones Multiidioma Integradas

- **Español (es)**: Interfaz completa en español con traducción de errores de solo lectura
- **Inglés (en)**: Soporte completo en inglés
- **Checo (cs)**: Soporte completo en checo (alias: cz)

### 3. Sistema de Permisos Integrado

```python
# Backend: Identificación automática
READ_ONLY_OPERARIO_NUMBERS = {4}

# Se expone en respuesta de login:
{
    "id": 1,
    "num_operario": 4,
    "nombre": "Usuario Consulta",
    "read_only": true,  # Flag automático
    "success": true
}
```

## Cómo Compilar

### Opción 1: PowerShell (Recomendado)

```powershell
.\build-ofertaslectura.ps1
```

### Opción 2: CMD/Batch

```batch
build-ofertaslectura.bat
```

### Opción 3: Manual con PyInstaller

```bash
pyinstaller ofertaslectura.spec --clean
```

## Requisitos

- Python 3.7+
- PyInstaller: `pip install pyinstaller`
- Todas las dependencias en `requirements.txt`

## Salida

El compilador generará:
- **`dist/ofertaslectura.exe`** — El ejecutable principal (modo solo lectura habilitado)
- **`build/`** — Directorio temporal de compilación (se limpia automáticamente)

## Uso

Para iniciar el servidor:

```bash
.\dist\ofertaslectura.exe
```

La aplicación estará disponible en `http://localhost:3010` por defecto.

### Prueba Rápida de Solo Lectura

1. Inicia el ejecutable
2. Abre el navegador a `http://localhost:3010`
3. Login con `num_operario = 4` (si existe en BD)
4. Intenta:
   - Ver ofertas, clientes, estados → ✓ Permitido
   - Guardar una oferta → ✗ Bloqueado con alert
   - Editar un cliente → ✗ Bloqueado con alert
   - Eliminar un estado → ✗ Bloqueado con alert
   - Cambiar idioma → ✓ Permitido (es lectura)

## Diferencias con OFERTAS.exe

| Característica | OFERTAS.exe | ofertaslectura.exe |
|---|---|---|
| Usuario solo lectura (num_operario=4) | No | ✓ Sí |
| Traducción integrada | Sí | ✓ Sí |
| Funcionalidad completa | ✓ Sí | ✓ Sí |
| Size | ~150MB | ~150MB |

## Troubleshooting

### "PyInstaller no encontrado"
```bash
pip install pyinstaller
```

### "Error building..."
1. Asegurate de que `requirements.txt` está actualizado
2. Borra manualmente `build/` y `dist/`
3. Intenta nuevamente

### El .exe no inicia
1. Verifica la configuración de `.env`
2. Revisa los logs en `dist/`
3. Confirma que SQL Server/ODBC está disponible

## Contacto & Notas

- El spec `ofertaslectura.spec` es idéntico a `OFERTAS.spec` excepto por el nombre del ejecutable
- Los cambios de código están en:
  - `api/app_ofertas.py` (helpers de solo lectura)
  - `static/js/ofertas.js` (guards de UI)
  - `static/translations/*.json` (nuevas claves)
