# 📄 Informe de ofertas sin adjuntos

**Fecha de generación**: 2026-08-05 09:48
**Directorio de adjuntos inspeccionado**: `//192.168.253.9/DIgitalizacion/01. DESARROLLO/OFERTAS SAVERA/data/offer_attachments`

> Este informe se genera desde la base de datos y el disco. **No modifica ni borra nada.**

## Resumen

| Concepto | Cantidad |
|---|---|
| Ofertas totales en BD | **55** |
| Ofertas **con carpeta** de adjuntos en disco | **12** |
| Ofertas **sin carpeta pero con correos importados** (adjuntos perdidos) | **24** |
| Ofertas sin carpeta y sin correos importados registrados | **19** |

## 1) Ofertas CON carpeta de adjuntos (correctas)

| Nº oferta | id | Correos importados |
|---|---|---|
| 202600001 | 70 | 4 |
| 202600002 | 71 | 2 |
| 202600003 | 72 | 3 |
| 202600004 | 73 | 1 |
| 202600005 | 74 | 3 |
| 202600006 | 79 | 3 |
| 202600007 | 80 | 1 |
| 202600008 | 81 | 1 |
| 202600009 | 82 | 4 |
| 202600010 | 84 | 3 |
| 202600011 | 85 | 2 |
| 202600012 | 86 | 2 |

## 2) Ofertas SIN carpeta pero con correos importados  ⚠️ (adjuntos que se perdieron)

Estas 24 ofertas tienen correos registrados en `oferta_correos_importados`, por lo que **casi con seguridad tenían adjuntos** que fueron eliminados del disco (el `git clean -fd` del Updater al cambiar de versión los borra).

| Nº oferta | id | Correos importados |
|---|---|---|
| 202600013 | 87 | 2 |
| 202600014 | 88 | 4 |
| 202600015 | 89 | 6 |
| 202600016 | 90 | 2 |
| 202600017 | 91 | 4 |
| 202600018 | 1087 | 2 |
| 202600019 | 1088 | 2 |
| 202600020 | 1089 | 1 |
| 202600021 | 1090 | 1 |
| 202600022 | 1091 | 2 |
| 202600023 | 1092 | 3 |
| 202600024 | 1093 | 2 |
| 202600025 | 1094 | 1 |
| 202600026 | 1095 | 1 |
| 202600027 | 1096 | 1 |
| 202600028 | 1097 | 1 |
| 202600033 | 1104 | 2 |
| 202600034 | 1105 | 4 |
| 202600036 | 1109 | 1 |
| 202600037 | 1110 | 1 |
| 202600038 | 1111 | 2 |
| 202600040 | 1113 | 1 |
| 202600041 | 1114 | 1 |
| 202600051 | 1124 | 1 |

### Datos de los correos para reimportar (detalle)

#### Oferta 202600013 (id=87)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| UKC0011803541 - SCS-X00483180-VS00 | María Esther Arrieta Salas <esther.arrieta@schindler.com> | `gv2pr01mb11684ba0e6f08b71e51cbb0529ee82@gv2pr01mb11684.eurprd01.prod.exchangelabs.com` | 2026-06-29 07:14 |
| RE: UKC0011803541 - SCS-X00483180-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419f7ebdf33e94aa9ed74dff2f52@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-02 07:16 |

#### Oferta 202600014 (id=88)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: [KIND REMINDER] FTO - 4550825894  - 640557640 - MIL0011927165 - SCS-X00486040-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419ebbd647a022f4f306d73f2f72@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-01 09:46 |
| RE: [EXTERNAL] RE: [KIND REMINDER] FTO - 4550825894  - 640557640 - MIL0011927165 - SCS-X00486040-VS00 | María Esther Arrieta Salas <esther.arrieta@schindler.com> | `gv2pr01mb1168480afd9753dbc1fe6d7b59ef12@gv2pr01mb11684.eurprd01.prod.exchangelabs.com` | 2026-07-07 05:14 |
| FTO - 4550825894  - 640557640 - MIL0011927165 - SCS-X00486040-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419bb50168f1311b46bb5fff2ff2@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-08 08:19 |
| FW: [EXTERNAL] FTO - 4550825894  - 640557640 - MIL0011927165 - SCS-X00486040-VS00 | María Esther Arrieta Salas <esther.arrieta@schindler.com> | `gv2pr01mb11684af7d2cd2d1affc61ffd29eff2@gv2pr01mb11684.eurprd01.prod.exchangelabs.com` | 2026-07-08 13:12 |

