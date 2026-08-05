"""Explora la BD en busca de:
1) Cualquier tabla/columna que guarde nombres de archivos adjuntos o rutas
   (para ver si el proceso de adjuntos deja rastro en BD).
2) Detalle de correos importados de las ofertas SIN carpeta en disco (>=13),
   con internet_message_id / emisor / asunto, para reimportarlos desde Outlook.
"""
import os
from pathlib import Path

import pyodbc

ROOT = Path(r"C:\Proyectos\OFERTAS_prueba")


def load_dotenv_values(path):
    env = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


env = load_dotenv_values(ROOT / ".env")
conn = pyodbc.connect(
    f"DRIVER={{{env['DB_DRIVER']}}};SERVER={env['DB_SERVER']};"
    f"DATABASE={env['DB_DATABASE']};UID={env['DB_USER']};PWD={env['DB_PASSWORD']};"
    "Encrypt=yes;TrustServerCertificate=yes;",
    timeout=10,
)
cur = conn.cursor()

print("=" * 70)
print("1) TABLAS/COLUMNAS QUE MENCIONEN adjunt/attachment/ruta/archivo")
print("=" * 70)
cur.execute(
    """
    SELECT t.TABLE_SCHEMA, t.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE
    FROM INFORMATION_SCHEMA.TABLES t
    JOIN INFORMATION_SCHEMA.COLUMNS c
      ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
    WHERE t.TABLE_TYPE = 'BASE TABLE'
      AND (c.COLUMN_NAME LIKE '%adjunt%' OR c.COLUMN_NAME LIKE '%attach%'
           OR c.COLUMN_NAME LIKE '%ruta%' OR c.COLUMN_NAME LIKE '%path%'
           OR c.COLUMN_NAME LIKE '%archivo%' OR c.COLUMN_NAME LIKE '%file%'
           OR c.COLUMN_NAME LIKE '%fichero%')
    ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME, c.COLUMN_NAME
    """
)
rows = cur.fetchall()
if not rows:
    print("  (ninguna columna de adjunto/ruta/archivo en toda la BD)")
for r in rows:
    print(f"  {r[0]}.{r[1]} :: {r[2]} ({r[3]})")

print()
print("=" * 70)
print("2) CORREOS IMPORTADOS de ofertas >= 202600013 (para reimportar desde Outlook)")
print("=" * 70)
cur.execute(
    """
    SELECT lo.numero_oferta,
           oci.internet_message_id,
           oci.conversation_id,
           oci.sender_email,
           oci.sender_name,
           oci.subject,
           oci.received_at,
           oci.fecha_registro
    FROM ofertas.oferta_correos_importados oci
    JOIN ofertas.listado_ofertas lo ON lo.id_oferta = oci.id_oferta
    WHERE lo.numero_oferta >= '202600013'
    ORDER BY lo.numero_oferta, oci.fecha_registro
    """
)
rows = cur.fetchall()
print(f"  Total correos importados en ofertas >=202600013: {len(rows)}")
print()
current = None
for r in rows:
    oferta = str(r[0])
    if oferta != current:
        current = oferta
        print(f"  --- OFERTA {oferta} ---")
    print(f"      internet_message_id : {r[1]}")
    print(f"      conversation_id     : {r[2]}")
    print(f"      de                  : {r[4]} <{r[3]}>")
    print(f"      asunto              : {r[5]}")
    print(f"      recibido            : {r[6]}  importado: {r[7]}")

conn.close()
