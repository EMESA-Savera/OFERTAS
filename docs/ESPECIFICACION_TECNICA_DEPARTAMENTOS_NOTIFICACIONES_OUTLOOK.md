# Especificacion Tecnica: Departamentos, Notificaciones y Outlook

## Objetivo

Implementar en el proyecto destino un flujo de trabajo con:

1. Catalogo central de departamentos.
2. Usuarios configurables del modulo con email y departamento.
3. Estados asociados a departamento.
4. Cambio de estado con seleccion manual de destinatario.
5. Trazabilidad de notificaciones.
6. Primera fase Outlook sin envio automatico obligatorio.

## Decisiones funcionales cerradas

Aplicar estas reglas salvo que el proyecto destino indique otra cosa:

1. Un usuario pertenece a un solo departamento.
2. Un estado pertenece a un solo departamento.
3. Hay un solo destinatario manual por cambio de estado.
4. El cambio de estado puede completarse sin envio de correo.
5. El email funcional vive en la tabla propia del modulo, no solo en `General.Usuarios`.
6. La primera iteracion abre borrador o accion Outlook, pero no exige envio automatico real.

## SQL: tablas a crear o modificar

## 1. Crear `ofertas.Departamentos`

Campos minimos:

1. `Id_departamento` `int identity primary key`
2. `Descripcion` `nvarchar(150)` not null
3. `Activo` `bit` not null default `1`
4. `Orden` `int` not null default `0`

Restricciones recomendadas:

1. `unique` sobre `Descripcion`
2. indice por `Activo, Orden`

SQL orientativo:

```sql
CREATE TABLE ofertas.Departamentos (
    Id_departamento INT IDENTITY(1,1) PRIMARY KEY,
    Descripcion NVARCHAR(150) NOT NULL,
    Activo BIT NOT NULL CONSTRAINT DF_Departamentos_Activo DEFAULT (1),
    Orden INT NOT NULL CONSTRAINT DF_Departamentos_Orden DEFAULT (0),
    CONSTRAINT UQ_Departamentos_Descripcion UNIQUE (Descripcion)
);

CREATE INDEX IX_Departamentos_Activo_Orden
    ON ofertas.Departamentos (Activo, Orden, Descripcion);
```

## 2. Ampliar `ofertas.Usuarios_Asignables`

Campos a añadir si no existen:

1. `Email` `nvarchar(255)` null
2. `Id_departamento` `int` null

Mantener o reutilizar:

1. `Num_operario` o identificador equivalente
2. `Es_asignable`
3. `Rol`

Restricciones recomendadas:

1. `foreign key` a `ofertas.Departamentos(Id_departamento)`
2. indice por `Id_departamento, Es_asignable`

SQL orientativo:

```sql
ALTER TABLE ofertas.Usuarios_Asignables
ADD Email NVARCHAR(255) NULL,
    Id_departamento INT NULL;

ALTER TABLE ofertas.Usuarios_Asignables
ADD CONSTRAINT FK_Usuarios_Asignables_Departamentos
    FOREIGN KEY (Id_departamento) REFERENCES ofertas.Departamentos (Id_departamento);

CREATE INDEX IX_Usuarios_Asignables_Departamento_Asignable
    ON ofertas.Usuarios_Asignables (Id_departamento, Es_asignable);
```

## 3. Ampliar `ofertas.Estados`

Campo a añadir:

1. `Id_departamento` `int` null

Restricciones recomendadas:

1. `foreign key` a `ofertas.Departamentos(Id_departamento)`
2. indice por `Id_departamento`

SQL orientativo:

```sql
ALTER TABLE ofertas.Estados
ADD Id_departamento INT NULL;

ALTER TABLE ofertas.Estados
ADD CONSTRAINT FK_Estados_Departamentos
    FOREIGN KEY (Id_departamento) REFERENCES ofertas.Departamentos (Id_departamento);

CREATE INDEX IX_Estados_Departamento
    ON ofertas.Estados (Id_departamento);
```

## 4. Crear `ofertas.Outlook_Notificaciones`

Campos minimos:

1. `Id_notificacion` `bigint identity primary key`
2. `Id_oferta` `int` not null
3. `Id_estado_origen` `int` null
4. `Id_estado_destino` `int` not null
5. `Id_usuario_destinatario` `int` null
6. `Email_destinatario` `nvarchar(255)` null
7. `Fecha_intento` `datetime2` not null
8. `Resultado` `nvarchar(50)` not null
9. `Detalle_error` `nvarchar(max)` null
10. `Modo_envio` `nvarchar(50)` not null
11. `Usuario_accion` `nvarchar(100)` null

