param(
    [string]$CertificatePath = "",

    [ValidateSet('Inspect', 'Repair')]
    [string]$Mode = 'Inspect',

    [ValidateSet('CurrentUser', 'LocalMachine', 'Both')]
    [string]$InstallTarget = 'Both'
)

$ErrorActionPreference = 'Stop'

function Resolve-CertificatePath {
    param([string]$PreferredPath)

    $candidatePaths = @()
    if ($PreferredPath) {
        $candidatePaths += $PreferredPath
    }

    $scriptDir = $PSScriptRoot
    $candidatePaths += @(
        (Join-Path $scriptDir 'root_ca.cer'),
        (Join-Path $scriptDir '..\certificados_ofertas\root_ca.cer'),
        (Join-Path $scriptDir '..\certificados_ofertas_PROD\root_ca.cer'),
        (Join-Path $scriptDir '..\salida\root_ca.cer')
    )

    foreach ($candidate in $candidatePaths) {
        if (-not $candidate) {
            continue
        }

        if (Test-Path -Path $candidate -PathType Leaf) {
            return (Resolve-Path -Path $candidate).Path
        }
    }

    throw 'No se encontro root_ca.cer. Usa -CertificatePath o coloca el archivo junto al script.'
}

function Get-StoreEntries {
    param(
        [System.Security.Cryptography.X509Certificates.StoreLocation]$StoreLocation,
        [string]$ExpectedSubject,
        [string[]]$KnownThumbprints
    )

    $store = [System.Security.Cryptography.X509Certificates.X509Store]::new(
        [System.Security.Cryptography.X509Certificates.StoreName]::Root,
        $StoreLocation
    )

    try {
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadOnly)
        $matches = @(
            $store.Certificates | Where-Object {
                $thumbprint = ($_.Thumbprint -replace '\s', '').ToUpperInvariant()
                $_.Subject -eq $ExpectedSubject -or $KnownThumbprints -contains $thumbprint
            }
        )

        return $matches | ForEach-Object {
            [PSCustomObject]@{
                StoreLocation = $StoreLocation.ToString()
                Subject = $_.Subject
                Thumbprint = ($_.Thumbprint -replace '\s', '').ToUpperInvariant()
                NotAfter = $_.NotAfter
            }
        }
    }
    finally {
        $store.Close()
    }
}

function Remove-StoreEntries {
    param(
        [System.Security.Cryptography.X509Certificates.StoreLocation]$StoreLocation,
        [string]$ExpectedSubject,
        [string[]]$KnownThumbprints
    )

    $store = [System.Security.Cryptography.X509Certificates.X509Store]::new(
        [System.Security.Cryptography.X509Certificates.StoreName]::Root,
        $StoreLocation
    )

    try {
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
        $matches = @(
            $store.Certificates | Where-Object {
                $thumbprint = ($_.Thumbprint -replace '\s', '').ToUpperInvariant()
                $_.Subject -eq $ExpectedSubject -or $KnownThumbprints -contains $thumbprint
            }
        )

        foreach ($certificate in $matches) {
            $thumbprint = ($certificate.Thumbprint -replace '\s', '').ToUpperInvariant()
            Write-Host "Eliminando $($certificate.Subject) [$thumbprint] de $StoreLocation\Root" -ForegroundColor Yellow
            $store.Remove($certificate)
        }
    }
    finally {
        $store.Close()
    }
}

function Install-Certificate {
    param(
        [string]$CertFile,
        [System.Security.Cryptography.X509Certificates.StoreLocation]$StoreLocation
    )

    $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($CertFile)
    $store = [System.Security.Cryptography.X509Certificates.X509Store]::new(
        [System.Security.Cryptography.X509Certificates.StoreName]::Root,
        $StoreLocation
    )

    try {
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
        $store.Add($certificate)
        $thumbprint = ($certificate.Thumbprint -replace '\s', '').ToUpperInvariant()
        Write-Host "Instalada CA [$thumbprint] en $StoreLocation\Root" -ForegroundColor Green
    }
    finally {
        $store.Close()
    }
}

