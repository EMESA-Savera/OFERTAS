USE [DataLakeSCCZ]
GO

/****** Añade la columna fast_notes a la tabla ofertas.listado_ofertas ******/
IF COL_LENGTH('ofertas.listado_ofertas', 'fast_notes') IS NULL
BEGIN
    ALTER TABLE [ofertas].[listado_ofertas]
        ADD [fast_notes] [nvarchar](max) NULL;
END
GO
