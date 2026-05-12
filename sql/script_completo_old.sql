USE [DataLakeSCCZ]
GO
/****** Object:  Table [ofertas].[Listado_Ofertas]    Script Date: 30/04/2026 11:02:33 ******/
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
	[Observaciones] [nvarchar](max) NULL,
	[Id_cliente] [int] NULL,
	[Nombre_emisor] [nvarchar](255) NULL,
	[Email_emisor] [nvarchar](255) NULL,
 CONSTRAINT [PK_Listado_Ofertas] PRIMARY KEY CLUSTERED 
(
	[ID_oferta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[Oferta_Interacciones]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Oferta_Interacciones](
	[ID_interaccion] [int] IDENTITY(1,1) NOT NULL,
	[ID_oferta] [int] NOT NULL,
	[Tipo_interaccion] [nvarchar](255) NOT NULL,
	[Fecha_interaccion] [datetime2](0) NOT NULL,
	[Observaciones] [nvarchar](500) NULL,
	[Fecha_limite] [date] NULL,
 CONSTRAINT [PK_Oferta_Interacciones] PRIMARY KEY CLUSTERED 
(
	[ID_interaccion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[clientes]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[clientes](
	[Id_cliente] [int] IDENTITY(1,1) NOT NULL,
	[Descripcion_cliente] [varchar](255) NOT NULL,
	[dominio] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_cliente] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[estados]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[estados](
	[Id_estado] [int] IDENTITY(1,1) NOT NULL,
	[Descripcion_estado] [varchar](255) NOT NULL,
	[orden] [int] NULL,
	[Id_departamento] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [ofertas].[vw_Listado_Ofertas_Interacciones]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE   VIEW [ofertas].[vw_Listado_Ofertas_Interacciones]
AS
SELECT
	lo.ID_oferta,
	e.Descripcion_estado AS Estado,
	lo.Fecha_email,
	lo.Fecha_alta_oferta,
	lo.Numero_oferta,
	lo.Ref_cliente_asunto_email,
	CASE
		WHEN NULLIF(LTRIM(RTRIM(ISNULL(lo.Nombre_emisor, ''))), '') IS NOT NULL
			AND NULLIF(LTRIM(RTRIM(ISNULL(lo.Email_emisor, ''))), '') IS NOT NULL
			THEN CONCAT(LTRIM(RTRIM(lo.Nombre_emisor)), ' <', LTRIM(RTRIM(lo.Email_emisor)), '>')
		WHEN NULLIF(LTRIM(RTRIM(ISNULL(lo.Email_emisor, ''))), '') IS NOT NULL
			THEN LTRIM(RTRIM(lo.Email_emisor))
		ELSE NULLIF(LTRIM(RTRIM(ISNULL(lo.Nombre_emisor, ''))), '')
	END AS Emisor,
	lo.Nombre_emisor,
	lo.Email_emisor,
	c.Descripcion_cliente AS Cliente,
	lo.Observaciones AS Observaciones_oferta,
	oi.ID_interaccion,
	oi.Tipo_interaccion,
	oi.Fecha_interaccion,
	oi.Fecha_limite,
	oi.Observaciones AS Observaciones_interaccion
FROM ofertas.Listado_Ofertas lo
LEFT JOIN ofertas.Oferta_Interacciones oi
	ON lo.ID_oferta = oi.ID_oferta
LEFT JOIN ofertas.Estados e
	ON lo.Id_estado = e.Id_estado
LEFT JOIN ofertas.Clientes c
	ON lo.Id_cliente = c.Id_cliente;
GO
/****** Object:  Table [ofertas].[configuracioncolumnas]    Script Date: 30/04/2026 11:02:33 ******/
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
/****** Object:  Table [ofertas].[Departamentos]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Departamentos](
	[Id_departamento] [int] IDENTITY(1,1) NOT NULL,
	[Nombre_departamento] [varchar](255) NOT NULL,
	[Descripcion] [nvarchar](500) NULL,
	[Estado_activo] [bit] NOT NULL,
	[Fecha_creacion] [datetime] NOT NULL,
 CONSTRAINT [PK_Departamentos] PRIMARY KEY CLUSTERED 
(
	[Id_departamento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[Oferta_ETC]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Oferta_ETC](
	[Id_oferta_etc] [int] IDENTITY(1,1) NOT NULL,
	[Fecha_recepcion] [date] NULL,
	[Fecha_envio_oferta] [date] NULL,
	[Fecha_limite_respuesta] [date] NULL,
	[Id_estado] [int] NOT NULL,
	[Id_cliente] [int] NULL,
	[Num_operario_responsable] [int] NULL,
	[Id_departamento_destino] [int] NULL,
	[Codigo_externo_oferta] [nvarchar](100) NULL,
	[Codigo_interno_oferta] [nvarchar](100) NULL,
	[Referencia_cliente] [nvarchar](255) NULL,
	[Numero_comision] [nvarchar](100) NULL,
	[PO_original] [nvarchar](100) NULL,
	[Pedido_b2b] [nvarchar](100) NULL,
	[Proyecto] [nvarchar](255) NULL,
	[Nombre_solicitante] [nvarchar](255) NULL,
	[Email_solicitante] [nvarchar](255) NULL,
	[Empresa_solicitante] [nvarchar](255) NULL,
	[Incoterm] [varchar](10) NULL,
	[Moneda] [char](3) NOT NULL,
	[Prioridad] [varchar](20) NOT NULL,
	[Es_urgente] [bit] NOT NULL,
	[Resumen_material_solicitado] [nvarchar](max) NULL,
	[Resumen_material_ofertado] [nvarchar](max) NULL,
	[Total_material_eur] [decimal](18, 2) NULL,
	[Total_fee_eur] [decimal](18, 2) NULL,
	[Total_oferta_eur]  AS (case when [Total_material_eur] IS NULL AND [Total_fee_eur] IS NULL then NULL else isnull([Total_material_eur],(0))+isnull([Total_fee_eur],(0)) end) PERSISTED,
	[Observaciones_cliente] [nvarchar](max) NULL,
	[Observaciones_tecnicas] [nvarchar](max) NULL,
	[Observaciones_internas] [nvarchar](max) NULL,
	[Origen_registro] [varchar](20) NOT NULL,
	[Activo] [bit] NOT NULL,
	[Fecha_creacion] [datetime2](0) NOT NULL,
	[Fecha_actualizacion] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_Oferta_ETC] PRIMARY KEY CLUSTERED 
(
	[Id_oferta_etc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[Proyectos]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Proyectos](
	[Id_proyecto] [int] IDENTITY(1,1) NOT NULL,
	[Descripcion_proyecto] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_Proyectos] PRIMARY KEY CLUSTERED 
(
	[Id_proyecto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[Roles]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Roles](
	[Id_rol] [int] NOT NULL,
	[Nombre_rol] [varchar](100) NOT NULL,
	[Descripcion] [nvarchar](255) NULL,
 CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
(
	[Id_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[Usuarios_Config]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[Usuarios_Config](
	[Num_operario] [int] NOT NULL,
	[Id_departamento] [int] NULL,
	[Id_rol] [int] NOT NULL,
	[Fecha_asignacion] [datetime] NOT NULL,
	[Email] [varchar](255) NULL,
 CONSTRAINT [PK_Usuarios_Config] PRIMARY KEY CLUSTERED 
(
	[Num_operario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [ofertas].[clientes] ON 

INSERT [ofertas].[clientes] ([Id_cliente], [Descripcion_cliente], [dominio]) VALUES (1, N'SAVERA', N'saveragroup.com')
INSERT [ofertas].[clientes] ([Id_cliente], [Descripcion_cliente], [dominio]) VALUES (2, N'EMESA', N'sgemesa.com')
SET IDENTITY_INSERT [ofertas].[clientes] OFF
GO
SET IDENTITY_INSERT [ofertas].[configuracioncolumnas] ON 

INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (4, 1, N'Fecha_email', N'Fecha e-mail', 4)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (6, 1, N'Numero_oferta', N'Nº oferta', 1)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (7, 1, N'Ref_cliente_asunto_email', N'Asunto', 3)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (8, 1, N'Cliente', N'Cliente', 5)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (9, 1, N'Observaciones_oferta', N'Comentarios', 6)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (10, 1, N'Tipo_interaccion', N'Cambio estado', 7)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (11, 1, N'Fecha_interaccion', N'Fecha interacción', 9)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (12, 1, N'Observaciones_interaccion', N'Comunicación', 8)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (13, 5, N'Numero_oferta', N'Nº oferta', 1)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (14, 5, N'Fecha_interaccion', N'Fechas interacción', 5)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (15, 5, N'Observaciones_interaccion', N'Observaciones interacción', 6)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (16, 3, N'Numero_oferta', N'Nº oferta', 1)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (17, 3, N'Ref_cliente_asunto_email', N'Asunto', 2)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (18, 1, N'Fecha_alta_oferta', N'Fecha alta oferta', 2)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (19, 5, N'Fecha_email', N'Fecha e-mail', 2)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (20, 5, N'Fecha_alta_oferta', N'Fecha alta oferta', 3)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (21, 5, N'Ref_cliente_asunto_email', N'Ref. cliente / asunto e-mail', 4)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (22, 6, N'Fecha_email', N'Fecha e-mail', 3)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (23, 6, N'Fecha_alta_oferta', N'Fecha alta oferta', 4)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (24, 6, N'Numero_oferta', N'Nº oferta', 1)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (25, 6, N'Ref_cliente_asunto_email', N'Ref. cliente / asunto e-mail', 2)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (26, 6, N'Observaciones_interaccion', N'Observaciones interacción', 5)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (27, 3, N'Fecha_email', N'Fecha e-mail', 3)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (28, 3, N'Fecha_alta_oferta', N'Fecha alta oferta', 4)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (29, 2, N'Fecha_email', N'Fecha e-mail', 2)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (30, 2, N'Fecha_alta_oferta', N'Fecha alta oferta', 3)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (31, 2, N'Numero_oferta', N'Nº oferta', 1)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (32, 2, N'Ref_cliente_asunto_email', N'Ref. cliente / asunto e-mail', 4)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (33, 2, N'Cliente', N'Cliente', 5)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (36, 6, N'Tipo_interaccion', N'Tipos interacción', 6)
INSERT [ofertas].[configuracioncolumnas] ([Id_config], [Id_estado], [Columna], [Descripcion_columna], [Orden_columna]) VALUES (37, 1, N'Fecha_limite', N'Fecha límite', 10)
SET IDENTITY_INSERT [ofertas].[configuracioncolumnas] OFF
GO
SET IDENTITY_INSERT [ofertas].[Departamentos] ON 

INSERT [ofertas].[Departamentos] ([Id_departamento], [Nombre_departamento], [Descripcion], [Estado_activo], [Fecha_creacion]) VALUES (1, N'Compras', N'Departamento de Compras y Adquisiciones', 1, CAST(N'2026-04-29T10:17:53.130' AS DateTime))
INSERT [ofertas].[Departamentos] ([Id_departamento], [Nombre_departamento], [Descripcion], [Estado_activo], [Fecha_creacion]) VALUES (2, N'Ventas', N'Departamento de Ventas', 1, CAST(N'2026-04-29T10:17:53.137' AS DateTime))
INSERT [ofertas].[Departamentos] ([Id_departamento], [Nombre_departamento], [Descripcion], [Estado_activo], [Fecha_creacion]) VALUES (3, N'Técnico', N'Departamento Técnico', 1, CAST(N'2026-04-29T10:17:53.140' AS DateTime))
INSERT [ofertas].[Departamentos] ([Id_departamento], [Nombre_departamento], [Descripcion], [Estado_activo], [Fecha_creacion]) VALUES (4, N'Administración', N'Departamento de Administración', 1, CAST(N'2026-04-29T10:17:53.143' AS DateTime))
INSERT [ofertas].[Departamentos] ([Id_departamento], [Nombre_departamento], [Descripcion], [Estado_activo], [Fecha_creacion]) VALUES (5, N'Prueba', NULL, 1, CAST(N'2026-04-29T10:49:47.080' AS DateTime))
SET IDENTITY_INSERT [ofertas].[Departamentos] OFF
GO
SET IDENTITY_INSERT [ofertas].[estados] ON 

INSERT [ofertas].[estados] ([Id_estado], [Descripcion_estado], [orden], [Id_departamento]) VALUES (1, N'Pendiente', 1, 5)
INSERT [ofertas].[estados] ([Id_estado], [Descripcion_estado], [orden], [Id_departamento]) VALUES (2, N'Pedido', 5, NULL)
INSERT [ofertas].[estados] ([Id_estado], [Descripcion_estado], [orden], [Id_departamento]) VALUES (3, N'Enviada', 4, NULL)
INSERT [ofertas].[estados] ([Id_estado], [Descripcion_estado], [orden], [Id_departamento]) VALUES (4, N'Anulada', 6, NULL)
INSERT [ofertas].[estados] ([Id_estado], [Descripcion_estado], [orden], [Id_departamento]) VALUES (5, N'Pendiente Tecnico', 2, NULL)
INSERT [ofertas].[estados] ([Id_estado], [Descripcion_estado], [orden], [Id_departamento]) VALUES (6, N'Pendiente Compras', 3, NULL)
SET IDENTITY_INSERT [ofertas].[estados] OFF
GO
SET IDENTITY_INSERT [ofertas].[Listado_Ofertas] ON 

INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (1, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-29' AS Date), N'202600001', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', NULL, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (2, 5, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-29' AS Date), N'202600002', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (3, 1, CAST(N'2026-04-27' AS Date), CAST(N'2026-04-29' AS Date), N'202600003', N'RE: Access to Offers App', N'Pedro,

Thank you for your mail.

I understand now what you mean. I spoke with Jose and I have prepared an Excel for our meeting where I outlined what the application should include.

The point is that the Excel we currently use for offers and the application I have in mind are a completely different concept.

However, I am sending you our current Excel for your review. On Wednesday, I would like to present my comments and my vision of how the application could work efficiently for our internal needs.

Thank you so much,

Martin

Ing. Martin Sak

Technical Manager

Savera Components CZ

17.listopadu 6242, 708 00 Ostrava-Poruba

Budova CTP OP1-B

Mobile:  +420 725 403 281

m.sak@saveragroup.com <mailto:m.sak@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531175163%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=vIxgyY9pqAvOwYiyB%2BxAGC16ztjNWWUgF31RhVxs31M%3D&reserved=0>

Hi Martin,

No problem to have that meeting on Wednesday but it will be good to have it available 1st and have a quick look.

BR,

Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531202754%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=LVRlkzYSakOtawiU8rRsm2XSQ165v%2B%2FXdYE9r3O%2BTMQ%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>

Enviado el: lunes, 27 de abril de 2026 16:53

Dear Pedro,

I have created the Excel file, but it is currently in a very informal version. We can all meet on Wednesday to discuss everything in person first— shall we do like that?

Thank you very much,
Martin

Ing. Martin Sak

Technical Manager

Savera Components CZ

17.listopadu 6242, 708 00 Ostrava-Poruba

Budova CTP OP1-B

Mobile:  +420 725 403 281

m.sak@saveragroup.com <mailto:m.sak@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531223738%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=4dkAkx3ScvYs%2B4jFU7yhIxBYD%2BYg8oYwUhEkx01buLY%3D&reserved=0>

Hi Martin,

Right now, we are wishing some work. Do you have a current Excel so we can have a look and analize if we can start with that and improve after? Key point in this kind of apps is to start using them as afterwards demands are easy to integrate.

Thanks in advance.

BR,

Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531247315%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=hnEiyepelXrJn6Xp76oWjFCrUoWqK9J6C3JHSd9H3gM%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>

Enviado el: miércoles, 22 de abril de 2026 17:45

Hello,

thank you very much for the information.

I will review the application by Friday and prepare a list of points I would like to discuss with you.

I am sure this application will be a great benefit; however, I will have some suggestions for improvements for our internal needs.

Thank you.', 1, N'Martin Sak', N'm.sak@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (4, 1, CAST(N'2026-04-27' AS Date), CAST(N'2026-04-29' AS Date), N'202600004', N'RE: Access to Offers App', N'Pedro,

Thank you for your mail.

I understand now what you mean. I spoke with Jose and I have prepared an Excel for our meeting where I outlined what the application should include.

The point is that the Excel we currently use for offers and the application I have in mind are a completely different concept.

However, I am sending you our current Excel for your review. On Wednesday, I would like to present my comments and my vision of how the application could work efficiently for our internal needs.

Thank you so much,

Martin

Ing. Martin Sak

Technical Manager

Savera Components CZ

17.listopadu 6242, 708 00 Ostrava-Poruba

Budova CTP OP1-B

Mobile:  +420 725 403 281

m.sak@saveragroup.com <mailto:m.sak@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531175163%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=vIxgyY9pqAvOwYiyB%2BxAGC16ztjNWWUgF31RhVxs31M%3D&reserved=0>

Hi Martin,

No problem to have that meeting on Wednesday but it will be good to have it available 1st and have a quick look.

BR,

Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531202754%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=LVRlkzYSakOtawiU8rRsm2XSQ165v%2B%2FXdYE9r3O%2BTMQ%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>

Enviado el: lunes, 27 de abril de 2026 16:53

Dear Pedro,

I have created the Excel file, but it is currently in a very informal version. We can all meet on Wednesday to discuss everything in person first— shall we do like that?

Thank you very much,
Martin

Ing. Martin Sak

Technical Manager

Savera Components CZ

17.listopadu 6242, 708 00 Ostrava-Poruba

Budova CTP OP1-B

Mobile:  +420 725 403 281

m.sak@saveragroup.com <mailto:m.sak@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531223738%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=4dkAkx3ScvYs%2B4jFU7yhIxBYD%2BYg8oYwUhEkx01buLY%3D&reserved=0>

Hi Martin,

Right now, we are wishing some work. Do you have a current Excel so we can have a look and analize if we can start with that and improve after? Key point in this kind of apps is to start using them as afterwards demands are easy to integrate.

Thanks in advance.

BR,

Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7C233a79a92eb9496ede3108dea480cce5%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129070531247315%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=hnEiyepelXrJn6Xp76oWjFCrUoWqK9J6C3JHSd9H3gM%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>

Enviado el: miércoles, 22 de abril de 2026 17:45

Hello,

thank you very much for the information.

I will review the application by Friday and prepare a list of points I would like to discuss with you.

I am sure this application will be a great benefit; however, I will have some suggestions for improvements for our internal needs.

Thank you.', 1, N'Martin Sak', N'm.sak@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (5, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600005', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, NULL, NULL)
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (6, 1, NULL, NULL, N'202600006', NULL, NULL, NULL, NULL, NULL)
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (7, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600007', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (8, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600008', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (9, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600009', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (10, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600010', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (11, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600011', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (12, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600012', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
INSERT [ofertas].[Listado_Ofertas] ([ID_oferta], [Id_estado], [Fecha_email], [Fecha_alta_oferta], [Numero_oferta], [Ref_cliente_asunto_email], [Observaciones], [Id_cliente], [Nombre_emisor], [Email_emisor]) VALUES (13, 1, CAST(N'2026-04-28' AS Date), CAST(N'2026-04-30' AS Date), N'202600013', N'Skills', N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', 1, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com')
SET IDENTITY_INSERT [ofertas].[Listado_Ofertas] OFF
GO
SET IDENTITY_INSERT [ofertas].[Oferta_ETC] ON 

INSERT [ofertas].[Oferta_ETC] ([Id_oferta_etc], [Fecha_recepcion], [Fecha_envio_oferta], [Fecha_limite_respuesta], [Id_estado], [Id_cliente], [Num_operario_responsable], [Id_departamento_destino], [Codigo_externo_oferta], [Codigo_interno_oferta], [Referencia_cliente], [Numero_comision], [PO_original], [Pedido_b2b], [Proyecto], [Nombre_solicitante], [Email_solicitante], [Empresa_solicitante], [Incoterm], [Moneda], [Prioridad], [Es_urgente], [Resumen_material_solicitado], [Resumen_material_ofertado], [Total_material_eur], [Total_fee_eur], [Observaciones_cliente], [Observaciones_tecnicas], [Observaciones_internas], [Origen_registro], [Activo], [Fecha_creacion], [Fecha_actualizacion]) VALUES (1, CAST(N'2026-04-28' AS Date), NULL, NULL, 1, 1, 999, 3, NULL, NULL, N'Skills', NULL, NULL, NULL, NULL, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com', NULL, NULL, N'EUR', N'NORMAL', 0, NULL, NULL, NULL, NULL, N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', NULL, NULL, N'MANUAL', 1, CAST(N'2026-04-30T08:55:09.0000000' AS DateTime2), CAST(N'2026-04-30T08:55:09.0000000' AS DateTime2))
INSERT [ofertas].[Oferta_ETC] ([Id_oferta_etc], [Fecha_recepcion], [Fecha_envio_oferta], [Fecha_limite_respuesta], [Id_estado], [Id_cliente], [Num_operario_responsable], [Id_departamento_destino], [Codigo_externo_oferta], [Codigo_interno_oferta], [Referencia_cliente], [Numero_comision], [PO_original], [Pedido_b2b], [Proyecto], [Nombre_solicitante], [Email_solicitante], [Empresa_solicitante], [Incoterm], [Moneda], [Prioridad], [Es_urgente], [Resumen_material_solicitado], [Resumen_material_ofertado], [Total_material_eur], [Total_fee_eur], [Observaciones_cliente], [Observaciones_tecnicas], [Observaciones_internas], [Origen_registro], [Activo], [Fecha_creacion], [Fecha_actualizacion]) VALUES (2, CAST(N'2026-04-28' AS Date), NULL, NULL, 1, 1, 0, NULL, NULL, NULL, N'Skills', NULL, NULL, NULL, NULL, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com', NULL, NULL, N'EUR', N'NORMAL', 0, NULL, NULL, NULL, NULL, N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', NULL, NULL, N'MANUAL', 1, CAST(N'2026-04-30T08:58:13.0000000' AS DateTime2), CAST(N'2026-04-30T08:58:13.0000000' AS DateTime2))
INSERT [ofertas].[Oferta_ETC] ([Id_oferta_etc], [Fecha_recepcion], [Fecha_envio_oferta], [Fecha_limite_respuesta], [Id_estado], [Id_cliente], [Num_operario_responsable], [Id_departamento_destino], [Codigo_externo_oferta], [Codigo_interno_oferta], [Referencia_cliente], [Numero_comision], [PO_original], [Pedido_b2b], [Proyecto], [Nombre_solicitante], [Email_solicitante], [Empresa_solicitante], [Incoterm], [Moneda], [Prioridad], [Es_urgente], [Resumen_material_solicitado], [Resumen_material_ofertado], [Total_material_eur], [Total_fee_eur], [Observaciones_cliente], [Observaciones_tecnicas], [Observaciones_internas], [Origen_registro], [Activo], [Fecha_creacion], [Fecha_actualizacion]) VALUES (3, CAST(N'2026-04-28' AS Date), NULL, NULL, 1, 1, 999, 3, N'123', NULL, N'Skills', NULL, NULL, NULL, NULL, N'Pedro Ignacio Cortés Murillo', N'pi.cortes@saveragroup.com', NULL, N'123', N'EUR', N'NORMAL', 0, NULL, NULL, NULL, NULL, N'Pedro Cortés

Departamento Digitalización/ Digitalization department

EMESA

Tel.: +34976819191-Ext.4271; Mvl: +34 659718807

pi.cortes@saveragroup.com <mailto:pi.cortes@saveragroup.com>

www.sgemesa.com <https://eur04.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.sgemesa.com%2F&data=05%7C02%7Cj.barutell%40saveragroup.com%7Ce007ad73fba84278a59608dea525e5ed%7C69181b665af04bb7a76d6f904c038b59%7C0%7C0%7C639129779962922481%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=pKHEKbC5S%2FenvpsOuIIzLNEac5mlFnkZixDbERzN%2Ftc%3D&reserved=0>

Este mensaje y sus archivos son confidenciales. No está permitida su reproducción o distribución sin la autorización expresa de Estampaciones Metálicas Epila S.A,, si usted no es el destinatario previsto, cualquier uso, acceso o copia de este mensaje queda desautorizada. Si ha recibido este mensaje por error, por favor bórrelo e infórmenos por esta misma vía.

De acuerdo con la LSSICE y la LOPD, le comunicamos que sus datos personales y dirección de correo electrónico forman parte de un fichero automatizado, cuyo responsable es Estampaciones Metálicas Epila S.A,, siendo la finalidad del fichero la gestión de carácter comercial y administrativa, así como el envío de comunicados de carácter comercial sobre nuestros productos. Si lo desea puede ejercer los derechos de acceso, rectificación, cancelación y oposición de sus datos enviando un mensaje de correo electrónico a emesa@saveragroup.com <mailto:emesa@saveragroup.com>', NULL, NULL, N'MANUAL', 1, CAST(N'2026-04-30T09:15:33.0000000' AS DateTime2), CAST(N'2026-04-30T09:15:33.0000000' AS DateTime2))
SET IDENTITY_INSERT [ofertas].[Oferta_ETC] OFF
GO
SET IDENTITY_INSERT [ofertas].[Oferta_Interacciones] ON 

INSERT [ofertas].[Oferta_Interacciones] ([ID_interaccion], [ID_oferta], [Tipo_interaccion], [Fecha_interaccion], [Observaciones], [Fecha_limite]) VALUES (1, 1, N'Pendiente -> Pendiente Tecnico', CAST(N'2026-04-29T11:49:03.0000000' AS DateTime2), NULL, NULL)
INSERT [ofertas].[Oferta_Interacciones] ([ID_interaccion], [ID_oferta], [Tipo_interaccion], [Fecha_interaccion], [Observaciones], [Fecha_limite]) VALUES (2, 2, N'Pendiente -> Pendiente Tecnico', CAST(N'2026-04-29T11:55:36.0000000' AS DateTime2), NULL, NULL)
INSERT [ofertas].[Oferta_Interacciones] ([ID_interaccion], [ID_oferta], [Tipo_interaccion], [Fecha_interaccion], [Observaciones], [Fecha_limite]) VALUES (3, 2, N'Pendiente Tecnico -> Pendiente', CAST(N'2026-04-29T11:55:55.0000000' AS DateTime2), NULL, CAST(N'2026-04-29' AS Date))
INSERT [ofertas].[Oferta_Interacciones] ([ID_interaccion], [ID_oferta], [Tipo_interaccion], [Fecha_interaccion], [Observaciones], [Fecha_limite]) VALUES (4, 2, N'Pendiente -> Pendiente Tecnico', CAST(N'2026-04-30T08:03:33.0000000' AS DateTime2), NULL, NULL)
INSERT [ofertas].[Oferta_Interacciones] ([ID_interaccion], [ID_oferta], [Tipo_interaccion], [Fecha_interaccion], [Observaciones], [Fecha_limite]) VALUES (5, 1, N'Pendiente Tecnico -> Pendiente', CAST(N'2026-04-30T08:03:43.0000000' AS DateTime2), NULL, NULL)
SET IDENTITY_INSERT [ofertas].[Oferta_Interacciones] OFF
GO
SET IDENTITY_INSERT [ofertas].[Proyectos] ON 

INSERT [ofertas].[Proyectos] ([Id_proyecto], [Descripcion_proyecto]) VALUES (1, N'ES1')
INSERT [ofertas].[Proyectos] ([Id_proyecto], [Descripcion_proyecto]) VALUES (2, N'ES5')
SET IDENTITY_INSERT [ofertas].[Proyectos] OFF
GO
INSERT [ofertas].[Roles] ([Id_rol], [Nombre_rol], [Descripcion]) VALUES (1, N'Manager', N'Usuario con permisos de gestion')
INSERT [ofertas].[Roles] ([Id_rol], [Nombre_rol], [Descripcion]) VALUES (2, N'Estandar', N'Usuario operativo estandar')
GO
INSERT [ofertas].[Usuarios_Config] ([Num_operario], [Id_departamento], [Id_rol], [Fecha_asignacion], [Email]) VALUES (0, 5, 1, CAST(N'2026-04-29T10:55:30.663' AS DateTime), NULL)
INSERT [ofertas].[Usuarios_Config] ([Num_operario], [Id_departamento], [Id_rol], [Fecha_asignacion], [Email]) VALUES (999, 3, 1, CAST(N'2026-04-30T08:23:45.707' AS DateTime), N'pi.cortes@saveragroup.com')
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Departamentos_Nombre]    Script Date: 30/04/2026 11:02:33 ******/
ALTER TABLE [ofertas].[Departamentos] ADD  CONSTRAINT [UQ_Departamentos_Nombre] UNIQUE NONCLUSTERED 
(
	[Nombre_departamento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Proyectos_Descripcion]    Script Date: 30/04/2026 11:02:33 ******/
ALTER TABLE [ofertas].[Proyectos] ADD  CONSTRAINT [UQ_Proyectos_Descripcion] UNIQUE NONCLUSTERED 
(
	[Descripcion_proyecto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Roles_Nombre]    Script Date: 30/04/2026 11:02:33 ******/
ALTER TABLE [ofertas].[Roles] ADD  CONSTRAINT [UQ_Roles_Nombre] UNIQUE NONCLUSTERED 
(
	[Nombre_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [ofertas].[Departamentos] ADD  CONSTRAINT [DF_Departamentos_Estado_activo]  DEFAULT ((1)) FOR [Estado_activo]
GO
ALTER TABLE [ofertas].[Departamentos] ADD  CONSTRAINT [DF_Departamentos_Fecha_creacion]  DEFAULT (getdate()) FOR [Fecha_creacion]
GO
ALTER TABLE [ofertas].[Listado_Ofertas] ADD  CONSTRAINT [DF_Listado_Ofertas_Id_estado]  DEFAULT ((1)) FOR [Id_estado]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Id_estado]  DEFAULT ((1)) FOR [Id_estado]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Moneda]  DEFAULT ('EUR') FOR [Moneda]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Prioridad]  DEFAULT ('NORMAL') FOR [Prioridad]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Es_urgente]  DEFAULT ((0)) FOR [Es_urgente]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Origen_registro]  DEFAULT ('MANUAL') FOR [Origen_registro]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Activo]  DEFAULT ((1)) FOR [Activo]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Fecha_creacion]  DEFAULT (sysdatetime()) FOR [Fecha_creacion]
GO
ALTER TABLE [ofertas].[Oferta_ETC] ADD  CONSTRAINT [DF_Oferta_ETC_Fecha_actualizacion]  DEFAULT (sysdatetime()) FOR [Fecha_actualizacion]
GO
ALTER TABLE [ofertas].[Usuarios_Config] ADD  CONSTRAINT [DF_Usuarios_Config_Fecha_asignacion]  DEFAULT (getdate()) FOR [Fecha_asignacion]
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
ALTER TABLE [ofertas].[estados]  WITH CHECK ADD  CONSTRAINT [FK_Estados_Departamentos] FOREIGN KEY([Id_departamento])
REFERENCES [ofertas].[Departamentos] ([Id_departamento])
GO
ALTER TABLE [ofertas].[estados] CHECK CONSTRAINT [FK_Estados_Departamentos]
GO
ALTER TABLE [ofertas].[Listado_Ofertas]  WITH CHECK ADD  CONSTRAINT [FK_Listado_Ofertas_Clientes] FOREIGN KEY([Id_cliente])
REFERENCES [ofertas].[clientes] ([Id_cliente])
GO
ALTER TABLE [ofertas].[Listado_Ofertas] CHECK CONSTRAINT [FK_Listado_Ofertas_Clientes]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [FK_Oferta_ETC_Clientes] FOREIGN KEY([Id_cliente])
REFERENCES [ofertas].[clientes] ([Id_cliente])
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [FK_Oferta_ETC_Clientes]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [FK_Oferta_ETC_Departamentos] FOREIGN KEY([Id_departamento_destino])
REFERENCES [ofertas].[Departamentos] ([Id_departamento])
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [FK_Oferta_ETC_Departamentos]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [FK_Oferta_ETC_Estados] FOREIGN KEY([Id_estado])
REFERENCES [ofertas].[estados] ([Id_estado])
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [FK_Oferta_ETC_Estados]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [FK_Oferta_ETC_Usuarios_Config] FOREIGN KEY([Num_operario_responsable])
REFERENCES [ofertas].[Usuarios_Config] ([Num_operario])
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [FK_Oferta_ETC_Usuarios_Config]
GO
ALTER TABLE [ofertas].[Oferta_Interacciones]  WITH CHECK ADD  CONSTRAINT [FK_Oferta_Interacciones_Listado_Ofertas] FOREIGN KEY([ID_oferta])
REFERENCES [ofertas].[Listado_Ofertas] ([ID_oferta])
GO
ALTER TABLE [ofertas].[Oferta_Interacciones] CHECK CONSTRAINT [FK_Oferta_Interacciones_Listado_Ofertas]
GO
ALTER TABLE [ofertas].[Usuarios_Config]  WITH CHECK ADD  CONSTRAINT [FK_Usuarios_Config_Departamentos] FOREIGN KEY([Id_departamento])
REFERENCES [ofertas].[Departamentos] ([Id_departamento])
GO
ALTER TABLE [ofertas].[Usuarios_Config] CHECK CONSTRAINT [FK_Usuarios_Config_Departamentos]
GO
ALTER TABLE [ofertas].[Usuarios_Config]  WITH CHECK ADD  CONSTRAINT [FK_Usuarios_Config_Roles] FOREIGN KEY([Id_rol])
REFERENCES [ofertas].[Roles] ([Id_rol])
GO
ALTER TABLE [ofertas].[Usuarios_Config] CHECK CONSTRAINT [FK_Usuarios_Config_Roles]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_ETC_Email_solicitante] CHECK  (([Email_solicitante] IS NULL OR charindex('@',[Email_solicitante])>(1)))
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [CK_Oferta_ETC_Email_solicitante]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_ETC_Fechas] CHECK  (([Fecha_envio_oferta] IS NULL OR [Fecha_recepcion] IS NULL OR [Fecha_envio_oferta]>=[Fecha_recepcion]))
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [CK_Oferta_ETC_Fechas]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_ETC_Importes] CHECK  ((([Total_material_eur] IS NULL OR [Total_material_eur]>=(0)) AND ([Total_fee_eur] IS NULL OR [Total_fee_eur]>=(0))))
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [CK_Oferta_ETC_Importes]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_ETC_Incoterm] CHECK  (([Incoterm] IS NULL OR len(ltrim(rtrim([Incoterm])))>=(3) AND len(ltrim(rtrim([Incoterm])))<=(10)))
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [CK_Oferta_ETC_Incoterm]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_ETC_Moneda] CHECK  ((len([Moneda])=(3) AND [Moneda]=upper([Moneda])))
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [CK_Oferta_ETC_Moneda]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_ETC_Origen_registro] CHECK  (([Origen_registro]='IMPORTACION' OR [Origen_registro]='EXCEL' OR [Origen_registro]='EMAIL' OR [Origen_registro]='MANUAL'))
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [CK_Oferta_ETC_Origen_registro]
GO
ALTER TABLE [ofertas].[Oferta_ETC]  WITH CHECK ADD  CONSTRAINT [CK_Oferta_ETC_Prioridad] CHECK  (([Prioridad]='CRITICA' OR [Prioridad]='ALTA' OR [Prioridad]='NORMAL' OR [Prioridad]='BAJA'))
GO
ALTER TABLE [ofertas].[Oferta_ETC] CHECK CONSTRAINT [CK_Oferta_ETC_Prioridad]
GO
ALTER TABLE [ofertas].[Usuarios_Config]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_Config_Num_operario] CHECK  (([Num_operario]>=(0)))
GO
ALTER TABLE [ofertas].[Usuarios_Config] CHECK CONSTRAINT [CK_Usuarios_Config_Num_operario]
GO
/****** Object:  Trigger [ofertas].[TR_Listado_Ofertas_Autogenerar_NumeroOferta]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE   TRIGGER [ofertas].[TR_Listado_Ofertas_Autogenerar_NumeroOferta]
ON [ofertas].[Listado_Ofertas]
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
ALTER TABLE [ofertas].[Listado_Ofertas] ENABLE TRIGGER [TR_Listado_Ofertas_Autogenerar_NumeroOferta]
GO
/****** Object:  Trigger [ofertas].[TR_Oferta_ETC_Fecha_actualizacion]    Script Date: 30/04/2026 11:02:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE   TRIGGER [ofertas].[TR_Oferta_ETC_Fecha_actualizacion]
ON [ofertas].[Oferta_ETC]
AFTER UPDATE
AS
BEGIN
	SET NOCOUNT ON;

	IF TRIGGER_NESTLEVEL() > 1
	BEGIN
		RETURN;
	END;

	UPDATE o
	SET Fecha_actualizacion = SYSDATETIME()
	FROM ofertas.Oferta_ETC o
	INNER JOIN inserted i
		ON i.Id_oferta_etc = o.Id_oferta_etc;
END;
GO
ALTER TABLE [ofertas].[Oferta_ETC] ENABLE TRIGGER [TR_Oferta_ETC_Fecha_actualizacion]
GO