function Assert-AdminIfNeeded {
    param([string]$Target)

    if ($Target -notin @('LocalMachine', 'Both')) {
        return
    }

    $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($currentIdentity)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
    if (-not $isAdmin) {
        throw 'Para reparar LocalMachine\Root debes ejecutar PowerShell como administrador.'
    }
}

$certFile = Resolve-CertificatePath -PreferredPath $CertificatePath
$expectedCertificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($certFile)
$expectedThumbprint = ($expectedCertificate.Thumbprint -replace '\s', '').ToUpperInvariant()
$expectedSubject = $expectedCertificate.Subject

$knownThumbprints = @(
    $expectedThumbprint,
    '0E2F4183FED2BF9D6E64E254269D879668EE8D8A',
    'DAA0F1D567EC6F088B780FECAAA18D5DC414ABD8'
) | Select-Object -Unique

Write-Host 'Estado actual de la CA Digitalizacion Internal Root CA' -ForegroundColor Cyan
Write-Host "Certificado objetivo: $certFile" -ForegroundColor Cyan
Write-Host "Subject esperado:    $expectedSubject" -ForegroundColor Cyan
Write-Host "Thumbprint esperado: $expectedThumbprint" -ForegroundColor Cyan
Write-Host ''

$beforeEntries = @(
    Get-StoreEntries -StoreLocation CurrentUser -ExpectedSubject $expectedSubject -KnownThumbprints $knownThumbprints
    Get-StoreEntries -StoreLocation LocalMachine -ExpectedSubject $expectedSubject -KnownThumbprints $knownThumbprints
)

if ($beforeEntries.Count -gt 0) {
    $beforeEntries | Sort-Object StoreLocation, Thumbprint | Format-Table StoreLocation, Thumbprint, NotAfter, Subject -AutoSize
} else {
    Write-Host 'No se encontraron certificados coincidentes en CurrentUser\Root ni LocalMachine\Root.' -ForegroundColor Yellow
}

if ($Mode -eq 'Inspect') {
    Write-Host ''
    Write-Host 'Modo Inspect: sin cambios. Usa -Mode Repair para purgar e instalar solo la CA correcta.' -ForegroundColor Yellow
    return
}

Assert-AdminIfNeeded -Target $InstallTarget

Write-Host ''
Write-Host 'Reparando almacenes Root...' -ForegroundColor Cyan

Remove-StoreEntries -StoreLocation CurrentUser -ExpectedSubject $expectedSubject -KnownThumbprints $knownThumbprints
if ($InstallTarget -in @('LocalMachine', 'Both')) {
    Remove-StoreEntries -StoreLocation LocalMachine -ExpectedSubject $expectedSubject -KnownThumbprints $knownThumbprints
}

if ($InstallTarget -in @('CurrentUser', 'Both')) {
    Install-Certificate -CertFile $certFile -StoreLocation CurrentUser
}
if ($InstallTarget -in @('LocalMachine', 'Both')) {
    Install-Certificate -CertFile $certFile -StoreLocation LocalMachine
}

Write-Host ''
Write-Host 'Estado final:' -ForegroundColor Cyan
$afterEntries = @(
    Get-StoreEntries -StoreLocation CurrentUser -ExpectedSubject $expectedSubject -KnownThumbprints $knownThumbprints
    Get-StoreEntries -StoreLocation LocalMachine -ExpectedSubject $expectedSubject -KnownThumbprints $knownThumbprints
)

if ($afterEntries.Count -gt 0) {
    $afterEntries | Sort-Object StoreLocation, Thumbprint | Format-Table StoreLocation, Thumbprint, NotAfter, Subject -AutoSize
}

Write-Host ''
Write-Host 'Si el navegador sigue mostrando No seguro:' -ForegroundColor Yellow
Write-Host '1. Cierra y vuelve a abrir el navegador.' -ForegroundColor Yellow
Write-Host '2. Si usas Firefox, importa tambien la CA o activa security.enterprise_roots.enabled.' -ForegroundColor Yellow
Write-Host '3. Verifica el sitio desde el mismo usuario de Windows donde instalaste la CA.' -ForegroundColor Yellow