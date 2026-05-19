IF OBJECT_ID('ofertas.oferta_correos_importados', 'U') IS NULL
BEGIN
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
        [fecha_registro] [datetime2](0) NOT NULL CONSTRAINT [df_oferta_correos_importados_fecha_registro] DEFAULT (SYSUTCDATETIME()),
     CONSTRAINT [pk_oferta_correos_importados] PRIMARY KEY CLUSTERED 
    (
        [id_correo_importado] ASC
    ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'fk_oferta_correos_importados_oferta'
      AND parent_object_id = OBJECT_ID('ofertas.oferta_correos_importados')
)
BEGIN
    ALTER TABLE [ofertas].[oferta_correos_importados] WITH CHECK
    ADD CONSTRAINT [fk_oferta_correos_importados_oferta]
        FOREIGN KEY([id_oferta]) REFERENCES [ofertas].[listado_ofertas]([id_oferta]);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'ux_oferta_correos_importados_internet_message_id'
      AND object_id = OBJECT_ID('ofertas.oferta_correos_importados')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [ux_oferta_correos_importados_internet_message_id]
        ON [ofertas].[oferta_correos_importados]([internet_message_id])
        WHERE [internet_message_id] IS NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'ix_oferta_correos_importados_conversation_id'
      AND object_id = OBJECT_ID('ofertas.oferta_correos_importados')
)
BEGIN
    CREATE NONCLUSTERED INDEX [ix_oferta_correos_importados_conversation_id]
        ON [ofertas].[oferta_correos_importados]([conversation_id], [id_oferta])
        INCLUDE([internet_message_id], [received_at]);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'ix_oferta_correos_importados_oferta_received_at'
      AND object_id = OBJECT_ID('ofertas.oferta_correos_importados')
)
BEGIN
    CREATE NONCLUSTERED INDEX [ix_oferta_correos_importados_oferta_received_at]
        ON [ofertas].[oferta_correos_importados]([id_oferta], [received_at] DESC)
        INCLUDE([internet_message_id], [conversation_id], [sender_email], [body_sha256]);
END
GO