from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from flask import Flask, redirect, render_template_string, request, session, url_for
import msal


RESERVED_SCOPES = {"openid", "profile", "offline_access"}


PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env", override=True)


def get_env_value(*names: str, default: str | None = None) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value is not None and str(value).strip():
            return str(value).strip()
    return default


def build_config() -> dict[str, object]:
    redirect_uri = get_env_value("OAUTH_REDIRECT_URI", "AZURE_REDIRECT_URI", "MICROSOFT_REDIRECT_URI")
    if not redirect_uri:
        raise RuntimeError("Falta OAUTH_REDIRECT_URI o AZURE_REDIRECT_URI en el .env")

    parsed = urlparse(redirect_uri)
    if not parsed.scheme or not parsed.hostname or not parsed.path:
        raise RuntimeError(f"La redirect URI no es válida: {redirect_uri}")

    return {
        "client_id": get_env_value("OAUTH_CLIENT_ID", "AZURE_CLIENT_ID", "MICROSOFT_CLIENT_ID", "CLIENT_ID"),
        "client_secret": get_env_value("OAUTH_CLIENT_SECRET", "AZURE_CLIENT_SECRET", "MICROSOFT_CLIENT_SECRET", "CLIENT_SECRET"),
        "tenant_id": get_env_value("OAUTH_TENANT_ID", "AZURE_TENANT_ID", "MICROSOFT_TENANT_ID", "TENANT_ID"),
        "authority": get_env_value("OAUTH_AUTHORITY", "AZURE_AUTHORITY", "MICROSOFT_AUTHORITY_BASE")
        or f"https://login.microsoftonline.com/{get_env_value('OAUTH_TENANT_ID', 'AZURE_TENANT_ID', 'MICROSOFT_TENANT_ID', 'TENANT_ID')}",
        "redirect_uri": redirect_uri,
        "redirect_scheme": parsed.scheme,
        "redirect_host": parsed.hostname,
        "redirect_port": parsed.port or (443 if parsed.scheme == "https" else 80),
        "redirect_path": parsed.path,
        "login_scopes": [
            scope.strip()
            for scope in (get_env_value("OAUTH_LOGIN_SCOPES", "AZURE_LOGIN_SCOPES", "MICROSOFT_LOGIN_SCOPES", default="openid profile email") or "").split()
            if scope.strip()
        ],
        "session_secret": get_env_value("SESSION_SECRET", "SECRET_KEY", default="test-microsoft-login-secret"),
    }


CONFIG = build_config()

required_keys = ("client_id", "client_secret", "tenant_id")
missing_keys = [key for key in required_keys if not CONFIG.get(key)]
if missing_keys:
    raise RuntimeError(f"Faltan variables en el .env: {', '.join(missing_keys)}")


app = Flask(__name__)
app.secret_key = str(CONFIG["session_secret"])
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=str(CONFIG["redirect_scheme"]).lower() == "https",
)


HOME_TEMPLATE = """
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Test Microsoft Login</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 40px; color: #1f2937; }
    .card { max-width: 860px; padding: 24px; border: 1px solid #d1d5db; border-radius: 14px; }
    .button { display: inline-block; padding: 12px 18px; background: #0f6cbd; color: white; text-decoration: none; border-radius: 10px; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
    pre { background: #111827; color: #f9fafb; padding: 16px; border-radius: 12px; overflow: auto; }
    .error { color: #b91c1c; }
    .success { color: #166534; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Prueba de login Microsoft</h1>
    <p>Este script solo prueba el inicio de sesión con Entra ID. No pide permisos de Outlook.</p>
    <p><strong>Redirect URI:</strong> <code>{{ redirect_uri }}</code></p>
    <p><strong>Scopes:</strong> <code>{{ scopes }}</code></p>
    {% if error %}<p class="error"><strong>Error:</strong> {{ error }}</p>{% endif %}
    {% if claims %}
      <p class="success"><strong>Login correcto.</strong></p>
      <pre>{{ claims }}</pre>
      <p><a class="button" href="{{ url_for('logout') }}">Cerrar sesión de prueba</a></p>
    {% else %}
      <p><a class="button" href="{{ url_for('login') }}">Iniciar sesión con Microsoft</a></p>
    {% endif %}
  </div>
</body>
</html>
"""


def build_client_app() -> msal.ConfidentialClientApplication:
    return msal.ConfidentialClientApplication(
        client_id=str(CONFIG["client_id"]),
        client_credential=str(CONFIG["client_secret"]),
        authority=str(CONFIG["authority"]),
    )


def get_effective_login_scopes() -> list[str]:
    scopes = [
        scope
        for scope in CONFIG["login_scopes"]
        if str(scope).strip().lower() not in RESERVED_SCOPES
    ]
    return scopes or ["email"]


@app.route("/")
def index():
    claims = session.get("id_token_claims")
    return render_template_string(
        HOME_TEMPLATE,
        redirect_uri=CONFIG["redirect_uri"],
        scopes=" ".join(CONFIG["login_scopes"]),
        claims=claims,
        error=request.args.get("error"),
    )


@app.route("/login")
def login():
    app_client = build_client_app()
    flow = app_client.initiate_auth_code_flow(
        scopes=get_effective_login_scopes(),
        redirect_uri=str(CONFIG["redirect_uri"]),
        prompt="select_account",
    )
    session["auth_flow"] = flow
    return redirect(flow["auth_uri"])


@app.route(str(CONFIG["redirect_path"]))
def auth_callback():
    flow = session.get("auth_flow")
    if not flow:
        return redirect(url_for("index", error="La sesión OAuth de prueba ha caducado."))

    app_client = build_client_app()
    result = app_client.acquire_token_by_auth_code_flow(flow, dict(request.args))
    session.pop("auth_flow", None)

    if result.get("error"):
        message = result.get("error_description") or result.get("error")
        return redirect(url_for("index", error=message))

    session["id_token_claims"] = result.get("id_token_claims") or {}
    return redirect(url_for("index"))


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


if __name__ == "__main__":
    use_https = str(CONFIG["redirect_scheme"]).lower() == "https"
    ssl_context = "adhoc" if use_https else None
    app.run(
        host=str(CONFIG["redirect_host"]),
        port=int(CONFIG["redirect_port"]),
        debug=False,
        ssl_context=ssl_context,
    )