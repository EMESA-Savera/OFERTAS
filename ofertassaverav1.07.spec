# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

import os
    [os.path.join('api', 'app_ofertas.py')],
    pathex=['.'],
    binaries=[],
    datas=[
        ('static/**/*', 'static'),
        ('templates/**/*', 'templates'),
        ('credenciales', 'credenciales'),
        ('data/**/*', 'data'),
        ('certificados_ofertas/*', 'certificados_ofertas'),
        ('certificados_ofertas_PROD/*', 'certificados_ofertas_PROD'),
    ],
    hiddenimports=[],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ofertassaverav1.07',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    import os
    a = Analysis([
        os.path.join('api', 'app_ofertas.py')
    ],
        pathex=['.'],
        binaries=[],
        datas=[
            ('static/**/*', 'static'),
            ('templates/**/*', 'templates'),
            ('credenciales', 'credenciales'),
            ('data/**/*', 'data'),
            ('certificados_ofertas/*', 'certificados_ofertas'),
            ('certificados_ofertas_PROD/*', 'certificados_ofertas_PROD'),
        ],
        hiddenimports=[],
        hookspath=[],
        runtime_hooks=[],
        excludes=[],
        win_no_prefer_redirects=False,
        win_private_assemblies=False,
        cipher=block_cipher,
    )
