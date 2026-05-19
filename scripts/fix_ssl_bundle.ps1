#Requires -Version 5.1
param(
    [string]$BundlePath = 'C:\ProgramData\OFERTAS\certs\msft_outbound_ca_bundle.pem',
    [string[]]$TestHosts = @('login.microsoftonline.com', 'graph.microsoft.com', 'login.microsoft.com')
)

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  OFERTAS - Regeneracion de bundle CA para SSL corporativo" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bundle destino : $BundlePath"
Write-Host "Fecha          : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

$dir = [System.IO.Path]::GetDirectoryName($BundlePath)
if ($dir) { [System.IO.Directory]::CreateDirectory($dir) | Out-Null }

$lines = New-Object System.Collections.Generic.List[string]
$seen  = New-Object 'System.Collections.Generic.HashSet[string]'

Write-Host "[1/3] Exportando desde almacen de certificados Windows..." -ForegroundColor Yellow

$stores = @(
    'Cert:\LocalMachine\Root',
    'Cert:\LocalMachine\CA',
    'Cert:\LocalMachine\AuthRoot',
    'Cert:\CurrentUser\Root',
    'Cert:\CurrentUser\CA',
    'Cert:\CurrentUser\AuthRoot'
)

$winCount = 0
foreach ($store in $stores) {
    if (-not (Test-Path $store)) { continue }
    Get-ChildItem -Path $store -ErrorAction SilentlyContinue | ForEach-Object {
        $tp = $_.Thumbprint
        if (-not $tp -or -not $seen.Add($tp)) { return }
        $b64 = [System.Convert]::ToBase64String($_.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
        $lines.Add('-----BEGIN CERTIFICATE-----')
        foreach ($l in ($b64 -split "`r?`n")) { if ($l) { $lines.Add($l) } }
        $lines.Add('-----END CERTIFICATE-----')
        $lines.Add('')
        $winCount++
    }
}
Write-Host "    -> $winCount certificados del almacen Windows" -ForegroundColor Green

Write-Host "[2/3] Buscando bundle certifi de Python..." -ForegroundColor Yellow

$certifiCount = 0
$pythonCandidates = @(
    'python',
    'python3',
    'C:\ProgramData\OFERTAS\ofertassavera_vReunion.exe',
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    'C:\ProgramData\miniconda3\python.exe'
)

$certifiBundle = $null
foreach ($py in $pythonCandidates) {
    if ($py.EndsWith('.exe') -and -not (Test-Path $py)) { continue }
    try {
        $certifiPath = & $py -c "import certifi; print(certifi.where())" 2>$null
        if ($certifiPath -and (Test-Path $certifiPath)) {
            $certifiBundle = $certifiPath
            break
        }
    } catch {}
}

if ($certifiBundle) {
    Write-Host "    -> Usando certifi: $certifiBundle" -ForegroundColor Green
    $certContent = Get-Content $certifiBundle -Raw -ErrorAction SilentlyContinue
    if ($certContent) {
        $certRegex = [regex]'-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----'
        $matches = $certRegex.Matches($certContent)
        foreach ($m in $matches) {
            $pemBlock = $m.Value.Trim()
            $b64Only = ($pemBlock -replace '-----BEGIN CERTIFICATE-----', '' -replace '-----END CERTIFICATE-----', '').Trim() -replace '\s', ''
            $tpApprox = $b64Only.Substring(0, [Math]::Min(40, $b64Only.Length))
            if (-not $seen.Add($tpApprox)) { continue }
            $lines.Add($pemBlock)
            $lines.Add('')
            $certifiCount++
        }
        Write-Host "    -> $certifiCount certificados de certifi" -ForegroundColor Green
    }
} else {
    Write-Host "    -> certifi no disponible (continua sin el)" -ForegroundColor DarkYellow
}

Write-Host "[3/3] Capturando cadena CA del proxy corporativo (conexion live)..." -ForegroundColor Yellow

$proxyCount = 0
$script:liveCerts = New-Object System.Collections.Generic.List[System.Security.Cryptography.X509Certificates.X509Certificate2]

try {
    $prevCb = [System.Net.ServicePointManager]::ServerCertificateValidationCallback
    [System.Net.ServicePointManager]::SecurityProtocol = `
        [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = `
        [System.Net.Security.RemoteCertificateValidationCallback]{
            param($sender, $certificate, $chain, $sslPolicyErrors)
            if ($chain -ne $null -and $chain.ChainElements.Count -gt 1) {
                for ($i = 1; $i -lt $chain.ChainElements.Count; $i++) {
                    $script:liveCerts.Add($chain.ChainElements[$i].Certificate)
                }
            }
            return $true
        }

    foreach ($h in $TestHosts) {
        Write-Host "    Conectando a https://$h ..." -ForegroundColor DarkGray -NoNewline
        try {
            $req = [System.Net.WebRequest]::Create("https://$h")
            $req.Method  = 'HEAD'
            $req.Timeout = 8000
            try {
                $resp = $req.GetResponse()
                if ($resp) { $resp.Close() }
                Write-Host " OK" -ForegroundColor Green
            } catch [System.Net.WebException] {
                Write-Host " (respuesta HTTP ignorada, handshake SSL capturado)" -ForegroundColor DarkGray
            }
        } catch {
            Write-Host " FALLO: $_" -ForegroundColor Red
        }
    }

    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $prevCb

    foreach ($cert in $script:liveCerts) {
        $tp = $cert.Thumbprint
        if (-not $tp -or -not $seen.Add($tp)) { continue }
        $subj = $cert.Subject
        $b64 = [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
        $lines.Add('-----BEGIN CERTIFICATE-----')
        foreach ($l in ($b64 -split "`r?`n")) { if ($l) { $lines.Add($l) } }
        $lines.Add('-----END CERTIFICATE-----')
        $lines.Add('')
        $proxyCount++
        Write-Host "    -> CA capturada: $subj" -ForegroundColor Cyan
    }

    if ($proxyCount -gt 0) {
        Write-Host "    -> $proxyCount certificados CA del proxy capturados" -ForegroundColor Green
    } else {
        Write-Host "    -> Sin CAs adicionales del proxy (o no hay proxy con inspeccion SSL activa)" -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "    -> Error en captura live: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Escribiendo bundle..." -ForegroundColor Yellow

[System.IO.File]::WriteAllLines(
    $BundlePath,
    $lines,
    [System.Text.UTF8Encoding]::new($false)
)

$totalCerts = $seen.Count
$fileSize   = (Get-Item $BundlePath).Length

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Bundle generado correctamente" -ForegroundColor Green
Write-Host "  Ruta    : $BundlePath"
Write-Host "  Tamaño  : $([Math]::Round($fileSize/1024, 1)) KB"
Write-Host "  Total   : $totalCerts certificados CA"
Write-Host "    Windows : $winCount"
Write-Host "    certifi : $certifiCount"
Write-Host "    Proxy   : $proxyCount"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($proxyCount -eq 0) {
    Write-Host "AVISO: No se capturaron CAs del proxy." -ForegroundColor Yellow
    Write-Host "Si el login sigue fallando con SSL, verifica que el servidor tiene" -ForegroundColor Yellow
    Write-Host "acceso a internet y que el proxy corporativo esta activo." -ForegroundColor Yellow
    Write-Host "Alternativa: instala el certificado CA del proxy en:" -ForegroundColor Yellow
    Write-Host "  Cert:\LocalMachine\Root  (como administrador)" -ForegroundColor Yellow
    Write-Host "Y vuelve a ejecutar este script o usa OAUTH_CA_BUNDLE para que" -ForegroundColor Yellow
    Write-Host "OFERTAS utilice este bundle explicitamente." -ForegroundColor Yellow
    Write-Host ""
}