#### Oferta 202600015 (id=89)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: DELTA - METRO BARCELONA Project - 114 Elevators - Mech | Michaela Havlikova <michaela> | `am0pr04mb6419a79840caf3a6b26ecccbf2f62@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-01 10:18 |
| RE: [EXTERNAL] RE: DELTA - METRO BARCELONA Project - 114 Elevators - Mech | Ángel Luis Gea Villanueva <angel.gea@schindler.com> | `as8pr01mb71738f43eda1212e4d9be556f9f62@as8pr01mb7173.eurprd01.prod.exchangelabs.com` | 2026-07-01 10:37 |
| RE: [EXTERNAL] RE: Project: Stoneyard, birmingham-Phase1 / Request for Pit Ladder Offer for Block F Lift L2FF, L3FF | Michaela Havlikova <michaela> | `am0pr04mb6419eba33f42444943d1cdc8f2f62@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-01 11:17 |
| FW: [EXTERNAL] RE: DELTA - METRO BARCELONA Project - 114 Elevators - Mech | Martin Sak <m.sak@saveragroup.com> | `vi1pr04mb6175c5b35d494bf18ec56aa0e2f52@vi1pr04mb6175.eurprd04.prod.outlook.com` | 2026-07-02 12:30 |
| RE: [EXTERNAL] RE: DELTA - METRO BARCELONA Project - 114 Elevators - Mech | Martin Sak <m.sak@saveragroup.com> | `vi1pr04mb61759fc7b2786fa6bd26b011e2f52@vi1pr04mb6175.eurprd04.prod.outlook.com` | 2026-07-03 05:16 |
| RE: [EXTERNAL] RE: DELTA - METRO BARCELONA Project - 114 Elevators - Mech | Mario Pobes Bartolomé <m.pobes@saveragroup.com> | `pawpr04mb1164722fbbe84cb228deadddff0f42@pawpr04mb11647.eurprd04.prod.outlook.com` | 2026-07-03 05:34 |

#### Oferta 202600016 (id=90)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: DEU0011904630 - request for change of brackets | Pavel Horák <p.horak@saveragroup.com> | `as8pr04mb870818763787ad02e29018e7f9f62@as8pr04mb8708.eurprd04.prod.outlook.com` | 2026-07-01 10:03 |
| RE: DEU0011904630 - request for change of brackets | Michaela Havlikova <michaela> | `am0pr04mb6419fa4ee30dd9c57fb79f73f2f62@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-01 10:05 |

#### Oferta 202600017 (id=91)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: Requirement price brackets.  Offer SCS-X00482596-VS00 right offer ref. SCS-X00482613-VS00 | Pavel Horák <p.horak@saveragroup.com> | `as8pr04mb8708e509de45fa7a4592112bf9f62@as8pr04mb8708.eurprd04.prod.outlook.com` | 2026-07-01 13:20 |
| RE: Requirement price brackets.  Offer SCS-X00482596-VS00 right offer ref. SCS-X00482613-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419018c275fbeb82c274833f2f52@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-02 05:35 |
| RE: [EXTERNAL] RE: Requirement price brackets.  Offer SCS-X00482596-VS00 right offer ref. SCS-X00482613-VS00 | Jesús Álvarez Zabala <jesus.alvarez@schindler.com> | `gv2pr01mb11683a94896c6d731cf7398e7f6f52@gv2pr01mb11683.eurprd01.prod.exchangelabs.com` | 2026-07-02 07:02 |
| RE: [EXTERNAL] RE: Requirement price brackets.  Offer SCS-X00482596-VS00 right offer ref. SCS-X00482613-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419c797cebdedcdd139ac88f2f52@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-02 13:33 |

