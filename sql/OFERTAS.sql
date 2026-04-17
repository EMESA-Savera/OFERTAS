IF NOT EXISTS (
	SELECT 1
	FROM sys.schemas
	WHERE name = 'ofertas'
)
BEGIN
	EXEC('CREATE SCHEMA ofertas');
END;
GO

IF OBJECT_ID('ofertas.Listado_Ofertas', 'U') IS NULL
BEGIN
	CREATE TABLE ofertas.Listado_Ofertas (
		ID_oferta INT IDENTITY(1,1) NOT NULL,
		Id_estado INT NOT NULL CONSTRAINT DF_Listado_Ofertas_Id_estado DEFAULT (1),
		Fecha_email DATE NULL,
		Fecha_alta_oferta DATE NULL,
		Numero_oferta CHAR(9) NULL,
		Ref_cliente_asunto_email NVARCHAR(500) NULL,
		Id_cliente INT NULL,
		Concepto NVARCHAR(255) NULL,
		Observaciones NVARCHAR(MAX) NULL,
		Columna1 NVARCHAR(255) NULL,
		CONSTRAINT PK_Listado_Ofertas PRIMARY KEY CLUSTERED (ID_oferta)
	);
END;
GO

IF OBJECT_ID('ofertas.Clientes', 'U') IS NULL
BEGIN
	CREATE TABLE ofertas.Clientes (
		Id_cliente INT IDENTITY(1,1) NOT NULL,
		Descripcion_cliente VARCHAR(255) NOT NULL,
		CONSTRAINT PK_Clientes PRIMARY KEY CLUSTERED (Id_cliente)
	);
END;
GO

IF OBJECT_ID('ofertas.Estados', 'U') IS NULL
BEGIN
	CREATE TABLE ofertas.Estados (
		Id_estado INT IDENTITY(1,1) NOT NULL,
		Descripcion_estado VARCHAR(255) NOT NULL,
		Orden INT NULL,
		CONSTRAINT PK_Estados PRIMARY KEY CLUSTERED (Id_estado)
	);
END;
GO

IF COL_LENGTH('ofertas.Estados', 'Orden') IS NULL
BEGIN
	ALTER TABLE ofertas.Estados ADD Orden INT NULL;
END;
GO

-- Numerar estados existentes que no tengan orden asignado
UPDATE ofertas.Estados
SET Orden = seq.Fila
FROM ofertas.Estados e
INNER JOIN (
	SELECT Id_estado,
		ROW_NUMBER() OVER (ORDER BY Id_estado ASC) AS Fila
	FROM ofertas.Estados
	WHERE Orden IS NULL
) seq ON e.Id_estado = seq.Id_estado;
GO

IF OBJECT_ID('ofertas.ConfiguracionColumnas', 'U') IS NULL
BEGIN
	CREATE TABLE ofertas.ConfiguracionColumnas (
		Id_config INT IDENTITY(1,1) NOT NULL,
		Id_estado INT NOT NULL,
		Columna VARCHAR(100) NOT NULL,
		Descripcion_columna VARCHAR(255) NULL,
		Orden_columna INT NULL,
		CONSTRAINT PK_ConfiguracionColumnas PRIMARY KEY CLUSTERED (Id_config)
	);
END;
GO

IF COL_LENGTH('ofertas.Listado_Ofertas', 'Id_cliente') IS NULL
BEGIN
	ALTER TABLE ofertas.Listado_Ofertas ADD Id_cliente INT NULL;
END;
GO

IF COL_LENGTH('ofertas.Listado_Ofertas', 'Cliente') IS NOT NULL
BEGIN
	UPDATE lo
	SET Id_cliente = c.Id_cliente
	FROM ofertas.Listado_Ofertas lo
	INNER JOIN ofertas.Clientes c
		ON LTRIM(RTRIM(CONVERT(VARCHAR(255), lo.Cliente))) = LTRIM(RTRIM(c.Descripcion_cliente))
	WHERE lo.Id_cliente IS NULL
	  AND lo.Cliente IS NOT NULL;
