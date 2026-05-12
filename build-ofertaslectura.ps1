# Script para compilar el ejecutable ofertaslectura.exe
# Este script genera un .exe independiente con soporte para usuarios en modo solo lectura

Write-Host "=== Compilando ofertaslectura.exe ===" -ForegroundColor Green
Write-Host ""

# Verificar que PyInstaller está instalado
try {
    $version = pyinstaller --version 2>$null
    Write-Host "✓ PyInstaller encontrado: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ PyInstaller no está instalado. Ejecuta: pip install pyinstaller" -ForegroundColor Red
    exit 1
}

# Limpiar build previos si existen
Write-Host ""
Write-Host "Limpiando builds previos..." -ForegroundColor Yellow
if (Test-Path ".\build") { Remove-Item -Path ".\build" -Recurse -Force }
if (Test-Path ".\dist\ofertaslectura") { Remove-Item -Path ".\dist\ofertaslectura" -Recurse -Force }

# Ejecutar PyInstaller con el spec de ofertaslectura
Write-Host ""
Write-Host "Compilando con PyInstaller..." -ForegroundColor Yellow
pyinstaller ofertaslectura.spec --clean

# Verificar que se creó correctamente
Write-Host ""
if (Test-Path ".\dist\ofertaslectura.exe") {
    Write-Host "✓ Compilación completada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ubicación del ejecutable: .\dist\ofertaslectura.exe" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Este ejecutable incluye:" -ForegroundColor Yellow
    Write-Host "  • Soporte para usuario en modo solo lectura (num_operario = 4)" -ForegroundColor Gray
    Write-Host "  • Sistema de traducción multiidioma (ES, EN, CS)" -ForegroundColor Gray
    Write-Host "  • Interfaz completa de ofertas, clientes y estados" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Puedes renombrar o mover el archivo según sea necesario." -ForegroundColor Yellow
} else {
    Write-Host "✗ Error: No se pudo generar ofertaslectura.exe" -ForegroundColor Red
    exit 1
}
