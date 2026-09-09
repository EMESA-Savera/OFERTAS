/*
   Almacén aditivo de mensajes de correo por oferta.
   No altera ni migra el contenido de listado_ofertas.observaciones.
*/
IF OBJECT_ID('ofertas.oferta_correos', 'U') IS NULL
BEGIN
    CREATE TABLE ofertas.oferta_correos (
        id_correo INT IDENTITY(1,1) NOT NULL,
        id_oferta INT NOT NULL,
        message_key NVARCHAR(80) NOT NULL,
        source_type NVARCHAR(32) NULL,
        conversation_id NVARCHAR(255) NULL,
        internet_message_id NVARCHAR(512) NULL,
        in_reply_to_message_id NVARCHAR(512) NULL,
        reference_message_ids_json NVARCHAR(MAX) NULL,
        subject NVARCHAR(500) NULL,
        sender_name NVARCHAR(255) NULL,
        sender_email NVARCHAR(255) NULL,
        received_at DATETIME2(0) NULL,
        body_text NVARCHAR(MAX) NOT NULL,
        body_sha256 CHAR(64) NOT NULL,
        fragment_index INT NULL,
        extraction_method NVARCHAR(32) NOT NULL
            CONSTRAINT df_oferta_correos_extraction_method DEFAULT ('body_only'),
        extraction_confidence NVARCHAR(16) NOT NULL
            CONSTRAINT df_oferta_correos_extraction_confidence DEFAULT ('low'),
        fecha_registro DATETIME2(0) NOT NULL
            CONSTRAINT df_oferta_correos_fecha_registro DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT pk_oferta_correos PRIMARY KEY CLUSTERED (id_correo),
        CONSTRAINT fk_oferta_correos_oferta FOREIGN KEY (id_oferta)
            REFERENCES ofertas.listado_ofertas(id_oferta)
    );
END
GO

IF COL_LENGTH('ofertas.oferta_correos', 'extraction_method') IS NULL
BEGIN
    ALTER TABLE ofertas.oferta_correos ADD extraction_method NVARCHAR(32) NOT NULL
        CONSTRAINT df_oferta_correos_extraction_method DEFAULT ('body_only');
END
GO

IF COL_LENGTH('ofertas.oferta_correos', 'extraction_confidence') IS NULL
BEGIN
    ALTER TABLE ofertas.oferta_correos ADD extraction_confidence NVARCHAR(16) NOT NULL
        CONSTRAINT df_oferta_correos_extraction_confidence DEFAULT ('low');
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ux_oferta_correos_message_key'
      AND object_id = OBJECT_ID('ofertas.oferta_correos')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX ux_oferta_correos_message_key
        ON ofertas.oferta_correos (id_oferta, message_key);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ix_oferta_correos_oferta_received_at'
      AND object_id = OBJECT_ID('ofertas.oferta_correos')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_oferta_correos_oferta_received_at
        ON ofertas.oferta_correos (id_oferta, received_at, id_correo)
        INCLUDE (subject, sender_name, sender_email, fragment_index);
END
GO
