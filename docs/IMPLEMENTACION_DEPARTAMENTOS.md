# Implementación de Sistema de Departamentos

## Resumen de Cambios

Se ha implementado un sistema completo de gestión de departamentos para el OFERTAS con enrutamiento departamental de estados. El sistema permite:

- Crear y gestionar departamentos
- Asignar usuarios a múltiples departamentos
- Asociar estados a departamentos específicos
- Cargar departamentos del usuario en el login

## Cambios en Base de Datos

### 1. Ejecutar Migración SQL

**Archivo:** `sql/MIGRACION_DEPARTAMENTOS.sql`

Este script debe ejecutarse EN LA NUEVA BBDD (172.16.10.10, DataLakeSCCZ) para crear:

```sql
-- Nuevas tablas:
- ofertas.Departamentos (Id_departamento, Nombre_departamento, etc.)
- ofertas.Usuarios_Departamentos (relación M:N entre usuarios y departamentos)

-- Modificaciones:
- ALTER ofertas.Estados ADD Id_departamento FK

-- Datos iniciales:
- Inserción automática de 4 departamentos base:
  - Compras
  - Ventas
  - Técnico
  - Administración
```

**Pasos de ejecución:**

```powershell
# Abrir SQL Server Management Studio o Azure Data Studio
# Conectar a: 172.16.10.10, usuario: sccz, contraseña: S@vera,CZ,2024
# Abrir archivo: sql/MIGRACION_DEPARTAMENTOS.sql
# Ejecutar (F5 o Click en Execute)
```

## Cambios en API (api/app_ofertas.py)

### Modificaciones Existentes

#### 1. Función `get_user_departments(cursor, num_operario)` - NUEVA

```python
def get_user_departments(cursor, num_operario):
    """
    Obtiene los departamentos asignados a un usuario.
    Retorna lista de departamentos con Id_departamento, Nombre_departamento, etc.
    """
```

**Uso:** Se llama automáticamente durante el login

#### 2. Endpoint `/api/login` - MODIFICADO

**Cambios:**
- Ahora carga los departamentos del usuario durante la autenticación
- El login retorna un campo `"departamentos": [...]` con la lista de departamentos del usuario
- Los departamentos se guardan en la sesión del usuario

**Request:**
```json
{
  "usuario": "123",
  "password": "password"
}
```

**Response (Ejemplo):**
```json
{
  "id": 1,
  "num_operario": 123,
  "usuario": 123,
  "nombre": "Juan García",
  "nivel": 2,
  "rol": "Gerente",
  "read_only": false,
  "departamentos": [
    {
      "id_departamento": 1,
      "nombre_departamento": "Compras",
      "descripcion": "Departamento de Compras",
      "estado_activo": true
    },
    {
      "id_departamento": 2,
      "nombre_departamento": "Administración",
      "descripcion": "Departamento de Administración",
      "estado_activo": true
    }
  ],
  "success": true
}
```

#### 3. Endpoint `/api/estados` GET - MODIFICADO

**Cambios:**
- Ahora retorna los campos `id_departamento` y `nombre_departamento` para cada estado
- Permite filtrar estados por departamento en el frontend

**Response (Ejemplo):**
```json
{
  "success": true,
  "estados": [
    {
      "id_estado": 1,
      "descripcion_estado": "Pendiente",
      "orden": 1,
      "total_ofertas": 45,
      "id_departamento": null,
      "nombre_departamento": ""
    },
    {
      "id_estado": 2,
      "descripcion_estado": "En Proceso - Compras",
      "orden": 2,
      "total_ofertas": 23,
      "id_departamento": 1,
      "nombre_departamento": "Compras"
    }
  ]
}
```

#### 4. Endpoint `/api/estados` POST - MODIFICADO

**Cambios:**
- Acepta un campo `id_departamento` opcional
- Permite crear un estado asignado a un departamento específico

**Request (Ejemplo):**
```json
{
  "descripcion_estado": "Revisión Técnica",
  "orden": 3,
  "id_departamento": 3
}
```

#### 5. Endpoint `/api/estados/<id>` PUT - MODIFICADO

