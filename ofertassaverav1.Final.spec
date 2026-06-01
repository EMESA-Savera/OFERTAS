# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path

from PyInstaller.utils.hooks import collect_submodules

project_root = Path(SPECPATH)
app_script = project_root / "api" / "app_ofertas.py"


def collect_tree(source, target):
    source_path = project_root / source
    if not source_path.exists():
        return []

    items = []
    for file_path in source_path.rglob("*"):
        if file_path.is_file():
            relative_parent = file_path.relative_to(source_path).parent
            destination = Path(target) / relative_parent
            items.append((str(file_path), str(destination).replace("\\", "/")))
    return items


datas = []
for source_dir in ("templates", "static", "sql", "docs", "skills", "tools", "certificados_ofertas", "Instalaccion_Manual_CA_Windows"):
    datas += collect_tree(source_dir, source_dir)

for single_file in ("requirements.txt", ".env.production", ".env.example", "README.md"):
    file_path = project_root / single_file
    if file_path.exists():
        datas.append((str(file_path), "."))

hiddenimports = []
hiddenimports += collect_submodules("flask")
hiddenimports += collect_submodules("flask_cors")
hiddenimports += collect_submodules("dotenv")
hiddenimports += collect_submodules("pyodbc")
hiddenimports += collect_submodules("extract_msg")

block_cipher = None


a = Analysis(
    [str(app_script)],
    pathex=[str(project_root)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    exclude_binaries=False,
    name="ofertassaverav1.Final",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