Valores iniciales recomendados para `Modo_envio`:

1. `sin_envio`
2. `mailto`
3. `borrador_outlook`
4. `graph`
5. `fallido`

SQL orientativo:

```sql
CREATE TABLE ofertas.Outlook_Notificaciones (
    Id_notificacion BIGINT IDENTITY(1,1) PRIMARY KEY,
    Id_oferta INT NOT NULL,
    Id_estado_origen INT NULL,
    Id_estado_destino INT NOT NULL,
    Id_usuario_destinatario INT NULL,
    Email_destinatario NVARCHAR(255) NULL,
    Fecha_intento DATETIME2 NOT NULL CONSTRAINT DF_Outlook_Notificaciones_Fecha DEFAULT (SYSUTCDATETIME()),
    Resultado NVARCHAR(50) NOT NULL,
    Detalle_error NVARCHAR(MAX) NULL,
    Modo_envio NVARCHAR(50) NOT NULL,
    Usuario_accion NVARCHAR(100) NULL
);

CREATE INDEX IX_Outlook_Notificaciones_Oferta_Fecha
    ON ofertas.Outlook_Notificaciones (Id_oferta, Fecha_intento DESC);
```

## Endpoints: crear o modificar

## 1. Departamentos

### `GET /api/departamentos`

Debe devolver el catalogo completo ordenado por `Orden`.

Respuesta orientativa:

```json
{
  "success": true,
  "departamentos": [
    {
      "id_departamento": 1,
      "descripcion": "Compras",
      "activo": true,
      "orden": 10
    }
  ]
}
```

### `POST /api/departamentos`

Entrada minima:

```json
{
  "descripcion": "Compras",
  "activo": true,
  "orden": 10
}
```

### `PUT /api/departamentos/<id>`

Debe permitir edicion simple de descripcion, activo y orden.

### `DELETE /api/departamentos/<id>`

Solo si el proyecto permite borrado fisico. Si no, usar desactivacion logica.

## 2. Usuarios del modulo

## `GET /api/usuarios`

Debe dejar de filtrar por el rol externo `Dpto. Comercial`.

Debe soportar dos necesidades:

1. Listado de usuarios ya dados de alta en OFERTAS.
2. Datos suficientes para configurar `email`, `departamento`, `es_asignable` y `rol`.

Respuesta minima orientativa:

```json
{
  "success": true,
  "usuarios": [
    {
      "num_operario": 123,
      "nombre": "Ana Perez",
      "email": "ana.perez@empresa.com",
      "id_departamento": 2,
      "departamento": "Tecnico",
      "es_asignable": true,
      "rol": "Responsable"
    }
  ]
}
```

## `POST /api/usuarios`

Debe crear o completar la fila funcional en `ofertas.Usuarios_Asignables`.

Entrada minima:

```json
{
  "num_operario": 123,
  "email": "ana.perez@empresa.com",
  "id_departamento": 2,
  "es_asignable": true,
  "rol": "Responsable"
}
```

## `PUT /api/usuarios/<id>`

Debe actualizar configuracion funcional del modulo.

## `DELETE /api/usuarios/<id>`

Si no se borra fisicamente, desactivar la fila del modulo.

## 3. Estados

## `GET /api/estados`

Debe incluir:

1. `id_departamento`
2. `departamento` o descripcion equivalente

Respuesta minima orientativa:

```json
{
  "success": true,
  "estados": [
    {
      "id_estado": 5,
      "descripcion_estado": "Revision tecnica",
      "orden": 30,
      "id_departamento": 2,
      "departamento": "Tecnico"
    }
  ]
}
```

## `POST /api/estados`

Debe aceptar `id_departamento`.

## `PUT /api/estados/<id>`

Debe aceptar `id_departamento`.

## 4. Cambio de estado

## `POST /api/ofertas/<id>/estado`

Mantener la persistencia existente y ampliar el payload con:

```json
{
  "id_estado": 7,
  "fecha_estado": "2026-05-25",
  "comentario": "Presupuesto enviado a revision",
  "id_usuario_destinatario": 123,
  "email_destinatario": "ana.perez@empresa.com",
  "enviar_correo": true,
  "modo_envio": "mailto"
}
```

