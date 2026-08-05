import sys

sys.path.insert(0, r"C:\Proyectos\OFERTAS_prueba\api")
from app_ofertas import db_connection

with db_connection() as conn:
    cur = conn.cursor()

    print("=== Correos importados de ofertas 13+ (fecha, asunto, emisor) ===")
    cur.execute(
        """
        SELECT lo.numero_oferta, oci.received_at, oci.subject, oci.sender_email
        FROM ofertas.oferta_correos_importados oci
        INNER JOIN ofertas.listado_ofertas lo ON lo.id_oferta = oci.id_oferta
        WHERE lo.numero_oferta >= '202600013'
        ORDER BY oci.received_at
        """
    )
    rows = cur.fetchall()
    print(f"Total correos: {len(rows)}")
    for r in rows:
        fecha = r[1].strftime("%Y-%m-%d %H:%M:%S") if r[1] else None
        asunto = (r[2] or "")[:60]
        print(f"  {r[0]} | {fecha} | {asunto}")
    print()

    print("=== Fecha alta de las ofertas 13+ ===")
    cur.execute(
        """
        SELECT numero_oferta, fecha_alta_oferta, fecha_email
        FROM ofertas.listado_ofertas
        WHERE numero_oferta >= '202600013'
        ORDER BY numero_oferta
        """
    )
    for r in cur.fetchall():
        print(f"  {r[0]} | alta={r[1]} | email={r[2]}")