**Cambios:**
- Acepta un campo `id_departamento` para actualizar la asignación
- Permite reasignar un estado a otro departamento

**Request (Ejemplo):**
```json
{
  "descripcion_estado": "Revisión Técnica Actualizado",
  "orden": 3,
  "id_departamento": 3
}
```

### Nuevos Endpoints - Departamentos

#### 1. GET `/api/departamentos` - Listar todos

**Description:** Obtiene lista completa de departamentos

**Response:**
```json
{
  "success": true,
  "departamentos": [
    {
      "id_departamento": 1,
      "nombre_departamento": "Compras",
      "descripcion": "Departamento de Compras y Adquisiciones",
      "estado_activo": true,
      "fecha_creacion": "2026-04-29T10:15:30"
    }
  ]
}
```

#### 2. POST `/api/departamentos` - Crear nuevo

**Request:**
```json
{
  "nombre_departamento": "Nuevo Departamento",
  "descripcion": "Descripción del departamento"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Departamento creado correctamente",
  "departamento": {
    "id_departamento": 5,
    "nombre_departamento": "Nuevo Departamento",
    "descripcion": "Descripción del departamento",
    "estado_activo": true,
    "fecha_creacion": "2026-04-29T10:20:00"
  }
}
```

#### 3. PUT `/api/departamentos/<id>` - Actualizar

**Request:**
```json
{
  "nombre_departamento": "Nombre Actualizado",
  "descripcion": "Nueva descripción",
  "estado_activo": true
}
```

### Nuevos Endpoints - Usuario-Departamento (Asignaciones)

#### 1. GET `/api/usuarios-departamentos/<num_operario>` - Obtener departamentos de usuario

**Response:**
```json
{
  "success": true,
  "num_operario": 123,
  "departamentos": [
    {
      "id_departamento": 1,
      "nombre_departamento": "Compras",
      "descripcion": "...",
      "estado_activo": true
    }
  ]
}
```

#### 2. POST `/api/usuarios-departamentos` - Asignar usuario a departamento

**Request:**
```json
{
  "num_operario": 123,
  "id_departamento": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario asignado al departamento correctamente"
}
```

#### 3. DELETE `/api/usuarios-departamentos/<num_operario>/<id_departamento>` - Desasignar

**Response:**
```json
{
  "success": true,
  "message": "Usuario desasignado del departamento correctamente"
}
```

## Flujo de Implementación

### Paso 1: Ejecutar Migración SQL ✅

```powershell
# En SQL Server Management Studio
# Conectarse a 172.16.10.10, DataLakeSCCZ
# Ejecutar archivo: sql/MIGRACION_DEPARTAMENTOS.sql
```

### Paso 2: Asignar Usuarios a Departamentos

```bash
# Ejemplo: Asignar usuario 123 a departamento "Compras" (id=1)
POST /api/usuarios-departamentos
{
  "num_operario": 123,
  "id_departamento": 1
}
```

O directamente en SQL Server:

```sql
INSERT INTO ofertas.Usuarios_Departamentos (Num_operario, Id_departamento)
VALUES (123, 1);  -- Usuario 123 -> Departamento Compras
```

### Paso 3: Crear Estados Departamentales

```bash
# Crear estado asignado al departamento "Compras"
POST /api/estados
{
  "descripcion_estado": "Pendiente - Compras",
  "orden": 2,
  "id_departamento": 1
}
```

### Paso 4: Verificar Login

1. Abrir la aplicación
2. Login con un usuario asignado a departamentos
3. Verificar que el login retorna los departamentos en la respuesta
4. Verificar que los estados con departamento asignado aparecen en la lista

## Verificación de Cambios

### Test 1: Migración SQL

```sql
-- Verificar que las tablas existen
SELECT * FROM ofertas.Departamentos;
SELECT * FROM ofertas.Usuarios_Departamentos;

-- Verificar columna en Estados
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ofertas' AND TABLE_NAME = 'Estados' 
AND COLUMN_NAME = 'Id_departamento';
```

### Test 2: Login con Departamentos

