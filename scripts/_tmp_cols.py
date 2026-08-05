import sys
sys.path.insert(0, r"C:\Proyectos\OFERTAS_prueba")
from pathlib import Path
import pyodbc

ROOT = Path(r"C:\Proyectos\OFERTAS_prueba")
env = {}
for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    env[k.strip()] = v.strip().strip('"').strip("'")

conn = pyodbc.connect(
    f"DRIVER={{{env['DB_DRIVER']}}};SERVER={env['DB_SERVER']};"
    f"DATABASE={env['DB_DATABASE']};UID={env['DB_USER']};PWD={env['DB_PASSWORD']};"
    "Encrypt=yes;TrustServerCertificate=yes;",
    timeout=10,
)
cur = conn.cursor()
cur.execute(
    "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
    "WHERE TABLE_SCHEMA='ofertas' AND TABLE_NAME='oferta_correos_importados' "
    "ORDER BY ORDINAL_POSITION"
)
for r in cur.fetchall():
    print(f"  {r[0]} ({r[1]})")
conn.close()
