---
name: departamentos-notificaciones-outlook
description: Implementar en otra aplicacion OFERTAS un flujo de departamentos, usuarios configurables del modulo, estados asociados a departamento, seleccion manual de destinatario al cambiar estado y trazabilidad de notificaciones con una primera fase Outlook sin envio automatico real. Usar cuando se quiera portar esta propuesta funcional a otra planta o repo paralelo.
---

# Departamentos, Notificaciones y Outlook por Estado

Esta skill traduce una propuesta funcional concreta a una especificacion portable para otro proyecto. No describe un sistema generico de RRHH ni una automatizacion Outlook completa. Documenta una variante pensada para OFERTAS con estas reglas de negocio:

1. Un usuario pertenece a un solo departamento.
2. Un estado pertenece a un solo departamento.
3. Al cambiar de estado, el destinatario del correo se elige manualmente.
4. La trazabilidad del intento de notificacion se guarda en base de datos.
5. La primera iteracion prepara la accion Outlook, pero no fuerza envio automatico real.

## Cuando usar esta skill

Usa esta skill cuando necesites cualquiera de estos objetivos:

1. Portar a otra planta un catalogo central de departamentos.
2. Separar la gestion de usuarios del modulo respecto a una tabla corporativa externa.
3. Asociar estados a departamentos para decidir destinatarios posibles.
4. Añadir un selector manual de destinatario al cambio de estado.
5. Registrar intentos de notificacion antes de integrar Outlook real.
6. Ejecutar una primera fase con borrador, `mailto:` o apertura de Outlook en lugar de envio automatico por Graph.

## Fuente de verdad en este repo

La propuesta parte de patrones que ya existen aqui y que conviene reutilizar parcialmente:

- Tarjetas de Configuracion en `templates/index.html`
- Mantenimiento de Estados en `templates/index.html` y `api/app_ofertas.py`
- Modal de cambio de estado en `templates/index.html`
- API de usuarios y tabla actual de configuracion en `api/app_ofertas.py`
- Filtro de usuarios asignables y cache frontend en `static/js/ofertas.js`
- Referencia previa de departamentos ya implementada, pero con otro modelo, en `docs/IMPLEMENTACION_DEPARTAMENTOS.md`
- Checklist tecnico portable en `docs/ESPECIFICACION_TECNICA_DEPARTAMENTOS_NOTIFICACIONES_OUTLOOK.md`

La referencia previa de departamentos no debe copiarse tal cual en este caso, porque alli se resuelve una relacion usuario-departamento multiple. Esta skill define otro contrato: un usuario, un departamento.

## Objetivo funcional exacto

El proyecto destino debe permitir:

1. Crear y ordenar departamentos desde Configuracion.
2. Configurar usuarios propios del modulo con `email`, `id_departamento`, `es_asignable` y `rol`.
3. Asociar cada estado a un departamento.
4. Al cambiar una oferta a un nuevo estado, cargar los usuarios configurados del departamento del estado destino.
5. Permitir elegir manualmente un destinatario con email o marcar que no se envia correo.
6. Guardar la transicion de estado como ahora y, ademas, registrar una traza de notificacion.
7. Preparar una primera integracion Outlook basada en borrador o apertura asistida, dejando el envio automatico real para una fase posterior.

## Modelo de datos recomendado

### Tabla `ofertas.Departamentos`

Catalogo central compartido por Estados y Usuarios.

Campos minimos:

1. `Id_departamento`
2. `Descripcion`
3. `Activo`
4. `Orden`

Restricciones recomendadas:

1. `Descripcion` unica a nivel funcional.
2. `Activo = 1` por defecto.
3. `Orden` editable desde interfaz.

### Tabla `ofertas.Usuarios_Asignables`

Ampliar la tabla funcional propia del modulo en lugar de depender de `General.Usuarios` para configuracion.

Campos a mantener o añadir:

1. Identificador de usuario o `Num_operario` segun el repo destino.
2. `Email`
3. `Id_departamento`
4. `Es_asignable`
5. `Rol`

Regla de negocio obligatoria:

1. El usuario puede existir en `General.Usuarios`, pero la activacion real en OFERTAS depende de su fila en `ofertas.Usuarios_Asignables`.
2. El filtro para asignaciones y notificaciones debe depender de esta tabla propia, no del rol `Dpto. Comercial` de la tabla externa.

### Tabla `ofertas.Estados`

Ampliar con:

1. `Id_departamento`

Regla funcional:

1. El departamento del estado destino es el criterio para cargar los destinatarios posibles en el cambio de estado.

### Tabla `ofertas.Outlook_Notificaciones`