#### Oferta 202600018 (id=1087)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| SCS-X00486498-VS00 | Pavel Horák <p.horak@saveragroup.com> | `as8pr04mb8708f9d57d2abac3d25bacedf9f62@as8pr04mb8708.eurprd04.prod.outlook.com` | 2026-07-01 13:22 |
| RE: FTO - 4550910029 - 640559324 - MIL0011916048 - SCS-X00486498-VS00 | Michaela Havlikova <michaela> | `am0pr04mb64198b2b33b9f15fd2f8cebef2f52@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-02 05:34 |

#### Oferta 202600019 (id=1088)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| FW: Requirement price Pit Ladder.  Offer SCS-X00483691-VS00 | Jesús Álvarez Zabala <jesus.alvarez@schindler.com> | `gv2pr01mb11683a90d363b9320853d135ef6f12@gv2pr01mb11683.eurprd01.prod.exchangelabs.com` | 2026-07-07 05:17 |
| RE: Requirement price Pit Ladder.  Offer SCS-X00483691-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419227556297d56b1004f01f2f02@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-07 07:33 |

#### Oferta 202600020 (id=1089)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: Requirement price Spare Part Bracket.  Offer SCS-X00483307-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419e4f0305a99e336d303f0f2f02@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-07 09:53 |

#### Oferta 202600021 (id=1090)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: Commission 20137834 - VI-01-2026-00001546 | Michaela Havlikova <michaela> | `am0pr04mb64191f59f893a3174a9d8ed5f2f02@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-07 13:02 |

#### Oferta 202600022 (id=1091)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: [EXTERNAL] RE: [KIND REMINDER] LUX0020131007 / SCS-X00480062-VS00 | María Esther Arrieta Salas <esther.arrieta@schindler.com> | `gv2pr01mb1168443aa76e0b485893d40639eff2@gv2pr01mb11684.eurprd01.prod.exchangelabs.com` | 2026-07-08 10:32 |
| Re: [EXTERNAL] RE: [KIND REMINDER] LUX0020131007 / SCS-X00480062-VS00 | Pavel Horák <p.horak@saveragroup.com> | `as8pr04mb87087ccce375cbda7111fc47f9fe2@as8pr04mb8708.eurprd04.prod.outlook.com` | 2026-07-09 06:13 |

#### Oferta 202600023 (id=1092)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: SAC - Order 4550975597 | Michaela Havlikova <michaela> | `am0pr04mb64190615fac57e35de1f8fc8f2ff2@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-08 06:34 |
| RE: SAC - Order 4550975597 | Michaela Havlikova <michaela> | `am0pr04mb6419d1e1edfda68a2f7de70ef2ff2@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-08 07:02 |
| SAC - Order 4550975597 deleted - New PO 4551055215 | Pascual Izaguerri Castillo <pascual.izaguerri@schindler.com> | `db9pr01mb10170d2fba08f7f134a50532eeeff2@db9pr01mb10170.eurprd01.prod.exchangelabs.com` | 2026-07-09 06:05 |

#### Oferta 202600024 (id=1093)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: SAC - Order 4550998639 | Michaela Havlikova <michaela> | `am0pr04mb641972c98cd1c6a1be67a58bf2ff2@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-08 06:34 |
| RE: Order 4550998639 incorrect | Michaela Havlikova <michaela> | `am6pr04mb64216cce43b9903914e1ab8cf2fe2@am6pr04mb6421.eurprd04.prod.outlook.com` | 2026-07-09 06:10 |

#### Oferta 202600025 (id=1094)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: ABSOLUTE_900 - VI-01-2026-00001569 - Additional Guide Rais Brackets | Cezary Karol KONKOL <cezary.karol.konkol@schindler.com> | `am7ppfcca1edc7a6d6854fab9420dcbae16baff2@am7ppfcca1edc7a.eurprd01.prod.exchangelabs.com` | 2026-07-08 09:56 |

