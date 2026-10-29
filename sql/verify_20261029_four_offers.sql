/*
   Verificación de la incidencia 2026-10-29.
   Solo lectura: no modifica datos.
*/
SELECT
    lo.id_oferta,
    lo.numero_oferta,
    lo.ref_cliente_asunto_email,
    COUNT(CASE WHEN oc.subject IS NOT NULL THEN 1 END) AS correos_con_asunto,
    COUNT(oc.id_correo) AS registros_normalizados
FROM ofertas.listado_ofertas lo
LEFT JOIN ofertas.oferta_correos oc
    ON oc.id_oferta = lo.id_oferta
WHERE lo.numero_oferta IN ('202600122', '202600123', '202600124', '202600125')
GROUP BY
    lo.id_oferta,
    lo.numero_oferta,
    lo.ref_cliente_asunto_email
ORDER BY lo.numero_oferta;

SELECT
    oci.id_oferta,
    lo.numero_oferta,
    oci.subject,
    oci.id_correo_importado
FROM ofertas.oferta_correos_importados oci
INNER JOIN ofertas.listado_ofertas lo
    ON lo.id_oferta = oci.id_oferta
WHERE lo.numero_oferta IN ('202600122', '202600123', '202600124', '202600125')
ORDER BY lo.numero_oferta, oci.id_correo_importado;