Tabla de trazabilidad para registrar la intencion o resultado del envio.

Campos minimos recomendados:

1. `Id_notificacion`
2. `Id_oferta`
3. `Id_estado_origen`
4. `Id_estado_destino`
5. `Id_usuario_destinatario` nullable
6. `Email_destinatario`
7. `Fecha_intento`
8. `Resultado`
9. `Observaciones` o `Detalle_error` nullable
10. `Usuario_accion` o equivalente
11. `Modo_envio` con valores tipo `sin_envio`, `mailto`, `borrador_outlook`, `graph`, `fallido`

## Contrato de configuracion en UI

## Configuracion > Departamentos

Reutiliza el patron de tarjetas de Configuracion ya existente en OFERTAS.

Debe incluir:

1. Nueva tarjeta `Departamentos`.
2. Vista con alta, listado, edicion simple, activacion y orden.
3. Carga del catalogo al entrar en Configuracion para rellenar desplegables en Estados y Usuarios.

No usar campos libres para departamento en Estados o Usuarios. Debe existir un catalogo central.

## Usuarios: separar crear y configurar

La pantalla de usuarios del proyecto actual esta pensada para una tabla cerrada de Comercial. En el portado hay que separar claramente dos modos:

1. `Crear usuario`
2. `Configurar usuarios`

### Modo `Crear usuario`

Debe hacer esto:

1. Buscar o listar usuarios de `General.Usuarios` sin filtrar por `Dpto. Comercial`.
2. Permitir seleccionar uno.
3. Crear o completar su fila en `ofertas.Usuarios_Asignables`.

### Modo `Configurar usuarios`

Debe mostrar solo usuarios ya dados de alta en OFERTAS.

Campos visibles o editables:

1. `Departamento`
2. `Email`
3. `Asignable`
4. `Rol`

Restriccion importante:

1. El selector de usuarios asignables del resto de la aplicacion debe seguir filtrando por `es_asignable`.
2. Ya no debe depender del rol externo `Dpto. Comercial`.

## Estados: ampliar sin mezclar responsabilidades

El mantenimiento de Estados debe conservar su separacion actual respecto a la configuracion de columnas.

Cambios requeridos:

1. Añadir `Departamento` en alta y edicion de estado.
2. Mostrar `Departamento` en el listado.
3. Exponer `id_departamento` y descripcion de departamento en `GET /api/estados`.
4. Aceptar `id_departamento` en `POST /api/estados` y `PUT /api/estados/<id>`.

## Cambio de estado con destinatario manual

Este es el flujo central y debe respetar exactamente la siguiente secuencia:

1. El usuario abre el modal de cambio de estado.
2. Elige el estado destino.
3. El frontend resuelve el departamento asociado a ese estado.
4. Se cargan los usuarios configurados de ese departamento con email valido.
5. El usuario elige manualmente un destinatario o marca `sin enviar correo`.
6. El backend guarda la transicion CRM como hasta ahora.
7. El backend registra ademas una fila en `ofertas.Outlook_Notificaciones`.

No implementar decision automatica de destinatario. La regla de negocio es seleccion manual.

### Payload recomendado para cambio de estado

Ampliar el contrato del endpoint equivalente a `POST /api/ofertas/<id>/estado` con:

```json
{
  "id_estado": 7,
  "fecha_estado": "2026-05-25",
  "comentario": "Presupuesto enviado a revision",
  "id_usuario_destinatario": 123,
  "email_destinatario": "usuario@empresa.com",
  "enviar_correo": true,
  "modo_envio": "mailto"
}
```

Reglas:

1. `id_usuario_destinatario` puede ser nullable si se selecciona `sin enviar correo`.
2. `email_destinatario` puede persistirse como snapshot aunque exista `id_usuario_destinatario`.
3. `enviar_correo` no debe bloquear el cambio de estado si vale `false`.

## Endpoints recomendados

### Departamentos

1. `GET /api/departamentos`
2. `POST /api/departamentos`
3. `PUT /api/departamentos/<id>`
4. `DELETE /api/departamentos/<id>` o baja logica si el proyecto no permite borrado fisico

### Usuarios del modulo

1. `GET /api/usuarios`
2. `POST /api/usuarios`
3. `PUT /api/usuarios/<id>`
4. `DELETE /api/usuarios/<id>` o desactivacion

Contrato funcional recomendado para `GET /api/usuarios`:

1. Poder listar usuarios creados en OFERTAS.
2. Incluir `email`, `id_departamento`, `departamento`, `es_asignable` y `rol`.
3. No limitar la respuesta al rol externo `Dpto. Comercial`.

