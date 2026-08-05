"""Comprueba la alineacion entre la BD (ofertas + correos importados) y
las carpetas de adjuntos en disco (OFFER_ATTACHMENTS_DIR).

Objetivo: ver que ofertas tienen registros en BD que "deberian" tener adjuntos
(correos importados) pero no tienen carpeta en disco, y viceversa.
"""
import os
import sys
from pathlib import Path

import pyodbc

ROOT = Path(r"C:\Proyectos\OFERTAS_prueba")


def load_dotenv_values(path):
    env = {}
    try:
        for line in Path(path).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


env = load_dotenv_values(ROOT / ".env")

OFFER_ATTACHMENTS_DIR = os.environ.get(
    "OFFER_ATTACHMENTS_DIR",
    env.get("OFFER_ATTACHMENTS_DIR", str(ROOT / "data" / "offer_attachments")),
)

conn = pyodbc.connect(
    f"DRIVER={{{env['DB_DRIVER']}}};"
    f"SERVER={env['DB_SERVER']};"
    f"DATABASE={env['DB_DATABASE']};"
    f"UID={env['DB_USER']};"
    f"PWD={env['DB_PASSWORD']};"
    "Encrypt=yes;TrustServerCertificate=yes;",
    timeout=10,
)
cur = conn.cursor()

print("=" * 70)
print("DIRECTORIO DE ADJUNTOS (OFFER_ATTACHMENTS_DIR):")
print(f"  {OFFER_ATTACHMENTS_DIR}")
print("=" * 70)

# Carpetas en disco
disk_folders = set()
if os.path.isdir(OFFER_ATTACHMENTS_DIR):
    disk_folders = {
        name for name in os.listdir(OFFER_ATTACHMENTS_DIR)
        if os.path.isdir(os.path.join(OFFER_ATTACHMENTS_DIR, name))
    }
print(f"Carpetas de adjuntos en disco: {len(disk_folders)}")
print("  " + ", ".join(sorted(disk_folders)) if disk_folders else "  (ninguna)")
print()

# Ofertas de la BD con numero de correos importados
cur.execute(
    """
    SELECT
        lo.id_oferta,
        lo.numero_oferta,
        lo.fecha_email,
        lo.ref_cliente_asunto_email,
        (SELECT COUNT(*) FROM ofertas.oferta_correos_importados oci
         WHERE oci.id_oferta = lo.id_oferta) AS correos
    FROM ofertas.listado_ofertas lo
    ORDER BY lo.numero_oferta
    """
)
offers = cur.fetchall()
print(f"Total ofertas en BD: {len(offers)}")
print()

# Normalizar numero_oferta a nombre de carpeta (mismo criterio que la app)
def folder_name(numero_oferta, oferta_id):
    raw = str(numero_oferta or "").strip() or str(int(oferta_id))
    import re
    normalized = re.sub(r"[^a-zA-Z0-9_-]", "_", raw).strip("_")
    return normalized or str(int(oferta_id))


print("=" * 70)
print("DESALINEACIONES: ofertas con correos importados pero SIN carpeta en disco")
print("=" * 70)
missing = []
for row in offers:
    oferta_id, numero_oferta, fecha_email, ref, correos = row
    if correos and correos > 0:
        fname = folder_name(numero_oferta, oferta_id)
        if fname not in disk_folders and str(int(oferta_id)) not in disk_folders:
            missing.append((numero_oferta, oferta_id, correos, ref))
print(f"Ofertas que DEBERIAN tener adjuntos (>=1 correo importado) y NO tienen carpeta: {len(missing)}")
for numero_oferta, oferta_id, correos, ref in missing:
    print(f"  {numero_oferta} (id={oferta_id}) correos={correos} | asunto: {(ref or '')[:55]}")
print()

print("=" * 70)
print("DETALLE POR OFERTA (carpeta en disco? / correos importados?)")
print("=" * 70)
for row in offers:
    oferta_id, numero_oferta, fecha_email, ref, correos = row
    fname = folder_name(numero_oferta, oferta_id)
    has_folder = fname in disk_folders or str(int(oferta_id)) in disk_folders
    marker = "OK " if (has_folder or correos == 0) else "!! "
    print(f"  {marker}{numero_oferta} | id={oferta_id} | carpeta={'SI' if has_folder else 'NO'} | correos={correos}")

conn.close()
