IF OBJECT_ID('ofertas.boms', 'U') IS NULL
BEGIN
    CREATE TABLE ofertas.boms (
        id_bom INT IDENTITY(1,1) NOT NULL,
        material NVARCHAR(255) NOT NULL,
        precio DECIMAL(18, 2) NOT NULL,
        fecha_creacion DATETIME2(0) NOT NULL CONSTRAINT df_boms_fecha_creacion DEFAULT (SYSDATETIME()),
        CONSTRAINT pk_boms PRIMARY KEY CLUSTERED (id_bom ASC)
    );
END;
GO

IF COL_LENGTH('ofertas.boms', 'material') IS NULL
BEGIN
    ALTER TABLE ofertas.boms ADD material NVARCHAR(255) NULL;
END;
GO

IF COL_LENGTH('ofertas.boms', 'precio') IS NULL
BEGIN
    ALTER TABLE ofertas.boms ADD precio DECIMAL(18, 2) NULL;
END;
GO

IF COL_LENGTH('ofertas.boms', 'nombre_bom') IS NOT NULL
BEGIN
    UPDATE ofertas.boms
    SET material = COALESCE(NULLIF(LTRIM(RTRIM(material)), ''), NULLIF(LTRIM(RTRIM(nombre_bom)), ''))
    WHERE material IS NULL OR LTRIM(RTRIM(material)) = '';
END;
GO

IF COL_LENGTH('ofertas.listado_ofertas', 'id_bom') IS NULL
BEGIN
    ALTER TABLE ofertas.listado_ofertas
    ADD id_bom INT NULL;
END;
GO

IF COL_LENGTH('ofertas.listado_ofertas', 'id_bom') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = 'fk_listado_ofertas_bom'
         AND parent_object_id = OBJECT_ID('ofertas.listado_ofertas')
   )
BEGIN
    ALTER TABLE ofertas.listado_ofertas WITH CHECK
    ADD CONSTRAINT fk_listado_ofertas_bom
    FOREIGN KEY (id_bom) REFERENCES ofertas.boms(id_bom);
END;
GO