### Estados

1. `GET /api/estados` con `id_departamento` y descripcion del departamento.
2. `POST /api/estados` aceptando `id_departamento`.
3. `PUT /api/estados/<id>` aceptando `id_departamento`.

### Cambio de estado

1. Mantener el endpoint actual de cambio de estado.
2. Ampliar payload y persistencia para destinatario y trazabilidad.
3. Opcionalmente exponer `GET /api/ofertas/<id>/notificaciones` si el proyecto quiere mostrar historial.

## Estrategia Outlook por fases

La frase `vinculacion a Outlook` no debe interpretarse como envio automatico obligatorio desde la primera iteracion. El orden recomendado es este:

### Fase 1

Implementar una accion segura y de baja friccion:

1. Guardar en base de datos el intento.
2. Mostrar modal de confirmacion con destinatario, asunto y cuerpo.
3. Ofrecer `Abrir en Outlook` o `mailto:`.

Ventajas:

1. Menor dependencia de infraestructura.
2. Permite validar la operativa y la trazabilidad antes del envio real.

### Fase 2

Si el proyecto destino es solo Windows con Outlook de escritorio instalado, se puede valorar automatizacion local con `pywin32`.

Riesgos:

1. Alta dependencia de equipo, sesion local y permisos.
2. Fragilidad en entornos servidor o multiusuario.

### Fase 3

Si se requiere envio corporativo real y trazable, usar Microsoft Graph.

Condiciones previas:

1. App registrada.
2. Permisos definidos.
3. OAuth operativo.
4. Cuenta o buzon remitente decididos.

Si el proyecto destino ya usa Graph, entonces la tabla de trazabilidad y el selector manual de destinatario deben mantenerse igual; solo cambia el mecanismo de envio.

## Orden real de implementacion

Implementar en este orden:

1. Base de datos: `Departamentos`, ampliacion de `Usuarios_Asignables`, ampliacion de `Estados`, nueva `Outlook_Notificaciones`.
2. APIs nuevas y ampliadas para departamentos, usuarios, estados y cambio de estado.
3. Tarjeta de `Configuracion > Departamentos`.
4. Refactor de Usuarios en modos `Crear` y `Configurar`.
5. Campo departamento en Estados.
6. Selector manual de destinatario en modal de cambio de estado.
7. Registro de notificacion y preparacion de accion Outlook.
8. Solo despues, integracion de envio real si sigue siendo necesaria.

## Decisiones que deben cerrarse antes de codificar

Si el repo destino no lo especifica, usa estas decisiones por defecto:

1. Un usuario pertenece a un solo departamento.
2. Un estado pertenece a un solo departamento.
3. Un destinatario manual por cambio de estado.
4. Seleccion de destinatario opcional si el usuario marca `sin enviar correo`.
5. Puede haber estados sin departamento solo si el negocio lo necesita expresamente; en caso contrario, obligarlo en validacion.
6. Primera iteracion sin envio automatico real.

## Restricciones de portado

1. No meter el email funcional solo en `General.Usuarios`.
2. No resolver destinatario automaticamente por heuristicas.
3. No mezclar la administracion de departamentos con la configuracion de columnas de Estados.
4. No reutilizar la implementacion multidepartamento M:N si el requisito actual es un usuario, un departamento.
5. No bloquear el cambio de estado si el negocio permite `sin enviar correo`.

## Checklist corto de validacion

1. Existe un catalogo central de departamentos visible en Configuracion.
2. Usuarios y Estados consumen ese catalogo mediante desplegable.
3. `GET /api/usuarios` ya no depende del filtro externo `Dpto. Comercial`.
4. `GET /api/estados` devuelve `id_departamento`.
5. El modal de cambio de estado muestra destinatarios del departamento del estado destino.
6. El usuario puede elegir destinatario manual o continuar sin envio.
7. Cada cambio de estado genera una fila de trazabilidad de notificacion.
8. La primera iteracion puede abrir Outlook o preparar borrador sin requerir Graph.

## Resultado esperado

Si el otro proyecto sigue esta skill, deberia acabar con un sistema en el que el flujo de notificacion depende de la configuracion funcional del modulo y no de reglas rigidas heredadas de Comercial, manteniendo ademas una via segura para evolucionar despues hacia Outlook real o Microsoft Graph.

## Referencia operativa

Si lo que necesitas no es la explicacion funcional sino una guia de ejecucion directa por SQL, endpoints, pantallas y pruebas minimas, usa `docs/ESPECIFICACION_TECNICA_DEPARTAMENTOS_NOTIFICACIONES_OUTLOOK.md`.