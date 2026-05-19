USE [DataLakeSCCZ]
GO
/****** Object:  Table [ofertas].[listado_ofertas]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[listado_ofertas](
	[id_oferta] [int] IDENTITY(1,1) NOT NULL,
	[id_estado] [int] NOT NULL,
	[fecha_email] [date] NULL,
	[fecha_alta_oferta] [date] NULL,
	[numero_oferta] [nvarchar](50) NULL,
	[ref_cliente_asunto_email] [nvarchar](500) NULL,
	[observaciones] [nvarchar](max) NULL,
	[id_cliente] [int] NULL,
	[nombre_emisor] [nvarchar](255) NULL,
	[email_emisor] [nvarchar](255) NULL,
 CONSTRAINT [pk_listado_ofertas] PRIMARY KEY CLUSTERED 
(
	[id_oferta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[oferta_correos_importados]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[oferta_correos_importados](
	[id_correo_importado] [int] IDENTITY(1,1) NOT NULL,
	[id_oferta] [int] NOT NULL,
	[source_type] [nvarchar](32) NULL,
	[conversation_id] [nvarchar](255) NULL,
	[internet_message_id] [nvarchar](512) NULL,
	[in_reply_to_message_id] [nvarchar](512) NULL,
	[reference_message_ids_json] [nvarchar](max) NULL,
	[subject] [nvarchar](500) NULL,
	[sender_name] [nvarchar](255) NULL,
	[sender_email] [nvarchar](255) NULL,
	[received_at] [datetime2](0) NULL,
	[body_sha256] [char](64) NULL,
	[fecha_registro] [datetime2](0) NOT NULL,
 CONSTRAINT [pk_oferta_correos_importados] PRIMARY KEY CLUSTERED 
(
	[id_correo_importado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[oferta_interacciones]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[oferta_interacciones](
	[id_interaccion] [int] IDENTITY(1,1) NOT NULL,
	[id_oferta] [int] NOT NULL,
	[tipo_interaccion] [nvarchar](255) NOT NULL,
	[fecha_interaccion] [datetime2](0) NOT NULL,
	[observaciones] [nvarchar](500) NULL,
	[fecha_limite] [date] NULL,
 CONSTRAINT [pk_oferta_interacciones] PRIMARY KEY CLUSTERED 
(
	[id_interaccion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[clientes]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[clientes](
	[id_cliente] [int] IDENTITY(1,1) NOT NULL,
	[descripcion_cliente] [varchar](255) NOT NULL,
	[dominio] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_cliente] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[estados]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[estados](
	[id_estado] [int] IDENTITY(1,1) NOT NULL,
	[descripcion_estado] [varchar](255) NOT NULL,
	[orden] [int] NULL,
	[id_departamento] [int] NULL,
	[emoji_sidebar] [nvarchar](8) NULL,
	[activo] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [ofertas].[vw_listado_ofertas_interacciones]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


create   view [ofertas].[vw_listado_ofertas_interacciones]
as
select
	lo.id_oferta,
	e.descripcion_estado as estado,
	lo.fecha_email,
	lo.fecha_alta_oferta,
	lo.numero_oferta,
	lo.ref_cliente_asunto_email,
	case
		when nullif(ltrim(rtrim(isnull(lo.nombre_emisor, ''))), '') is not null
			and nullif(ltrim(rtrim(isnull(lo.email_emisor, ''))), '') is not null
			then concat(ltrim(rtrim(lo.nombre_emisor)), ' <', ltrim(rtrim(lo.email_emisor)), '>')
		when nullif(ltrim(rtrim(isnull(lo.email_emisor, ''))), '') is not null
			then ltrim(rtrim(lo.email_emisor))
		else nullif(ltrim(rtrim(isnull(lo.nombre_emisor, ''))), '')
	end as emisor,
	lo.nombre_emisor,
	lo.email_emisor,
	c.descripcion_cliente as cliente,
	lo.observaciones as observaciones_oferta,
	oi.id_interaccion,
	oi.tipo_interaccion,
	oi.fecha_interaccion,
	oi.fecha_limite,
	oi.observaciones as observaciones_interaccion
from ofertas.listado_ofertas lo
left join ofertas.oferta_interacciones oi
	on lo.id_oferta = oi.id_oferta
left join ofertas.estados e
	on lo.id_estado = e.id_estado
left join ofertas.clientes c
	on lo.id_cliente = c.id_cliente;
GO
/****** Object:  Table [ofertas].[configuracioncolumnas]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[configuracioncolumnas](
	[id_config] [int] IDENTITY(1,1) NOT NULL,
	[id_estado] [int] NOT NULL,
	[columna] [varchar](100) NOT NULL,
	[descripcion_columna] [varchar](255) NULL,
	[orden_columna] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_config] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[departamentos]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[departamentos](
	[id_departamento] [int] IDENTITY(1,1) NOT NULL,
	[nombre_departamento] [varchar](255) NOT NULL,
	[descripcion] [nvarchar](500) NULL,
	[estado_activo] [bit] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
 CONSTRAINT [pk_departamentos] PRIMARY KEY CLUSTERED 
(
	[id_departamento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_departamentos_nombre] UNIQUE NONCLUSTERED 
(
	[nombre_departamento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[oferta_etc]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[oferta_etc](
	[id_oferta_etc] [int] IDENTITY(1,1) NOT NULL,
	[fecha_recepcion] [date] NULL,
	[fecha_envio_oferta] [date] NULL,
	[fecha_limite_respuesta] [date] NULL,
	[id_estado] [int] NOT NULL,
	[id_cliente] [int] NULL,
	[num_operario_responsable] [int] NULL,
	[id_departamento_destino] [int] NULL,
	[codigo_externo_oferta] [nvarchar](100) NULL,
	[codigo_interno_oferta] [nvarchar](100) NULL,
	[referencia_cliente] [nvarchar](255) NULL,
	[numero_comision] [nvarchar](100) NULL,
	[po_original] [nvarchar](100) NULL,
	[pedido_b2b] [nvarchar](100) NULL,
	[proyecto] [nvarchar](255) NULL,
	[nombre_solicitante] [nvarchar](255) NULL,
	[email_solicitante] [nvarchar](255) NULL,
	[empresa_solicitante] [nvarchar](255) NULL,
	[incoterm] [varchar](10) NULL,
	[moneda] [char](3) NOT NULL,
	[prioridad] [varchar](20) NOT NULL,
	[es_urgente] [bit] NOT NULL,
	[resumen_material_solicitado] [nvarchar](max) NULL,
	[resumen_material_ofertado] [nvarchar](max) NULL,
	[total_material_eur] [decimal](18, 2) NULL,
	[total_fee_eur] [decimal](18, 2) NULL,
	[total_oferta_eur]  AS (case when [total_material_eur] IS NULL AND [total_fee_eur] IS NULL then NULL else isnull([total_material_eur],(0))+isnull([total_fee_eur],(0)) end) PERSISTED,
	[observaciones_cliente] [nvarchar](max) NULL,
	[observaciones_tecnicas] [nvarchar](max) NULL,
	[observaciones_internas] [nvarchar](max) NULL,
	[origen_registro] [varchar](20) NOT NULL,
	[activo] [bit] NOT NULL,
	[fecha_creacion] [datetime2](0) NOT NULL,
	[fecha_actualizacion] [datetime2](0) NOT NULL,
 CONSTRAINT [pk_oferta_etc] PRIMARY KEY CLUSTERED 
(
	[id_oferta_etc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[proyectos]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[proyectos](
	[id_proyecto] [int] IDENTITY(1,1) NOT NULL,
	[descripcion_proyecto] [nvarchar](255) NOT NULL,
 CONSTRAINT [pk_proyectos] PRIMARY KEY CLUSTERED 
(
	[id_proyecto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_proyectos_descripcion] UNIQUE NONCLUSTERED 
(
	[descripcion_proyecto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[materiales_precio]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[materiales_precio](
	[id_material_precio] [int] IDENTITY(1,1) NOT NULL,
	[material] [nvarchar](255) NOT NULL,
	[precio] [decimal](18, 2) NOT NULL,
 CONSTRAINT [pk_materiales_precio] PRIMARY KEY CLUSTERED 
(
	[id_material_precio] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[roles]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[roles](
	[id_rol] [int] NOT NULL,
	[nombre_rol] [varchar](100) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
 CONSTRAINT [pk_roles] PRIMARY KEY CLUSTERED 
(
	[id_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_roles_nombre] UNIQUE NONCLUSTERED 
(
	[nombre_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [ofertas].[usuarios_config]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [ofertas].[usuarios_config](
	[num_operario] [int] NOT NULL,
	[id_departamento] [int] NULL,
	[id_rol] [int] NOT NULL,
	[fecha_asignacion] [datetime] NOT NULL,
	[email] [varchar](255) NULL,
 CONSTRAINT [pk_usuarios_config] PRIMARY KEY CLUSTERED 
(
	[num_operario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [ofertas].[departamentos] ADD  CONSTRAINT [df_departamentos_estado_activo]  DEFAULT ((1)) FOR [estado_activo]
GO
ALTER TABLE [ofertas].[departamentos] ADD  CONSTRAINT [df_departamentos_fecha_creacion]  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [ofertas].[estados] ADD  CONSTRAINT [df_estados_activo]  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [ofertas].[listado_ofertas] ADD  CONSTRAINT [df_listado_ofertas_id_estado]  DEFAULT ((1)) FOR [id_estado]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_id_estado]  DEFAULT ((1)) FOR [id_estado]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_moneda]  DEFAULT ('EUR') FOR [moneda]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_prioridad]  DEFAULT ('NORMAL') FOR [prioridad]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_es_urgente]  DEFAULT ((0)) FOR [es_urgente]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_origen_registro]  DEFAULT ('MANUAL') FOR [origen_registro]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_activo]  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_fecha_creacion]  DEFAULT (sysdatetime()) FOR [fecha_creacion]
GO
ALTER TABLE [ofertas].[oferta_etc] ADD  CONSTRAINT [df_oferta_etc_fecha_actualizacion]  DEFAULT (sysdatetime()) FOR [fecha_actualizacion]
GO
ALTER TABLE [ofertas].[materiales_precio] ADD  [fecha_creacion] [datetime2](0) NOT NULL CONSTRAINT [df_materiales_precio_fecha_creacion]  DEFAULT (sysdatetime())
GO
ALTER TABLE [ofertas].[usuarios_config] ADD  CONSTRAINT [df_usuarios_config_fecha_asignacion]  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [ofertas].[configuracioncolumnas]  WITH CHECK ADD  CONSTRAINT [fk_config_estado] FOREIGN KEY([id_estado])
REFERENCES [ofertas].[estados] ([id_estado])
GO
ALTER TABLE [ofertas].[configuracioncolumnas] CHECK CONSTRAINT [fk_config_estado]
GO
ALTER TABLE [ofertas].[configuracioncolumnas]  WITH CHECK ADD  CONSTRAINT [fk_configuracioncolumnas_estados] FOREIGN KEY([id_estado])
REFERENCES [ofertas].[estados] ([id_estado])
GO
ALTER TABLE [ofertas].[configuracioncolumnas] CHECK CONSTRAINT [fk_configuracioncolumnas_estados]
GO
ALTER TABLE [ofertas].[estados]  WITH CHECK ADD  CONSTRAINT [fk_estados_departamentos] FOREIGN KEY([id_departamento])
REFERENCES [ofertas].[departamentos] ([id_departamento])
GO
ALTER TABLE [ofertas].[estados] CHECK CONSTRAINT [fk_estados_departamentos]
GO
ALTER TABLE [ofertas].[listado_ofertas]  WITH CHECK ADD  CONSTRAINT [fk_listado_ofertas_clientes] FOREIGN KEY([id_cliente])
REFERENCES [ofertas].[clientes] ([id_cliente])
GO
ALTER TABLE [ofertas].[listado_ofertas] CHECK CONSTRAINT [fk_listado_ofertas_clientes]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [fk_oferta_etc_clientes] FOREIGN KEY([id_cliente])
REFERENCES [ofertas].[clientes] ([id_cliente])
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [fk_oferta_etc_clientes]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [fk_oferta_etc_departamentos] FOREIGN KEY([id_departamento_destino])
REFERENCES [ofertas].[departamentos] ([id_departamento])
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [fk_oferta_etc_departamentos]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [fk_oferta_etc_estados] FOREIGN KEY([id_estado])
REFERENCES [ofertas].[estados] ([id_estado])
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [fk_oferta_etc_estados]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [fk_oferta_etc_usuarios_config] FOREIGN KEY([num_operario_responsable])
REFERENCES [ofertas].[usuarios_config] ([num_operario])
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [fk_oferta_etc_usuarios_config]
GO
ALTER TABLE [ofertas].[oferta_interacciones]  WITH CHECK ADD  CONSTRAINT [fk_oferta_interacciones_listado_ofertas] FOREIGN KEY([id_oferta])
REFERENCES [ofertas].[listado_ofertas] ([id_oferta])
GO
ALTER TABLE [ofertas].[oferta_interacciones] CHECK CONSTRAINT [fk_oferta_interacciones_listado_ofertas]
GO
ALTER TABLE [ofertas].[usuarios_config]  WITH CHECK ADD  CONSTRAINT [fk_usuarios_config_departamentos] FOREIGN KEY([id_departamento])
REFERENCES [ofertas].[departamentos] ([id_departamento])
GO
ALTER TABLE [ofertas].[usuarios_config] CHECK CONSTRAINT [fk_usuarios_config_departamentos]
GO
ALTER TABLE [ofertas].[usuarios_config]  WITH CHECK ADD  CONSTRAINT [fk_usuarios_config_roles] FOREIGN KEY([id_rol])
REFERENCES [ofertas].[roles] ([id_rol])
GO
ALTER TABLE [ofertas].[usuarios_config] CHECK CONSTRAINT [fk_usuarios_config_roles]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [ck_oferta_etc_email_solicitante] CHECK  (([email_solicitante] IS NULL OR charindex('@',[email_solicitante])>(1)))
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [ck_oferta_etc_email_solicitante]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [ck_oferta_etc_fechas] CHECK  (([fecha_envio_oferta] IS NULL OR [fecha_recepcion] IS NULL OR [fecha_envio_oferta]>=[fecha_recepcion]))
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [ck_oferta_etc_fechas]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [ck_oferta_etc_importes] CHECK  ((([total_material_eur] IS NULL OR [total_material_eur]>=(0)) AND ([total_fee_eur] IS NULL OR [total_fee_eur]>=(0))))
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [ck_oferta_etc_importes]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [ck_oferta_etc_incoterm] CHECK  (([incoterm] IS NULL OR len(ltrim(rtrim([incoterm])))>=(3) AND len(ltrim(rtrim([incoterm])))<=(10)))
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [ck_oferta_etc_incoterm]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [ck_oferta_etc_moneda] CHECK  ((len([moneda])=(3) AND [moneda]=upper([moneda])))
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [ck_oferta_etc_moneda]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [ck_oferta_etc_origen_registro] CHECK  (([origen_registro]='IMPORTACION' OR [origen_registro]='EXCEL' OR [origen_registro]='EMAIL' OR [origen_registro]='MANUAL'))
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [ck_oferta_etc_origen_registro]
GO
ALTER TABLE [ofertas].[oferta_etc]  WITH CHECK ADD  CONSTRAINT [ck_oferta_etc_prioridad] CHECK  (([prioridad]='CRITICA' OR [prioridad]='ALTA' OR [prioridad]='NORMAL' OR [prioridad]='BAJA'))
GO
ALTER TABLE [ofertas].[oferta_etc] CHECK CONSTRAINT [ck_oferta_etc_prioridad]
GO
ALTER TABLE [ofertas].[usuarios_config]  WITH CHECK ADD  CONSTRAINT [ck_usuarios_config_num_operario] CHECK  (([num_operario]>=(0)))
GO
ALTER TABLE [ofertas].[usuarios_config] CHECK CONSTRAINT [ck_usuarios_config_num_operario]
GO
/****** Object:  Trigger [ofertas].[tr_listado_ofertas_autogenerar_numerooferta]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

create   trigger [ofertas].[tr_listado_ofertas_autogenerar_numerooferta]
on [ofertas].[listado_ofertas]
after insert
as
begin
	set nocount on;

	declare @anio char(4) = convert(char(4), year(getdate()));

	;with base as (
		select isnull(max(try_convert(int, right(numero_oferta, 5))), 0) as ultimocorrelativo
		from ofertas.listado_ofertas with (updlock, holdlock)
		where left(isnull(numero_oferta, ''), 4) = @anio
	), pendientes as (
		select i.id_oferta,
			row_number() over (order by i.id_oferta) as ordencorrelativo
		from inserted i
		where isnull(i.numero_oferta, '') = ''
	), numerados as (
		select p.id_oferta,
			concat(@anio, right('00000' + cast((b.ultimocorrelativo + p.ordencorrelativo) as varchar(5)), 5)) as numerooferta
		from pendientes p
		cross join base b
	)
	update lo
	set lo.numero_oferta = n.numerooferta,
		lo.id_estado = 1
	from ofertas.listado_ofertas lo
	inner join numerados n
		on lo.id_oferta = n.id_oferta;
end;
GO
ALTER TABLE [ofertas].[listado_ofertas] ENABLE TRIGGER [tr_listado_ofertas_autogenerar_numerooferta]
GO
/****** Object:  Trigger [ofertas].[tr_oferta_etc_fecha_actualizacion]    Script Date: 30/04/2026 11:23:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

create   trigger [ofertas].[tr_oferta_etc_fecha_actualizacion]
on [ofertas].[oferta_etc]
after update
as
begin
	set nocount on;

	if trigger_nestlevel() > 1
	begin
		return;
	end;

	update o
	set fecha_actualizacion = sysdatetime()
	from ofertas.oferta_etc o
	inner join inserted i
		on i.id_oferta_etc = o.id_oferta_etc;
end;
GO
ALTER TABLE [ofertas].[oferta_etc] ENABLE TRIGGER [tr_oferta_etc_fecha_actualizacion]
GO
