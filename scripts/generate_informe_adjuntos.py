"""Genera un informe Markdown con las ofertas SIN adjuntos y los datos
de los correos importados (para reimportarlos y recuperar adjuntos).

No borra nada: solo lee la BD y escribe el .md en docs/.
"""
import os
import re
from datetime import datetime
from pathlib import Path

import pyodbc

ROOT = Path(r"C:\Proyectos\OFERTAS_prueba")
OUT_MD = ROOT / "docs" / "INFORME_ADJUNTOS_FALTANTES.md"

OFFER_ATTACHMENTS_DIR = r"//192.168.253.9/DIgitalizacion/01. DESARROLLO/OFERTAS SAVERA/data/offer_attachments"


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

# Carpetas en disco
disk_folders = set()
if os.path.isdir(OFFER_ATTACHMENTS_DIR):
    disk_folders = {
        name for name in os.listdir(OFFER_ATTACHMENTS_DIR)
        if os.path.isdir(os.path.join(OFFER_ATTACHMENTS_DIR, name))
    }


def folder_name(numero_oferta, oferta_id):
    raw = str(numero_oferta or "").strip() or str(int(oferta_id))
    normalized = re.sub(r"[^a-zA-Z0-9_-]", "_", raw).strip("_")
    return normalized or str(int(oferta_id))


# Ofertas + nº correos importados
cur.execute(
    """
    SELECT lo.id_oferta, lo.numero_oferta, lo.fecha_email,
           lo.ref_cliente_asunto_email,
           (SELECT COUNT(*) FROM ofertas.oferta_correos_importados oci
            WHERE oci.id_oferta = lo.id_oferta) AS correos
    FROM ofertas.listado_ofertas lo
    ORDER BY lo.numero_oferta
    """
)
offers = cur.fetchall()

# Detalle de correos importados por oferta (>= 202600013)
cur.execute(
    """
    SELECT lo.numero_oferta, oci.internet_message_id, oci.sender_email,
           oci.sender_name, oci.subject, oci.fecha_registro
    FROM ofertas.oferta_correos_importados oci
    JOIN ofertas.listado_ofertas lo ON lo.id_oferta = oci.id_oferta
    WHERE lo.numero_oferta >= '202600013'
    ORDER BY lo.numero_oferta, oci.fecha_registro
    """
)
emails = {}
for numero, msg_id, sender_email, sender_name, subject, fecha in cur.fetchall():
    emails.setdefault(str(numero), []).append(
        {
            "msg_id": msg_id,
            "sender_email": sender_email,
            "sender_name": sender_name,
            "subject": subject,
            "fecha": fecha,
        }
    )

with_folder = []
missing_with_emails = []
no_folder_no_emails = []
for row in offers:
    oferta_id, numero_oferta, fecha_email, ref, correos = row
    fname = folder_name(numero_oferta, oferta_id)
    has_folder = fname in disk_folders or str(int(oferta_id)) in disk_folders
    entry = {
        "id": oferta_id,
        "numero": numero_oferta,
        "fecha_email": fecha_email,
        "ref": ref,
        "correos": correos,
        "carpeta": has_folder,
    }
    if has_folder:
        with_folder.append(entry)
    elif correos and correos > 0:
        missing_with_emails.append(entry)
    else:
        no_folder_no_emails.append(entry)

now = datetime.now().strftime("%Y-%m-%d %H:%M")

lines = []
A = lines.append
A("# 📄 Informe de ofertas sin adjuntos")
A("")
A(f"**Fecha de generación**: {now}")
A(f"**Directorio de adjuntos inspeccionado**: `{OFFER_ATTACHMENTS_DIR}`")
A("")
A("> Este informe se genera desde la base de datos y el disco. **No modifica ni borra nada.**")
A("")
A("## Resumen")
A("")
A("| Concepto | Cantidad |")
A("|---|---|")
A(f"| Ofertas totales en BD | **{len(offers)}** |")
A(f"| Ofertas **con carpeta** de adjuntos en disco | **{len(with_folder)}** |")
A(f"| Ofertas **sin carpeta pero con correos importados** (adjuntos perdidos) | **{len(missing_with_emails)}** |")
A(f"| Ofertas sin carpeta y sin correos importados registrados | **{len(no_folder_no_emails)}** |")
A("")
A("## 1) Ofertas CON carpeta de adjuntos (correctas)")
A("")
A("| Nº oferta | id | Correos importados |")
A("|---|---|---|")
for e in with_folder:
    A(f"| {e['numero']} | {e['id']} | {e['correos']} |")