END;
GO

IF COL_LENGTH('ofertas.Listado_Ofertas', 'Fecha_envio_duda_cliente') IS NOT NULL
BEGIN
	ALTER TABLE ofertas.Listado_Ofertas DROP COLUMN Fecha_envio_duda_cliente;
END;
GO

IF COL_LENGTH('ofertas.Listado_Ofertas', 'Fecha_envio_tecnico_compras') IS NOT NULL
BEGIN
	ALTER TABLE ofertas.Listado_Ofertas DROP COLUMN Fecha_envio_tecnico_compras;
END;
GO

IF COL_LENGTH('ofertas.Listado_Ofertas', 'Fecha_devolucion_tecnico') IS NOT NULL
BEGIN
	ALTER TABLE ofertas.Listado_Ofertas DROP COLUMN Fecha_devolucion_tecnico;
END;
GO

IF COL_LENGTH('ofertas.Listado_Ofertas', 'Fecha_fin') IS NOT NULL
BEGIN
	ALTER TABLE ofertas.Listado_Ofertas DROP COLUMN Fecha_fin;
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.default_constraints dc
	INNER JOIN sys.columns c
		ON dc.parent_object_id = c.object_id
		AND dc.parent_column_id = c.column_id
	WHERE dc.parent_object_id = OBJECT_ID('ofertas.Listado_Ofertas')
	  AND c.name = 'Id_estado'
)
BEGIN
	ALTER TABLE ofertas.Listado_Ofertas
	ADD CONSTRAINT DF_Listado_Ofertas_Id_estado DEFAULT (1) FOR Id_estado;
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.foreign_keys
	WHERE name = 'FK_Listado_Ofertas_Clientes'
	  AND parent_object_id = OBJECT_ID('ofertas.Listado_Ofertas')
)
BEGIN
	ALTER TABLE ofertas.Listado_Ofertas
	ADD CONSTRAINT FK_Listado_Ofertas_Clientes
		FOREIGN KEY (Id_cliente) REFERENCES ofertas.Clientes (Id_cliente);
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.foreign_keys
	WHERE parent_object_id = OBJECT_ID('ofertas.ConfiguracionColumnas')
	  AND name = 'FK_ConfiguracionColumnas_Estados'
)
BEGIN
	ALTER TABLE ofertas.ConfiguracionColumnas
	ADD CONSTRAINT FK_ConfiguracionColumnas_Estados
		FOREIGN KEY (Id_estado) REFERENCES ofertas.Estados (Id_estado);
END;
GO

