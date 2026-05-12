@echo off
REM Script para compilar el ejecutable ofertaslectura.exe
REM Este script genera un .exe independiente con soporte para usuarios en modo solo lectura

echo.
echo ===============================================
echo Compilando ofertaslectura.exe
echo ===============================================
echo.

REM Verificar que PyInstaller está instalado
pyinstaller --version >nul 2>&1
if errorlevel 1 (
    echo Error: PyInstaller no está instalado.
    echo Ejecuta: pip install pyinstaller
    pause
    exit /b 1
)

echo Versión de PyInstaller:
pyinstaller --version
echo.

REM Limpiar build previos
echo Limpiando builds previos...
if exist "build" rmdir /s /q "build"
if exist "dist\ofertaslectura" rmdir /s /q "dist\ofertaslectura"
echo.

REM Ejecutar PyInstaller
echo Compilando con PyInstaller...
pyinstaller ofertaslectura.spec --clean
echo.

REM Verificar resultado
if exist "dist\ofertaslectura.exe" (
    echo.
    echo ===============================================
    echo Compilación completada exitosamente!
    echo ===============================================
    echo.
    echo Ubicación del ejecutable: .\dist\ofertaslectura.exe
    echo.
    echo Este ejecutable incluye:
    echo   - Soporte para usuario en modo solo lectura (num_operario = 4)
    echo   - Sistema de traducción multiidioma (ES, EN, CS)
    echo   - Interfaz completa de ofertas, clientes y estados
    echo.
    echo Puedes renombrar o mover el archivo según sea necesario.
    echo.
    pause
) else (
    echo.
    echo Error: No se pudo generar ofertaslectura.exe
    echo.
    pause
    exit /b 1
)
