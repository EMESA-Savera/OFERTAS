USE [Digitalizacion]
GO
/****** Object:  Table [ofertas].[Listado_Ofertas]    Script Date: 16/04/2026 11:16:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Listado_Ofertas](
	[ID_oferta] [int] IDENTITY(1,1) NOT NULL,
	[Id_estado] [int] NOT NULL,
	[Fecha_email] [date] NULL,
	[Fecha_alta_oferta] [date] NULL,
	[Numero_oferta] [nvarchar](50) NULL,
	[Ref_cliente_asunto_email] [nvarchar](500) NULL,
	[Concepto] [nvarchar](255) NULL,
	[Observaciones] [nvarchar](max) NULL,
	[Columna1] [nvarchar](255) NULL,
	[Id_cliente] [int] NULL,
 CONSTRAINT [PK_Listado_Ofertas] PRIMARY KEY CLUSTERED 
(
	[ID_oferta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[Oferta_Interacciones]    Script Date: 16/04/2026 11:16:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Oferta_Interacciones](
	[ID_interaccion] [int] IDENTITY(1,1) NOT NULL,
	[ID_oferta] [int] NOT NULL,
	[Tipo_interaccion] [nvarchar](50) NOT NULL,
	[Fecha_interaccion] [date] NULL,
	[Observaciones] [nvarchar](500) NULL,
 CONSTRAINT [PK_Oferta_Interacciones] PRIMARY KEY CLUSTERED 
(
	[ID_interaccion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Oferta_Interacciones] UNIQUE NONCLUSTERED 
(
	[ID_oferta] ASC,
	[Tipo_interaccion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[clientes]    Script Date: 16/04/2026 11:16:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[clientes](
	[Id_cliente] [int] IDENTITY(1,1) NOT NULL,
	[Descripcion_cliente] [varchar](255) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_cliente] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[estados]    Script Date: 16/04/2026 11:16:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[estados](
	[Id_estado] [int] IDENTITY(1,1) NOT NULL,
	[Descripcion_estado] [varchar](255) NOT NULL,
	[orden] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [ofertas].[vw_Listado_Ofertas_Interacciones]    Script Date: 16/04/2026 11:16:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [ofertas].[vw_Listado_Ofertas_Interacciones]
AS
SELECT
    lo.[ID_oferta],
    e.[Descripcion_estado]      AS [Estado],
    lo.[Fecha_email],
    lo.[Fecha_alta_oferta],
    lo.[Numero_oferta],
    lo.[Ref_cliente_asunto_email],
    c.[Descripcion_cliente]     AS [Cliente],
    lo.[Concepto],
    lo.[Observaciones]          AS [Observaciones_oferta],
    lo.[Columna1],
    oi.[ID_interaccion],
    oi.[Tipo_interaccion],
    oi.[Fecha_interaccion],
    oi.[Observaciones]          AS [Observaciones_interaccion]
FROM [Digitalizacion].[ofertas].[Listado_Ofertas] lo
LEFT JOIN [Digitalizacion].[ofertas].[Oferta_Interacciones] oi
    ON lo.[ID_oferta] = oi.[ID_oferta]
LEFT JOIN [Digitalizacion].[ofertas].[estados] e
    ON lo.[Id_estado] = e.[Id_estado]
LEFT JOIN [Digitalizacion].[ofertas].[clientes] c
    ON lo.[Id_cliente] = c.[Id_cliente];
GO
/****** Object:  Table [ofertas].[configuracioncolumnas]    Script Date: 16/04/2026 11:16:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[configuracioncolumnas](
	[Id_config] [int] IDENTITY(1,1) NOT NULL,
	[Id_estado] [int] NOT NULL,
	[Columna] [varchar](100) NOT NULL,
	[Descripcion_columna] [varchar](255) NULL,
	[Orden_columna] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_config] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [ofertas].[Listado_Ofertas] ADD  CONSTRAINT [DF_Listado_Ofertas_Id_estado]  DEFAULT ((1)) FOR [Id_estado]
GO
ALTER TABLE [ofertas].[configuracioncolumnas]  WITH CHECK ADD  CONSTRAINT [FK_config_estado] FOREIGN KEY([Id_estado])
REFERENCES [ofertas].[estados] ([Id_estado])
GO
ALTER TABLE [ofertas].[configuracioncolumnas] CHECK CONSTRAINT [FK_config_estado]
GO
ALTER TABLE [ofertas].[configuracioncolumnas]  WITH CHECK ADD  CONSTRAINT [FK_configuracioncolumnas_estados] FOREIGN KEY([Id_estado])
REFERENCES [ofertas].[estados] ([Id_estado])
GO
ALTER TABLE [ofertas].[configuracioncolumnas] CHECK CONSTRAINT [FK_configuracioncolumnas_estados]
GO
ALTER TABLE [ofertas].[Listado_Ofertas]  WITH CHECK ADD  CONSTRAINT [FK_Listado_Ofertas_Clientes] FOREIGN KEY([Id_cliente])
REFERENCES [ofertas].[clientes] ([Id_cliente])
GO
ALTER TABLE [ofertas].[Listado_Ofertas] CHECK CONSTRAINT [FK_Listado_Ofertas_Clientes]
GO
ALTER TABLE [ofertas].[Oferta_Interacciones]  WITH CHECK ADD  CONSTRAINT [FK_Oferta_Interacciones_Listado_Ofertas] FOREIGN KEY([ID_oferta])
REFERENCES [ofertas].[Listado_Ofertas] ([ID_oferta])
GO
ALTER TABLE [ofertas].[Oferta_Interacciones] CHECK CONSTRAINT [FK_Oferta_Interacciones_Listado_Ofertas]
GO
ALTER TABLE [ofertas].[Oferta_Interacciones]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_Interacciones_Tipo] CHECK  (([Tipo_interaccion]='FECHA_FIN' OR [Tipo_interaccion]='DEVOLUCION_TECNICO' OR [Tipo_interaccion]='ENVIO_TECNICO_COMPRAS' OR [Tipo_interaccion]='ENVIO_DUDA_CLIENTE'))
GO
ALTER TABLE [ofertas].[Oferta_Interacciones] CHECK CONSTRAINT [CK_Oferta_Interacciones_Tipo]
GO