IF OBJECT_ID('ofertas.Oferta_Interacciones', 'U') IS NULL
BEGIN
	CREATE TABLE ofertas.Oferta_Interacciones (
		ID_interaccion INT IDENTITY(1,1) NOT NULL,
		ID_oferta INT NOT NULL,
		Tipo_interaccion NVARCHAR(50) NOT NULL,
		Fecha_interaccion DATE NULL,
		Observaciones NVARCHAR(500) NULL,
		CONSTRAINT PK_Oferta_Interacciones PRIMARY KEY CLUSTERED (ID_interaccion),
		CONSTRAINT FK_Oferta_Interacciones_Listado_Ofertas FOREIGN KEY (ID_oferta)
			REFERENCES ofertas.Listado_Ofertas (ID_oferta),
		CONSTRAINT UQ_Oferta_Interacciones UNIQUE (ID_oferta, Tipo_interaccion),
		CONSTRAINT CK_Oferta_Interacciones_Tipo CHECK (
			Tipo_interaccion IN (
				'ENVIO_DUDA_CLIENTE',
				'ENVIO_TECNICO_COMPRAS',
				'DEVOLUCION_TECNICO',
				'FECHA_FIN'
			)
		)
	);
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.indexes
	WHERE object_id = OBJECT_ID('ofertas.Listado_Ofertas')
	  AND name = 'UX_Listado_Ofertas_Numero_oferta'
)
BEGIN
	CREATE UNIQUE INDEX UX_Listado_Ofertas_Numero_oferta
		ON ofertas.Listado_Ofertas (Numero_oferta)
		WHERE Numero_oferta IS NOT NULL;
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.indexes
	WHERE object_id = OBJECT_ID('ofertas.Listado_Ofertas')
	  AND name = 'IX_Listado_Ofertas_Id_estado'
)
BEGIN
	CREATE INDEX IX_Listado_Ofertas_Id_estado
		ON ofertas.Listado_Ofertas (Id_estado);
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.indexes
	WHERE object_id = OBJECT_ID('ofertas.Listado_Ofertas')
	  AND name = 'IX_Listado_Ofertas_Id_cliente'
)
BEGIN
	CREATE INDEX IX_Listado_Ofertas_Id_cliente
		ON ofertas.Listado_Ofertas (Id_cliente);
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.indexes
	WHERE object_id = OBJECT_ID('ofertas.Clientes')
	  AND name = 'IX_Clientes_Descripcion_cliente'
)
BEGIN
	CREATE INDEX IX_Clientes_Descripcion_cliente
		ON ofertas.Clientes (Descripcion_cliente);
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.indexes
	WHERE object_id = OBJECT_ID('ofertas.Estados')
	  AND name = 'IX_Estados_Descripcion_estado'
)
BEGIN
	CREATE INDEX IX_Estados_Descripcion_estado
		ON ofertas.Estados (Descripcion_estado);
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.indexes
	WHERE object_id = OBJECT_ID('ofertas.ConfiguracionColumnas')
	  AND name = 'IX_ConfiguracionColumnas_Id_estado'
)
BEGIN
	CREATE INDEX IX_ConfiguracionColumnas_Id_estado
		ON ofertas.ConfiguracionColumnas (Id_estado);
END;
GO

IF NOT EXISTS (
	SELECT 1
	FROM sys.indexes
	WHERE object_id = OBJECT_ID('ofertas.ConfiguracionColumnas')
	  AND name = 'IX_ConfiguracionColumnas_Orden_columna'
)
BEGIN
	CREATE INDEX IX_ConfiguracionColumnas_Orden_columna
		ON ofertas.ConfiguracionColumnas (Id_estado, Orden_columna);
END;
GO

CREATE OR ALTER TRIGGER ofertas.TR_Listado_Ofertas_Autogenerar_NumeroOferta
ON ofertas.Listado_Ofertas
AFTER INSERT
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @anio CHAR(4) = CONVERT(CHAR(4), YEAR(GETDATE()));

	;WITH Base AS (
		SELECT ISNULL(MAX(TRY_CONVERT(INT, RIGHT(Numero_oferta, 5))), 0) AS UltimoCorrelativo
		FROM ofertas.Listado_Ofertas WITH (UPDLOCK, HOLDLOCK)
		WHERE LEFT(ISNULL(Numero_oferta, ''), 4) = @anio
	), Pendientes AS (
		SELECT i.ID_oferta,
			ROW_NUMBER() OVER (ORDER BY i.ID_oferta) AS OrdenCorrelativo
		FROM inserted i
		WHERE ISNULL(i.Numero_oferta, '') = ''
	), Numerados AS (
		SELECT p.ID_oferta,
			CONCAT(@anio, RIGHT('00000' + CAST((b.UltimoCorrelativo + p.OrdenCorrelativo) AS VARCHAR(5)), 5)) AS NumeroOferta
		FROM Pendientes p
		CROSS JOIN Base b
	)
	UPDATE lo
	SET lo.Numero_oferta = n.NumeroOferta,
		lo.Id_estado = 1
	FROM ofertas.Listado_Ofertas lo
	INNER JOIN Numerados n
		ON lo.ID_oferta = n.ID_oferta;
END;
GO