```bash
# Request
POST http://localhost:3010/api/login
{
  "usuario": "123",
  "password": "password123"
}

# Response debe incluir:
# {
#   ...
#   "departamentos": [
#     {"id_departamento": 1, "nombre_departamento": "Compras", ...}
#   ]
# }
```

### Test 3: Estados con Departamentos

```bash
# Request
GET http://localhost:3010/api/estados

# Response debe incluir:
# "id_departamento": 1,
# "nombre_departamento": "Compras"
```

## Próximos Pasos (Frontend)

1. **Mostrar departamentos en la UI de usuario**
   - Actualizar pantalla de perfil para mostrar departamentos asignados

2. **Filtrar estados por departamento (OPCIONAL)**
   - Permitir usuarios ver solo estados de sus departamentos
   - O mostrar todos pero resaltar los de su departamento

3. **Gestión de departamentos (Admin)**
   - Crear interfaz para gestionar departamentos
   - Crear interfaz para asignar usuarios a departamentos
   - Crear interfaz para asignar estados a departamentos

4. **Validación de departamentos en ofertas**
   - Cuando un usuario cambia el estado de una oferta, validar que el nuevo estado pertenece a uno de sus departamentos (OPCIONAL)

## Reconstrucción del Ejecutable

Una vez validados todos los cambios:

```powershell
cd C:\Proyectos\OFERTAS_prueba
python -m PyInstaller ofertaslectura.spec --clean
# Resultado: dist/ofertaslectura.exe (actualizado con los nuevos endpoints)
```

## Tabla Resumen de Cambios

| Elemento | Tipo | Acción |
|----------|------|--------|
| `ofertas.Departamentos` | Tabla | Creada (NEW) |
| `ofertas.Usuarios_Departamentos` | Tabla | Creada (NEW) |
| `ofertas.Estados.Id_departamento` | Columna | Agregada (MODIFIED) |
| `/api/login` | Endpoint | Modificado (retorna departamentos) |
| `/api/estados` GET | Endpoint | Modificado (incluye departamento) |
| `/api/estados` POST | Endpoint | Modificado (acepta id_departamento) |
| `/api/estados/<id>` PUT | Endpoint | Modificado (acepta id_departamento) |
| `/api/departamentos` GET | Endpoint | Creado (NEW) |
| `/api/departamentos` POST | Endpoint | Creado (NEW) |
| `/api/departamentos/<id>` PUT | Endpoint | Creado (NEW) |
| `/api/usuarios-departamentos/<id>` GET | Endpoint | Creado (NEW) |
| `/api/usuarios-departamentos` POST | Endpoint | Creado (NEW) |
| `/api/usuarios-departamentos/<id>/<dept_id>` DELETE | Endpoint | Creado (NEW) |
| `get_user_departments()` | Función | Creada (NEW) |

## Notas Importantes

1. **Sin FK a General.Usuarios:** La tabla `Usuarios_Departamentos.Num_operario` NO tiene FK a `General.Usuarios` porque ésta está en una BBDD diferente. Se valida a nivel de aplicación.

2. **Retrocompatibilidad:** Estados SIN departamento asignado (Id_departamento = NULL) funcionan normalmente - no hay filtrado automático.

3. **Usuarios sin departamentos:** Un usuario sin departamentos asignados retorna lista vacía pero sigue siendo válido.

4. **Borrado en cascada:** Si se borra un departamento, los estados quedan con Id_departamento = NULL (NO se borran).

## Soporte y Troubleshooting

### Error: "Departamento no encontrado"
- Verificar que el Id_departamento existe en `ofertas.Departamentos`
- Ejecutar: `SELECT * FROM ofertas.Departamentos`

### Error: "El usuario ya está asignado a este departamento"
- Usuario ya tiene ese departamento asignado
- Usar DELETE para desasignar primero

### Los departamentos no aparecen en el login
- Verificar que el usuario tiene registros en `ofertas.Usuarios_Departamentos`
- Verificar que la migración SQL se ejecutó correctamente

---

**Fecha de implementación:** 29 de Abril de 2026
**Versión:** 1.0 - Sistema Básico de Departamentos
