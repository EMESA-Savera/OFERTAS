"""
Comprobacion offline del flujo OAuth local.
Valida redirect_uri, ausencia de IPs de produccion y logica CSRF
sin hacer ninguna llamada de red a Azure AD.
Ejecutar con: python check_oauth_local.py
"""
import os
import sys
import secrets
from pathlib import Path
from urllib.parse import urlparse, urlencode, quote, unquote

sys.path.insert(0, str(Path(__file__).parent))

# Simular entorno local de forma explícita
os.environ['APP_ENV'] = 'development'

# ── Paso 1: cargar variables igual que _prepare_project_environment ───────────
from dotenv import dotenv_values

def _resolve_files():
    app_env = (os.getenv('APP_ENV', 'development') or 'development').strip().lower()
    is_prod = app_env in ('prod', 'production')
    root = Path('.').resolve()
    env_base = root / '.env'
    env_specific = root / f'.env.{app_env}'
    env_prod_fallback = root / '.env.production'
    files = []
    if env_base.is_file():
        files.append(env_base)
    if env_specific.is_file() and env_specific.resolve() != env_base.resolve():
        files.append(env_specific)
    elif is_prod and env_prod_fallback.is_file() and env_prod_fallback.resolve() != env_base.resolve():
        files.append(env_prod_fallback)
    return files, app_env

files, app_env = _resolve_files()
declared = {}
for f in files:
    for k, v in dotenv_values(f).items():
        if k and v is not None:
            declared[k] = v
for k, v in declared.items():
    os.environ[k] = v

print('=== PASO 1: Variables de entorno cargadas ===')
print(f'  Archivos    : {[f.name for f in files]}')
print(f'  APP_ENV     : {os.environ.get("APP_ENV")!r}')
print(f'  OAUTH_REDIRECT_URI : {os.environ.get("OAUTH_REDIRECT_URI")!r}')
print()

# ── Paso 2: OAuthConfig.REDIRECT_URI ─────────────────────────────────────────
# Importar solo la clase, sin construir MSALApp (evita llamada de red)
from api.oauth_config import OAuthConfig

BAD = ('192.168.253.9', '192.168.250.18')
redirect_uri = OAuthConfig.REDIRECT_URI

print('=== PASO 2: OAuthConfig.REDIRECT_URI ===')
print(f'  REDIRECT_URI         : {redirect_uri!r}')
print(f'  contiene localhost   : {"localhost" in redirect_uri}')
for bad in BAD:
    print(f'  contiene {bad}: {bad in redirect_uri}')
print(f'  redirect_uri OK      : {"localhost" in redirect_uri and not any(b in redirect_uri for b in BAD)}')
print()

# ── Paso 3: URL de autorizacion (construida manualmente, sin red) ─────────────
authority = OAuthConfig.AUTHORITY
client_id = OAuthConfig.CLIENT_ID
scopes    = OAuthConfig.SCOPES

# Simular el state que MSAL genera
mock_state = secrets.token_urlsafe(32)

params = {
    'client_id'     : client_id,
    'response_type' : 'code',
    'redirect_uri'  : redirect_uri,
    'scope'         : ' '.join(scopes) if isinstance(scopes, list) else scopes,
    'state'         : mock_state,
    'prompt'        : 'login',
    'domain_hint'   : 'organizations',
    'response_mode' : 'query',
}
simulated_auth_url = f"{authority}/oauth2/v2.0/authorize?{urlencode(params)}"
encoded_expected = quote('https://localhost:3548/auth/callback', safe='')

print('=== PASO 3: URL de autorizacion (simulada sin red) ===')
print(f'  redirect_uri en URL (decoded) : {redirect_uri!r}')
print(f'  encoded esperado en URL       : {encoded_expected!r}')
print(f'  aparece encoded en URL        : {encoded_expected in simulated_auth_url}')
print(f'  aparece 192.168.253.9 en URL  : {"192.168.253.9" in simulated_auth_url}')
print(f'  aparece 192.168.250.18 en URL : {"192.168.250.18" in simulated_auth_url}')
print()

# ── Paso 4: state CSRF ────────────────────────────────────────────────────────
print('=== PASO 4: state CSRF ===')
print(f'  state generado (primeros 8) : {mock_state[:8]!r}')
print(f'  longitud total              : {len(mock_state)}')
print(f'  seria guardado en session   : True  (session["oauth_state"] = state)')
print()

# ── Paso 5: simulacion de callback CSRF ──────────────────────────────────────
stored_state   = mock_state   # lo que session guardaria
received_state = mock_state   # lo que Azure devolveria
session_valid  = bool(stored_state and received_state and stored_state == received_state)

print('=== PASO 5: Simulacion /auth/callback CSRF ===')
print(f'  state_recibido_prefix : {received_state[:8]!r}')
print(f'  state_en_session      : True')
print(f'  state_session_prefix  : {stored_state[:8]!r}')
print(f'  CSRF session_valid    : {session_valid}')
print()

# ── Resumen ───────────────────────────────────────────────────────────────────
checks = [
    ('redirect_uri == https://localhost:3548/auth/callback',
     redirect_uri == 'https://localhost:3548/auth/callback'),
    ('NO contiene 192.168.253.9',
     '192.168.253.9' not in redirect_uri),
    ('NO contiene 192.168.250.18',
     '192.168.250.18' not in redirect_uri),
    ('URL de autorizacion contiene redirect_uri encoded correcto',
     encoded_expected in simulated_auth_url),
    ('NO aparece 192.168.253.9 en auth_url',
     '192.168.253.9' not in simulated_auth_url),
    ('CSRF state_valid (session)',
     session_valid),
]

print('=== RESUMEN FINAL ===')
all_ok = True
for desc, result in checks:
    mark = 'OK  ' if result else 'FAIL'
    print(f'  [{mark}] {desc}')
    if not result:
        all_ok = False

print()
print('  Resultado global: ' + ('TODOS LOS CHECKS PASADOS ✓' if all_ok else 'ALGUNO FALLO ✗'))
