IF COL_LENGTH('ofertas.estados', 'emoji_sidebar') IS NULL
BEGIN
    ALTER TABLE ofertas.estados ADD emoji_sidebar nvarchar(8) NULL;
END
GO

IF COL_LENGTH('ofertas.estados', 'activo') IS NULL
BEGIN
    ALTER TABLE ofertas.estados ADD activo bit NOT NULL CONSTRAINT df_estados_activo DEFAULT ((1));
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('ofertas.estados')
      AND name = 'activo'
      AND is_nullable = 1
)
BEGIN
    UPDATE ofertas.estados
    SET activo = 1
    WHERE activo IS NULL;

    ALTER TABLE ofertas.estados ALTER COLUMN activo bit NOT NULL;
END
GO