#### Oferta 202600026 (id=1095)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: ABSOLUTE_900 - VI-01-2026-00001573 - Additional Guide Rais Brackets | Michaela Havlikova <michaela> | `am6pr04mb6421e23705e837a0a7a98092f2fe2@am6pr04mb6421.eurprd04.prod.outlook.com` | 2026-07-09 06:35 |

#### Oferta 202600027 (id=1096)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: MIL0020142334 - SCS-X00486231-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419b4909337eb01198aa615f2fe2@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-09 06:40 |

#### Oferta 202600028 (id=1097)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: Requirement price Block Holder component.  Offer SCS-X00485099-VS00 | Michaela Havlikova <michaela> | `am0pr04mb641998c72ede1bdaa9b2f7a7f2fe2@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-09 06:51 |

#### Oferta 202600033 (id=1104)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: [EXTERNAL] RE: Requirement price Pit Ladder.  Offer SCS-X00486532-VS00 | Jesús Álvarez Zabala <jesus.alvarez@schindler.com> | `vi0pr01mb116949ddae2c556c1c141cc45f6f92@vi0pr01mb11694.eurprd01.prod.exchangelabs.com` | 2026-07-14 06:15 |
| RE: [EXTERNAL] RE: Requirement price Pit Ladder.  Offer SCS-X00486532-VS00 | Jesús Álvarez Zabala <jesus.alvarez@schindler.com> | `gv2pr01mb11683c35e8d989bd51773d6eef6f82@gv2pr01mb11683.eurprd01.prod.exchangelabs.com` | 2026-07-15 05:52 |

#### Oferta 202600034 (id=1105)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: Requirement price Screen CWT.  Offer SCS-X00486485-VS00 | Roman Hubinec <r.hubinec@saveragroup.com> | `as8pr04mb86745303ca3e06ebd79a55dffaf92@as8pr04mb8674.eurprd04.prod.outlook.com` | 2026-07-14 13:09 |
| RE: [EXTERNAL] RE: Requirement price Screen CWT.  Offer SCS-X00486485-VS00 | Jesús Álvarez Zabala <jesus.alvarez@schindler.com> | `gv2pr01mb11683a031590b56fe86f97782f6f82@gv2pr01mb11683.eurprd01.prod.exchangelabs.com` | 2026-07-15 05:53 |
| RE: [EXTERNAL] RE: Requirement price Screen CWT.  Offer SCS-X00486485-VS00 | Michaela Havlikova <michaela> | `am0pr04mb64193215e634459627b0b97cf2f82@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-15 06:53 |
| RE: [EXTERNAL] RE: Requirement price Screen CWT.  Offer SCS-X00486485-VS00 | Jesús Álvarez Zabala <jesus.alvarez@schindler.com> | `gv2pr01mb11683c3e0e346f89a598b5151f6f82@gv2pr01mb11683.eurprd01.prod.exchangelabs.com` | 2026-07-15 07:00 |

#### Oferta 202600036 (id=1109)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: [EXTERNAL] RE: Requirement Spare Parts Pit ladder fixation.  Offer SCS-X00487609-VS00 | Michaela Havlikova <michaela> | `am0pr04mb64196bb2a7b05cc649aa67a8f2c72@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-16 11:02 |

#### Oferta 202600037 (id=1110)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: commission 20140560 VI-01-2026-00001672 | Michaela Havlikova <michaela> | `am0pr04mb64196af867c6efef8dbdbdfcf2c12@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-22 07:31 |

#### Oferta 202600038 (id=1111)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: Solicitud de precio// 26OF00463 | Michaela Havlikova <michaela> | `am0pr04mb6419389a8ccb4ba48cf40246f2c12@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-22 06:48 |
| RE: [EXTERNAL] RE: Solicitud de precio// 26OF00463 | Noelia Olmedo Torrejimeno (EXT) <noelia.olmedo@schindler.com> | `am6pr01mb5589d1c9c127b1324518b2defbc02@am6pr01mb5589.eurprd01.prod.exchangelabs.com` | 2026-07-23 11:10 |

