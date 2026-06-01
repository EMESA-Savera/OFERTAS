@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "CERT_PATH=%~1"
set "STORE_LOCATION=%~2"

if not defined CERT_PATH (
    if exist "%SCRIPT_DIR%root_ca.cer" (
        set "CERT_PATH=%SCRIPT_DIR%root_ca.cer"
    ) else if exist "%SCRIPT_DIR%..\certificados_ofertas\root_ca.cer" (
        set "CERT_PATH=%SCRIPT_DIR%..\certificados_ofertas\root_ca.cer"
    ) else if exist "%SCRIPT_DIR%..\certificados_ofertas\root_ca.pem" (
        set "CERT_PATH=%SCRIPT_DIR%..\certificados_ofertas\root_ca.pem"
    ) else if exist "%SCRIPT_DIR%..\salida\root_ca.cer" (
        set "CERT_PATH=%SCRIPT_DIR%..\salida\root_ca.cer"
    )
)

if not defined CERT_PATH (
    echo.
    echo No se encontro la CA raiz junto al script ni en las rutas conocidas del proyecto.
    echo Uso manual:
    echo   install_root_ca_windows.bat "C:\ruta\root_ca.cer" [CurrentUser^|LocalMachine]
    echo.
    exit /b 1
)

if not defined STORE_LOCATION (
    echo.
    echo Instalacion de la CA raiz de EMESA
    echo ==================================
    echo 1. Usuario actual   ^(no requiere administrador^)
    echo 2. Equipo local     ^(requiere PowerShell como administrador^)
    echo.
    set /p CHOICE=Selecciona 1 o 2 [1]: 
    if "%CHOICE%"=="2" (
        set "STORE_LOCATION=LocalMachine"
    ) else (
        set "STORE_LOCATION=CurrentUser"
    )
)

if /I not "%STORE_LOCATION%"=="CurrentUser" if /I not "%STORE_LOCATION%"=="LocalMachine" (
    echo.
    echo Valor no valido para StoreLocation: %STORE_LOCATION%
    echo Usa CurrentUser o LocalMachine.
    echo.
    exit /b 1
)

if /I "%STORE_LOCATION%"=="LocalMachine" (
    net session >nul 2>&1
    if errorlevel 1 (
        if /I not "%~3"=="__elevated__" (
            echo.
            echo Se requieren permisos de administrador para instalar en LocalMachine\Root.
            echo Solicitando elevacion...
            powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%ComSpec%' -ArgumentList '/c ""%~f0"" ""%CERT_PATH%"" LocalMachine __elevated__' -Verb RunAs"
            exit /b 0
        )
        echo.
        echo No se pudieron obtener permisos de administrador para LocalMachine\Root.
        echo.
        exit /b 1
    )
)

echo.
echo Certificado: %CERT_PATH%
echo Almacen:     %STORE_LOCATION%\Root
echo Modo:        eliminar certificados previos con el mismo subject y reinstalar la CA correcta
echo.

powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install_root_ca.ps1" -CertificatePath "%CERT_PATH%" -StoreLocation %STORE_LOCATION%
if errorlevel 1 (
    echo.
    echo Error al instalar la CA raiz.
    echo Si has elegido LocalMachine, abre la consola como administrador e intentalo de nuevo.
    echo.
    exit /b 1
)

echo.
echo Verificacion rapida del almacen:
if /I "%STORE_LOCATION%"=="CurrentUser" (
    certutil -user -store Root "Digitalizacion Internal Root CA"
) else (
    certutil -store Root "Digitalizacion Internal Root CA"
)

echo.
echo Instalacion completada. Si habia una CA previa con el mismo nombre visible, se ha reemplazado.
echo Cierra y vuelve a abrir el navegador antes de probar HTTPS.
echo.
exit /b 0