A("")
A("## 2) Ofertas SIN carpeta pero con correos importados  ⚠️ (adjuntos que se perdieron)")
A("")
A("Estas 24 ofertas tienen correos registrados en `oferta_correos_importados`, por lo que **casi con seguridad tenían adjuntos** que fueron eliminados del disco (el `git clean -fd` del Updater al cambiar de versión los borra).")
A("")
A("| Nº oferta | id | Correos importados |")
A("|---|---|---|")
for e in missing_with_emails:
    A(f"| {e['numero']} | {e['id']} | {e['correos']} |")
A("")
A("### Datos de los correos para reimportar (detalle)")
A("")
for e in missing_with_emails:
    A(f"#### Oferta {e['numero']} (id={e['id']})")
    A("")
    A("| Asunto | De | Internet Message ID | Importado |")
    A("|---|---|---|---|")
    for em in emails.get(str(e["numero"]), []):
        sender = f"{em['sender_name'] or ''} <{em['sender_email'] or ''}>"
        asunto = (em["subject"] or "").replace("|", "\\|")
        msg = (em["msg_id"] or "").replace("|", "\\|")
        fecha = em["fecha"].strftime("%Y-%m-%d %H:%M") if em["fecha"] else ""
        A(f"| {asunto} | {sender} | `{msg}` | {fecha} |")
    A("")
A("## 3) Ofertas sin carpeta y sin correos importados registrados")
A("")
A("Para estas ofertas la BD no registra ningún correo importado, por lo que **no se puede confirmar por BD** si tuvieron adjuntos. Habría que comprobarlo manualmente.")
A("")
A("| Nº oferta | id |")
A("|---|---|")
for e in no_folder_no_emails:
    A(f"| {e['numero']} | {e['id']} |")
A("")
A("## 4) ¿Dónde se guardan los nombres de los adjuntos?")
A("")
A("- **No hay ninguna tabla en BD** que guarde el nombre de los archivos adjuntos (se revisaron columnas de `adjunt`/`attach`/`ruta`/`archivo`/`file` en toda la BD; el esquema `ofertas` no tiene ninguna).")
A("- Los adjuntos son **solo archivos en disco**: `data/offer_attachments/<nº oferta>/<archivo>` y un `.meta.json` por archivo (que guarda `original_name`). Esa carpeta es la que se borró.")
A("- En BD solo se guarda la **metadata del correo** (`oferta_correos_importados`: `internet_message_id`, `subject`, `sender_email`, `sender_name`, `received_at`, `body_sha256`).")
A("")
A("## 5) Idea: mini pantalla para re-subir correos antiguos y recuperar adjuntos")
A("")
A("Propuesta para recuperar los adjuntos de las ofertas de la sección 2 sin tocar la BD:")
A("")
A("1. **Subir el correo antiguo** (`.eml`/`.msg`) o reimportarlo desde Outlook para una oferta concreta.")
A("2. La app ya sabe extraer adjuntos de un correo (flujo `importar-correo`).")
A("3. **Cambio necesario**: hoy `sync_imported_emails_into_offer` descarta correos ya registrados (`internet_message_id`/`body_sha256`), así que **no añadiría los adjuntos**. Habría que añadir un modo **\"forzar re-adjuntar\"** que:")
A("   - mueva los adjuntos del correo subido a `offer_attachments/<nº oferta>/` aunque el correo ya esté registrado, y")
A("   - **no borre** ni la fila de `oferta_correos_importados` ni nada existente.")
A("")
A("4. Alternativa sin cambios: descargar el correo de Outlook, abrirlo y subir **solo los adjuntos** desde la pantalla normal de adjuntos de la oferta.")
A("")
A("---")
A("*Generado automáticamente por `scripts/generate_informe_adjuntos.py`. Los datos provienen de `DataLakeSCCZ` (esquema `ofertas`).*")

OUT_MD.parent.mkdir(parents=True, exist_ok=True)
OUT_MD.write_text("\n".join(lines), encoding="utf-8")
conn.close()
print(f"Informe generado: {OUT_MD}")
print(f"  - Ofertas con carpeta: {len(with_folder)}")
print(f"  - Ofertas sin carpeta + correos (perdidos): {len(missing_with_emails)}")
print(f"  - Ofertas sin carpeta y sin correos: {len(no_folder_no_emails)}")