Reglas backend:

1. Si `enviar_correo` es `false`, la transicion se guarda igualmente.
2. Si se informa destinatario, persistirlo tambien como snapshot en `email_destinatario`.
3. Insertar siempre una fila en `ofertas.Outlook_Notificaciones` con el resultado del intento o de la omision.

## 5. Historial de notificaciones opcional

### `GET /api/ofertas/<id>/notificaciones`

Opcional, util si el proyecto necesita mostrar trazabilidad en la ficha de oferta.

## Pantallas: cambios a implementar

## 1. Inicio > Configuracion

Checklist:

1. Añadir tarjeta `Departamentos`.
2. Mantener mismo patron visual de tarjetas ya existente.
3. Cargar catalogos compartidos al entrar en Configuracion.

## 2. Vista de Departamentos

Checklist:

1. Listado ordenado por `Orden`.
2. Alta rapida.
3. Edicion simple.
4. Activar o desactivar.
5. Reordenar o editar orden manualmente.

## 3. Vista de Usuarios

Separar en dos modos o pestañas.

### `Crear usuario`

Checklist:

1. Buscar en `General.Usuarios` sin filtrar por `Dpto. Comercial`.
2. Seleccionar usuario.
3. Crear o completar su fila en `ofertas.Usuarios_Asignables`.

### `Configurar usuarios`

Checklist:

1. Mostrar solo usuarios ya dados de alta en OFERTAS.
2. Editar `departamento`.
3. Editar `email`.
4. Editar `asignable`.
5. Editar `rol`.
6. Mantener el filtro funcional por `es_asignable` para selects de asignacion.

## 4. Vista de Estados

Checklist:

1. Añadir campo `Departamento` en alta.
2. Añadir campo `Departamento` en edicion.
3. Mostrar columna `Departamento` en listado.
4. Mantener separada la configuracion de columnas de oferta.

## 5. Modal de cambio de estado

Checklist:

1. Mantener campos existentes de estado, fecha y comentario.
2. Al elegir estado destino, resolver su departamento.
3. Cargar usuarios del departamento con email valido.
4. Mostrar selector manual de destinatario.
5. Mostrar opcion `sin enviar correo`.
6. Preparar asunto y cuerpo sugeridos si se usa Outlook o `mailto:`.

## Orden de implementacion recomendado

1. Crear y migrar tablas SQL.
2. Ampliar `GET /api/estados` y `GET /api/usuarios`.
3. Crear CRUD de `departamentos`.
4. Refactorizar pantalla de usuarios en `Crear` y `Configurar`.
5. Añadir `departamento` a mantenimiento de estados.
6. Ampliar modal y endpoint de cambio de estado.
7. Registrar trazabilidad de notificaciones.
8. Solo despues, conectar con Outlook real si sigue siendo necesario.

## Pruebas minimas de aceptacion

## SQL y datos

1. Se puede crear un departamento activo con orden.
2. Un usuario de OFERTAS puede quedar asociado a un departamento y email.
3. Un estado puede quedar asociado a un departamento.
4. Se inserta una fila en `Outlook_Notificaciones` tras un cambio de estado.

## API

1. `GET /api/departamentos` devuelve catalogo ordenado.
2. `GET /api/usuarios` ya no depende del filtro `Dpto. Comercial`.
3. `GET /api/estados` devuelve `id_departamento`.
4. `POST /api/ofertas/<id>/estado` acepta destinatario y `modo_envio`.

## UI

1. Configuracion muestra la tarjeta `Departamentos`.
2. Usuarios permite crear desde `General.Usuarios` y luego configurar.
3. Estados permite asignar departamento.
4. El modal de cambio de estado ofrece destinatarios del departamento del estado destino.
5. El usuario puede continuar sin correo.

## Outlook: alcance de primera fase

Implementar primero una opcion segura:

1. Construir asunto y cuerpo en backend o frontend.
2. Mostrar confirmacion al usuario.
3. Ofrecer `mailto:` o `Abrir en Outlook`.
4. Registrar si se intento abrir, si se omitio o si fallo.

No meter en primera fase:

1. Seleccion automatica de destinatario.
2. Envio corporativo real por Graph sin definir infraestructura.
3. Automatizacion local con dependencias de escritorio si el entorno no esta cerrado.