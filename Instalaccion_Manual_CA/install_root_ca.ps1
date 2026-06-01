param(
    [Parameter(Mandatory = $true)]
    [string]$CertificatePath,

    [ValidateSet('CurrentUser', 'LocalMachine')]
    [string]$StoreLocation = 'CurrentUser'
)

$ErrorActionPreference = 'Stop'

$resolvedPath = Resolve-Path -Path $CertificatePath
$certFile = $resolvedPath.Path

if (-not (Test-Path -Path $certFile -PathType Leaf)) {
    throw "No se encontró el certificado: $CertificatePath"
}

$expectedCertificate = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certFile)
$expectedThumbprint = ($expectedCertificate.Thumbprint -replace '\s', '').ToUpperInvariant()
$expectedSubject = $expectedCertificate.Subject

$storeLocationEnum = [System.Security.Cryptography.X509Certificates.StoreLocation]::$StoreLocation
$storeNameEnum = [System.Security.Cryptography.X509Certificates.StoreName]::Root
$x509Store = New-Object System.Security.Cryptography.X509Certificates.X509Store($storeNameEnum, $storeLocationEnum)

try {
    $x509Store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
} catch {
    throw "No se pudo abrir el almacén Root en $StoreLocation. Ejecuta la consola como administrador si usas LocalMachine. Error original: $($_.Exception.Message)"
}

try {
    $existingCertificates = @($x509Store.Certificates | Where-Object { $_.Subject -eq $expectedSubject })
    foreach ($existingCertificate in $existingCertificates) {
        $installedThumbprint = ($existingCertificate.Thumbprint -replace '\s', '').ToUpperInvariant()
        Write-Host "Eliminando certificado previo con el mismo subject: $($existingCertificate.Subject) [$installedThumbprint]" -ForegroundColor Yellow
        $x509Store.Remove($existingCertificate)
    }

    Write-Host "Instalando CA raíz en $StoreLocation\Root" -ForegroundColor Cyan
    $x509Store.Add($expectedCertificate)
} finally {
    $x509Store.Close()
}

Write-Host "CA raíz instalada correctamente desde $certFile" -ForegroundColor Green
Write-Host "Thumbprint instalada: $expectedThumbprint" -ForegroundColor Green
Write-Host "Si el navegador seguía mostrando No seguro, ciérralo y ábrelo de nuevo." -ForegroundColor Yellow