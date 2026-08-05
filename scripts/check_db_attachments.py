import os
import sys

sys.path.insert(0, r"C:\Proyectos\OFERTAS_prueba\api")
from app_ofertas import db_connection

with db_connection() as conn:
    cur = conn.cursor()

    print("=== Ofertas 202600013+ con correos importados (evidencia de adjuntos) ===")
    cur.execute(
        """
        SELECT lo.id_oferta, lo.numero_oferta, COUNT(oci.id_correo_importado) AS correos
        FROM ofertas.listado_ofertas lo
        LEFT JOIN ofertas.oferta_correos_importados oci ON oci.id_oferta = lo.id_oferta
        WHERE lo.numero_oferta >= '202600013'
        GROUP BY lo.id_oferta, lo.numero_oferta
        ORDER BY lo.numero_oferta
        """
    )
    rows = cur.fetchall()
    with_correos = [r for r in rows if (r[2] or 0) > 0]
    print(f"Total ofertas 13+: {len(rows)}")
    print(f"Ofertas con correos importados registrados: {len(with_correos)}")
    print("Ejemplos con correos:", [(r[1], r[2]) for r in with_correos[:20]])
    print()

    print("=== Tablas del esquema ofertas ===")
    cur.execute(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='ofertas' ORDER BY TABLE_NAME"
    )
    print([r[0] for r in cur.fetchall()])
    print()

    print("=== Columnas de oferta_correos_importados ===")
    cur.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_SCHEMA='ofertas' AND TABLE_NAME='oferta_correos_importados' ORDER BY ORDINAL_POSITION"
    )
    print([r[0] for r in cur.fetchall()])
    print()

    print("=== Cualquier tabla con 'adjunto' o 'attachment' en el nombre ===")
    cur.execute(
        "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
        "WHERE TABLE_NAME LIKE '%adjunto%' OR TABLE_NAME LIKE '%attachment%' "
        "ORDER BY TABLE_SCHEMA, TABLE_NAME"
    )
    print([f"{r[0]}.{r[1]}" for r in cur.fetchall()])
