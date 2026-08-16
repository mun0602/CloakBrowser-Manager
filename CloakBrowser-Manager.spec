# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from pathlib import Path

block_cipher = None

ROOT_DIR = os.path.abspath(os.getcwd())

datas = [
    (os.path.join(ROOT_DIR, 'frontend', 'dist'), os.path.join('frontend', 'dist')),
]

hiddenimports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'starlette',
    'starlette.routing',
    'starlette.middleware',
    'starlette.requests',
    'starlette.responses',
    'fastapi',
    'pydantic',
    'httpx',
    'httpcore',
    'websockets',
    'sqlite3',
    'asyncio',
    'backend',
    'backend.main',
    'backend.database',
    'backend.browser_manager',
    'backend.models',
    'backend.runtime',
    'backend.douyin',
    'backend.douyin.client',
    'backend.douyin.scheduler',
    'backend.douyin.ai_generator',
    'backend.douyin.proxy_checker',
    'backend.douyin.actions.warmup',
    'backend.douyin.actions.search_interact',
    'backend.douyin.actions.live_interact',
    'backend.douyin.actions.uploader',
]

a = Analysis(
    ['app_runner.py'],
    pathex=[ROOT_DIR],
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
    name='CloakBrowser-Manager-x64',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
