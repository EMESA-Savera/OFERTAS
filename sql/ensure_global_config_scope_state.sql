SET NOCOUNT ON;

IF NOT EXISTS (
    SELECT 1
    FROM ofertas.estados
    WHERE id_estado = -1
)
BEGIN
    SET IDENTITY_INSERT ofertas.estados ON;

    INSERT INTO ofertas.estados (
        id_estado,
        descripcion_estado,
        orden,
        id_departamento,
        emoji_sidebar,
        activo
    )
    VALUES (
        -1,
        '__GLOBAL_COLUMN_SCOPE__',
        NULL,
        NULL,
        '',
        0
    );

    SET IDENTITY_INSERT ofertas.estados OFF;
END;

IF NOT EXISTS (
    SELECT 1
    FROM ofertas.configuracioncolumnas
    WHERE id_estado = -1
)
BEGIN
    INSERT INTO ofertas.configuracioncolumnas (id_estado, columna, descripcion_columna, orden_columna)
    VALUES
        (-1, 'numero_oferta', 'Nº oferta', 1),
        (-1, 'fecha_alta_oferta', 'Fecha alta', 2),
        (-1, 'cliente', 'Cliente', 3),
        (-1, 'emisor', 'Emisor', 4),
        (-1, 'observaciones_oferta', 'Observaciones', 5),
        (-1, 'estado', 'Estado', 6);
END;