#### Oferta 202600040 (id=1113)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: MIL0011880661 - SCS-X00488745-VS00 | Michaela Havlikova <michaela> | `am0pr04mb6419d4588de09923d99183eaf2c02@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-23 09:09 |

#### Oferta 202600041 (id=1114)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: MIL0011880661 - SCS-X00488747-VS00 | Michaela Havlikova <michaela> | `am0pr04mb641921879cc6fb684d78cc73f2c02@am0pr04mb6419.eurprd04.prod.outlook.com` | 2026-07-23 12:45 |

#### Oferta 202600051 (id=1124)

| Asunto | De | Internet Message ID | Importado |
|---|---|---|---|
| RE: [EXTERNAL] RE: commission11929053 VI-01-2026-00001745 | ALBERTO BRAMBILLA <alberto.brambilla@schindler.com> | `ambpr01mb12093849aba5eaf70ac1ed929eed52@ambpr01mb12093.eurprd01.prod.exchangelabs.com` | 2026-08-03 12:22 |

## 3) Ofertas sin carpeta y sin correos importados registrados

Para estas ofertas la BD no registra ningún correo importado, por lo que **no se puede confirmar por BD** si tuvieron adjuntos. Habría que comprobarlo manualmente.

| Nº oferta | id |
|---|---|
| 202600029 | 1098 |
| 202600031 | 1102 |
| 202600032 | 1103 |
| 202600035 | 1108 |
| 202600039 | 1112 |
| 202600042 | 1115 |
| 202600043 | 1116 |
| 202600044 | 1117 |
| 202600045 | 1118 |
| 202600046 | 1119 |
| 202600047 | 1120 |
| 202600048 | 1121 |
| 202600049 | 1122 |
| 202600050 | 1123 |
| 202600052 | 1125 |
| 202600053 | 1126 |
| 202600054 | 1127 |
| 202600055 | 1128 |
| 202600056 | 1129 |

## 4) ¿Dónde se guardan los nombres de los adjuntos?

- **No hay ninguna tabla en BD** que guarde el nombre de los archivos adjuntos (se revisaron columnas de `adjunt`/`attach`/`ruta`/`archivo`/`file` en toda la BD; el esquema `ofertas` no tiene ninguna).
- Los adjuntos son **solo archivos en disco**: `data/offer_attachments/<nº oferta>/<archivo>` y un `.meta.json` por archivo (que guarda `original_name`). Esa carpeta es la que se borró.
- En BD solo se guarda la **metadata del correo** (`oferta_correos_importados`: `internet_message_id`, `subject`, `sender_email`, `sender_name`, `received_at`, `body_sha256`).

## 5) Idea: mini pantalla para re-subir correos antiguos y recuperar adjuntos

Propuesta para recuperar los adjuntos de las ofertas de la sección 2 sin tocar la BD:

1. **Subir el correo antiguo** (`.eml`/`.msg`) o reimportarlo desde Outlook para una oferta concreta.
2. La app ya sabe extraer adjuntos de un correo (flujo `importar-correo`).
3. **Cambio necesario**: hoy `sync_imported_emails_into_offer` descarta correos ya registrados (`internet_message_id`/`body_sha256`), así que **no añadiría los adjuntos**. Habría que añadir un modo **"forzar re-adjuntar"** que:
   - mueva los adjuntos del correo subido a `offer_attachments/<nº oferta>/` aunque el correo ya esté registrado, y
   - **no borre** ni la fila de `oferta_correos_importados` ni nada existente.

4. Alternativa sin cambios: descargar el correo de Outlook, abrirlo y subir **solo los adjuntos** desde la pantalla normal de adjuntos de la oferta.

---
*Generado automáticamente por `scripts/generate_informe_adjuntos.py`. Los datos provienen de `DataLakeSCCZ` (esquema `ofertas`).*