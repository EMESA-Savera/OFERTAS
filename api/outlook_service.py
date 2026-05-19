import os
import ssl
import subprocess
import threading
import time
from pathlib import Path
from urllib.parse import quote


try:
    import msal
except ImportError:
    msal = None

try:
    import requests
except ImportError:
    requests = None

try:
    from requests.adapters import HTTPAdapter
except ImportError:
    HTTPAdapter = None

try:
    import truststore
except ImportError:
    truststore = None


GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"
REQUEST_TIMEOUT_SECONDS = 30
SESSION_CACHE_KEY = "outlook_token_cache"
SESSION_FLOW_KEY = "outlook_auth_flow"
SESSION_FLOWS_KEY = "outlook_auth_flows"
APP_ONLY_SCOPE = ["https://graph.microsoft.com/.default"]
_APP_ONLY_TOKEN_CACHE = {}
RESERVED_DELEGATED_SCOPES = {"openid", "profile", "offline_access"}
SYSTEM_TRUST_ENV_VARS = ("REQUESTS_CA_BUNDLE", "CURL_CA_BUNDLE", "SSL_CERT_FILE", "SSL_CERT_DIR")
WINDOWS_CA_STORES = ("ROOT", "CA")
FLOW_CACHE_TTL_SECONDS = 15 * 60
_FLOW_STATE_CACHE = {}
_FLOW_STATE_LOCK = threading.Lock()


class _SSLContextAdapter(HTTPAdapter):
    def __init__(self, ssl_context, *args, **kwargs):
        self._ssl_context = ssl_context
        super().__init__(*args, **kwargs)

    def init_poolmanager(self, *args, **kwargs):
        kwargs["ssl_context"] = self._ssl_context
        return super().init_poolmanager(*args, **kwargs)

    def proxy_manager_for(self, *args, **kwargs):
        kwargs["ssl_context"] = self._ssl_context
        return super().proxy_manager_for(*args, **kwargs)


class OutlookGraphError(RuntimeError):
    pass


class OutlookGraphService:
    FOLDER_MAP = {
        "entrada": "inbox",
        "inbox": "inbox",
        "bandeja de entrada": "inbox",
        "sent": "sentitems",
        "sentitems": "sentitems",
        "enviados": "sentitems",
        "drafts": "drafts",
        "borradores": "drafts",
        "archive": "archive",
        "archivo": "archive",
        "deleteditems": "deleteditems",
        "eliminados": "deleteditems",
    }

    @staticmethod
    def _getenv(*names):
        for name in names:
            value = os.getenv(name)
            if value is not None and str(value).strip():
                return str(value).strip()
        return None

    @staticmethod
    def _normalize_auth_mode(value):
        normalized = str(value or "").strip().lower().replace("_", "-")
        if normalized in {"app-only", "service", "daemon"}:
            return "app-only"
        if normalized in {"delegated", "interactive", "user"}:
            return "delegated"
        return None

    @staticmethod
    def _cache_auth_flow(flow_state, flow):
        if not flow_state or not isinstance(flow, dict):
            return

        now = time.time()
        with _FLOW_STATE_LOCK:
            _FLOW_STATE_CACHE[flow_state] = {
                "created_at": now,
                "flow": flow,
            }
            expired_states = [
                state
                for state, entry in _FLOW_STATE_CACHE.items()
                if now - entry.get("created_at", now) > FLOW_CACHE_TTL_SECONDS
            ]
            for state in expired_states:
                _FLOW_STATE_CACHE.pop(state, None)

    @staticmethod
    def _pop_cached_auth_flow(flow_state):
        if not flow_state:
            return None

        now = time.time()
        with _FLOW_STATE_LOCK:
            entry = _FLOW_STATE_CACHE.pop(flow_state, None)
        if not entry:
            return None
        if now - entry.get("created_at", now) > FLOW_CACHE_TTL_SECONDS:
            return None
        flow = entry.get("flow")
        return flow if isinstance(flow, dict) else None

    @classmethod
    def get_config(cls):
        redirect_uri = cls._getenv("OAUTH_REDIRECT_URI", "AZURE_REDIRECT_URI", "MICROSOFT_REDIRECT_URI", "OUTLOOK_REDIRECT_URI")
        login_scopes_raw = cls._getenv("OAUTH_LOGIN_SCOPES", "AZURE_LOGIN_SCOPES", "MICROSOFT_LOGIN_SCOPES") or "openid profile offline_access User.Read"
        scopes_raw = cls._getenv("OAUTH_SCOPES", "AZURE_SCOPES", "MICROSOFT_SCOPES", "OUTLOOK_SCOPES") or "openid profile offline_access User.Read Mail.Send"
        mailbox = cls._getenv("AZURE_MAILBOX", "OUTLOOK_MAILBOX", "OUTLOOK_MAILBOX_MATCH", "MICROSOFT_GRAPH_MAILBOX")
        configured_auth_mode = cls._normalize_auth_mode(
            cls._getenv("OAUTH_AUTH_MODE", "AZURE_AUTH_MODE", "MICROSOFT_AUTH_MODE", "OUTLOOK_AUTH_MODE")
        )
        if configured_auth_mode:
            auth_mode = configured_auth_mode
        elif mailbox:
            auth_mode = "app-only"
        elif redirect_uri:
            auth_mode = "delegated"
        else:
            auth_mode = "delegated"

        return {
            "client_id": cls._getenv("OAUTH_CLIENT_ID", "AZURE_CLIENT_ID", "MICROSOFT_CLIENT_ID", "CLIENT_ID"),
            "client_secret": cls._getenv("OAUTH_CLIENT_SECRET", "AZURE_CLIENT_SECRET", "MICROSOFT_CLIENT_SECRET", "CLIENT_SECRET"),
            "tenant_id": cls._getenv("OAUTH_TENANT_ID", "AZURE_TENANT_ID", "MICROSOFT_TENANT_ID", "TENANT_ID"),
            "authority_base": cls._getenv("OAUTH_AUTHORITY", "AZURE_AUTHORITY", "MICROSOFT_AUTHORITY_BASE") or "https://login.microsoftonline.com",
            "redirect_uri": redirect_uri,
            "mailbox": mailbox,
            "auth_mode": auth_mode,
            "login_scopes": [scope.strip() for scope in login_scopes_raw.split() if scope.strip()],
            "scopes": [scope.strip() for scope in scopes_raw.split() if scope.strip()],
        }

    @classmethod
    def _get_transport_config(cls):
        ca_bundle = cls._getenv("OAUTH_CA_BUNDLE", "AZURE_CA_BUNDLE", "MICROSOFT_CA_BUNDLE")
        auto_generate_ca_bundle = str(
            cls._getenv("OAUTH_AUTO_GENERATE_CA_BUNDLE", "AZURE_AUTO_GENERATE_CA_BUNDLE", "MICROSOFT_AUTO_GENERATE_CA_BUNDLE")
            or "1"
        ).strip().lower() not in {"0", "false", "no", "off"}
        use_system_trust_store = str(
            cls._getenv("OAUTH_USE_SYSTEM_TRUST_STORE", "AZURE_USE_SYSTEM_TRUST_STORE", "MICROSOFT_USE_SYSTEM_TRUST_STORE")
            or ""
        ).strip().lower() in {"1", "true", "yes", "on"}
        return {
            "ca_bundle": ca_bundle,
            "auto_generate_ca_bundle": auto_generate_ca_bundle,
            "use_system_trust_store": use_system_trust_store,
        }

    @classmethod
    def _read_certifi_bundle_text(cls):
        try:
            import certifi

            bundle_path = Path(certifi.where()).resolve()
            if bundle_path.exists() and bundle_path.is_file():
                return bundle_path.read_text(encoding="utf-8", errors="ignore").strip()
        except Exception:
            return ""

        return ""

    @classmethod
    def _try_export_windows_ca_bundle_via_powershell(cls, bundle_path):
        if os.name != "nt":
            return False

        bundle_path = Path(bundle_path).expanduser().resolve()
        bundle_path.parent.mkdir(parents=True, exist_ok=True)
        powershell_exe = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "WindowsPowerShell" / "v1.0" / "powershell.exe"
        executable = str(powershell_exe) if powershell_exe.exists() else "powershell.exe"
        script = r"""
$ErrorActionPreference = 'SilentlyContinue'
$outputPath = $env:OFERTAS_CA_BUNDLE_OUT
$outputDirectory = [System.IO.Path]::GetDirectoryName($outputPath)
if ($outputDirectory) {
    [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}

$lines = New-Object System.Collections.Generic.List[string]
$seen  = New-Object 'System.Collections.Generic.HashSet[string]'
$stores = @(
    'Cert:\LocalMachine\Root',
    'Cert:\LocalMachine\CA',
    'Cert:\LocalMachine\AuthRoot',
    'Cert:\CurrentUser\Root',
    'Cert:\CurrentUser\CA',
    'Cert:\CurrentUser\AuthRoot'
)

foreach ($store in $stores) {
    if (-not (Test-Path $store)) { continue }
    Get-ChildItem -Path $store -ErrorAction SilentlyContinue | ForEach-Object {
        $tp = $_.Thumbprint
        if (-not $tp -or -not $seen.Add($tp)) { return }
        $b64 = [System.Convert]::ToBase64String($_.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
        $lines.Add('-----BEGIN CERTIFICATE-----')
        foreach ($l in ($b64 -split "`r?`n")) { if ($l) { $lines.Add($l) } }
        $lines.Add('-----END CERTIFICATE-----')
        $lines.Add('')
    }
}

$script:liveCerts = New-Object System.Collections.Generic.List[System.Security.Cryptography.X509Certificates.X509Certificate2]
try {
    $prevCb = [System.Net.ServicePointManager]::ServerCertificateValidationCallback
    [System.Net.ServicePointManager]::SecurityProtocol = `
        [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = `
        [System.Net.Security.RemoteCertificateValidationCallback]{
            param($sender, $certificate, $chain, $sslPolicyErrors)
            if ($chain -ne $null -and $chain.ChainElements.Count -gt 1) {
                for ($i = 1; $i -lt $chain.ChainElements.Count; $i++) {
                    $script:liveCerts.Add($chain.ChainElements[$i].Certificate)
                }
            }
            return $true
        }
    $msftHosts = @('login.microsoftonline.com', 'graph.microsoft.com', 'login.microsoft.com')
    foreach ($h in $msftHosts) {
        try {
            $req = [System.Net.WebRequest]::Create("https://$h")
            $req.Method  = 'HEAD'
            $req.Timeout = 8000
            try { $resp = $req.GetResponse(); if ($resp) { $resp.Close() } } catch [System.Net.WebException] {}
        } catch {}
    }
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $prevCb

    foreach ($cert in $script:liveCerts) {
        $tp = $cert.Thumbprint
        if (-not $tp -or -not $seen.Add($tp)) { continue }
        $b64 = [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
        $lines.Add('-----BEGIN CERTIFICATE-----')
        foreach ($l in ($b64 -split "`r?`n")) { if ($l) { $lines.Add($l) } }
        $lines.Add('-----END CERTIFICATE-----')
        $lines.Add('')
    }
} catch {}

[System.IO.File]::WriteAllLines($outputPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output ('CERT_COUNT=' + $seen.Count)
"""
        try:
            env = os.environ.copy()
            env["OFERTAS_CA_BUNDLE_OUT"] = str(bundle_path)
            result = subprocess.run(
                [
                    executable,
                    "-NoProfile",
                    "-NonInteractive",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command",
                    script,
                ],
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
                env=env,
            )
        except Exception:
            return False

        return result.returncode == 0 and bundle_path.exists() and bundle_path.stat().st_size > 0

    @classmethod
    def _try_build_windows_ca_bundle(cls, bundle_path):
        if os.name != "nt":
            return False

        bundle_path = Path(bundle_path).expanduser().resolve()
        bundle_path.parent.mkdir(parents=True, exist_ok=True)
        certifi_text = cls._read_certifi_bundle_text()

        if cls._try_export_windows_ca_bundle_via_powershell(bundle_path):
            windows_text = bundle_path.read_text(encoding="utf-8", errors="ignore").strip()
            merged = [part for part in (certifi_text, windows_text) if part]
            if not merged:
                return False
            bundle_path.write_text("\n\n".join(merged).rstrip() + "\n", encoding="utf-8")
            return True

        pem_blocks = []
        if certifi_text:
            pem_blocks.append(certifi_text.rstrip() + "\n")

        seen_blocks = set()
        for store_name in WINDOWS_CA_STORES:
            try:
                for cert_bytes, encoding_type, _trust in ssl.enum_certificates(store_name):
                    if encoding_type != "x509_asn":
                        continue
                    pem_block = ssl.DER_cert_to_PEM_cert(cert_bytes)
                    if pem_block in seen_blocks:
                        continue
                    seen_blocks.add(pem_block)
                    pem_blocks.append(pem_block.rstrip() + "\n")
            except Exception:
                continue

        if not pem_blocks:
            return False

        bundle_path.write_text("\n".join(block.rstrip() for block in pem_blocks) + "\n", encoding="utf-8")
        return True

    @classmethod
    def _resolve_ca_bundle_path(cls, ca_bundle, auto_generate):
        if not ca_bundle:
            return None

        bundle_path = Path(ca_bundle).expanduser()
        if bundle_path.exists() and bundle_path.is_file():
            return str(bundle_path.resolve())

        if auto_generate and cls._try_build_windows_ca_bundle(bundle_path):
            regenerated = Path(ca_bundle).expanduser()
            if regenerated.exists() and regenerated.is_file():
                return str(regenerated.resolve())

        raise OutlookGraphError(f"No se encuentra el bundle TLS de Microsoft: {ca_bundle}")

    @classmethod
    def _clear_inherited_ca_env_vars(cls):
        for env_name in SYSTEM_TRUST_ENV_VARS:
            os.environ.pop(env_name, None)

    @classmethod
    def _build_http_client(cls):
        if requests is None:
            raise OutlookGraphError("Falta la dependencia requests para conectar con Microsoft Graph")

        transport = cls._get_transport_config()
        use_system_trust_store = transport["use_system_trust_store"]
        ca_bundle = transport["ca_bundle"]
        auto_generate_ca_bundle = transport["auto_generate_ca_bundle"]

        if HTTPAdapter is None:
            raise OutlookGraphError("No se pudo inicializar el adaptador HTTPS para Microsoft Graph")

        try:
            if ca_bundle:
                resolved_bundle = cls._resolve_ca_bundle_path(ca_bundle, auto_generate_ca_bundle)
                ssl_context = ssl.create_default_context(cafile=resolved_bundle)
            elif use_system_trust_store:
                cls._clear_inherited_ca_env_vars()
                if truststore is None:
                    return None
                ssl_context = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            else:
                return None
        except OutlookGraphError:
            raise
        except Exception as exc:
            raise OutlookGraphError(f"No se pudo preparar la confianza TLS saliente hacia Microsoft: {exc}") from exc

        session = requests.Session()
        adapter = _SSLContextAdapter(ssl_context=ssl_context)
        session.mount("https://", adapter)
        return session

    @classmethod
    def get_status(cls, session_store=None):
        config = cls.get_config()
        missing_dependencies = []
        if msal is None:
            missing_dependencies.append("msal")
        if requests is None:
            missing_dependencies.append("requests")

        required_keys = {"client_id", "client_secret", "tenant_id"}
        if config["auth_mode"] == "delegated":
            required_keys.add("redirect_uri")
        if config["auth_mode"] == "app-only":
            required_keys.add("mailbox")

        missing_config = [
            key for key, value in config.items()
            if key in required_keys and not value
        ]

        account = cls.get_connected_account(session_store) if session_store is not None and not missing_dependencies and not missing_config else None
        return {
            "configured": not missing_config,
            "available": not missing_dependencies,
            "connected": bool(account),
            "account": account,
            "auth_mode": config["auth_mode"],
            "mailbox": config.get("mailbox"),
            "missing_config": missing_config,
            "missing_dependencies": missing_dependencies,
            "scopes": config["scopes"],
        }

    @classmethod
    def _validate_ready(cls):
        status = cls.get_status(None)
        if not status["available"]:
            raise OutlookGraphError(
                f"Faltan dependencias para Outlook Graph: {', '.join(status['missing_dependencies'])}"
            )
        if not status["configured"]:
            raise OutlookGraphError(
                f"Falta configurar Outlook Graph: {', '.join(status['missing_config'])}"
            )
        return cls.get_config()

    @classmethod
    def _build_authority(cls, config):
        authority_base = str(config.get("authority_base") or "").rstrip("/")
        tenant_id = str(config.get("tenant_id") or "").strip().strip("/")
        if authority_base.lower().endswith(f"/{tenant_id.lower()}"):
            return authority_base
        return f"{authority_base}/{tenant_id}"

    @classmethod
    def _get_effective_delegated_scopes(cls, config, scopes=None):
        scopes = [
            scope for scope in ((scopes if scopes is not None else config.get("scopes")) or [])
            if str(scope or "").strip().lower() not in RESERVED_DELEGATED_SCOPES
        ]
        return scopes or ["User.Read"]

    @classmethod
    def get_login_scopes(cls):
        config = cls.get_config()
        return config.get("login_scopes") or ["openid", "profile", "email"]

    @classmethod
    def _get_app_only_account(cls, config):
        mailbox = config.get("mailbox")
        if not mailbox:
            return None
        return {
            "username": mailbox,
            "name": mailbox,
            "home_account_id": None,
        }

    @classmethod
    def _get_token_cache(cls, session_store):
        cache = msal.SerializableTokenCache()
        if session_store is not None and session_store.get(SESSION_CACHE_KEY):
            try:
                cache.deserialize(session_store[SESSION_CACHE_KEY])
            except Exception:
                session_store.pop(SESSION_CACHE_KEY, None)
        return cache

    @classmethod
    def _persist_token_cache(cls, session_store, cache):
        if session_store is not None and cache.has_state_changed:
            session_store[SESSION_CACHE_KEY] = cache.serialize()

    @classmethod
    def _build_client_app(cls, session_store):
        config = cls._validate_ready()
        cache = cls._get_token_cache(session_store)
        client_kwargs = {
            "client_id": config["client_id"],
            "client_credential": config["client_secret"],
            "authority": cls._build_authority(config),
            "token_cache": cache,
        }
        http_client = cls._build_http_client()
        if http_client is not None:
            client_kwargs["http_client"] = http_client

        app = msal.ConfidentialClientApplication(**client_kwargs)
        return config, cache, app

    @classmethod
    def get_connected_account(cls, session_store):
        config = cls.get_config()
        if config["auth_mode"] == "app-only":
            status = cls.get_status(None)
            if not status["available"] or not status["configured"]:
                return None
            return cls._get_app_only_account(config)

        if session_store is None:
            return None

        try:
            _, cache, app = cls._build_client_app(session_store)
        except OutlookGraphError:
            return None

        accounts = app.get_accounts()
        cls._persist_token_cache(session_store, cache)
        if not accounts:
            return None

        account = accounts[0]
        username = account.get("username") or account.get("preferred_username") or account.get("home_account_id")
        return {
            "username": username,
            "name": account.get("name") or username,
            "home_account_id": account.get("home_account_id"),
        }

    @classmethod
    def start_auth_flow(cls, session_store, scopes=None, redirect_uri=None):
        config = cls.get_config()
        if config["auth_mode"] != "delegated":
            raise OutlookGraphError("El modo app-only no inicia sesión de usuario. Configura redirect_uri si quieres login interactivo.")

        config, cache, app = cls._build_client_app(session_store)
        effective_redirect_uri = str(redirect_uri or config["redirect_uri"] or "").strip()
        if not effective_redirect_uri:
            raise OutlookGraphError("Falta configurar Outlook Graph: redirect_uri")
        flow = app.initiate_auth_code_flow(
            scopes=cls._get_effective_delegated_scopes(config, scopes=scopes),
            redirect_uri=effective_redirect_uri,
            prompt="select_account",
        )
        cls._persist_token_cache(session_store, cache)
        flow_state = str(flow.get("state") or "").strip()
        if flow_state:
            cls._cache_auth_flow(flow_state, flow)
            stored_flows = session_store.get(SESSION_FLOWS_KEY)
            if not isinstance(stored_flows, dict):
                stored_flows = {}
            stored_flows[flow_state] = flow
            if len(stored_flows) > 5:
                oldest_keys = list(stored_flows.keys())[:-5]
                for key in oldest_keys:
                    stored_flows.pop(key, None)
            session_store[SESSION_FLOWS_KEY] = stored_flows
        session_store[SESSION_FLOW_KEY] = flow
        auth_uri = flow.get("auth_uri")
        if not auth_uri:
            raise OutlookGraphError("No se pudo iniciar la autenticación con Microsoft")
        return auth_uri

    @classmethod
    def complete_auth_flow(cls, session_store, auth_response, require_access_token=True):
        request_state = str((auth_response or {}).get("state") or "").strip()
        stored_flows = session_store.get(SESSION_FLOWS_KEY)
        flow = None

        if isinstance(stored_flows, dict) and request_state:
            flow = stored_flows.pop(request_state, None)
            if stored_flows:
                session_store[SESSION_FLOWS_KEY] = stored_flows
            else:
                session_store.pop(SESSION_FLOWS_KEY, None)

        if flow is None:
            flow = session_store.pop(SESSION_FLOW_KEY, None)
        if flow is None:
            flow = cls._pop_cached_auth_flow(request_state)
        if not flow:
            raise OutlookGraphError("La sesión de autenticación de Outlook ha caducado. Vuelve a intentarlo.")

        config, cache, app = cls._build_client_app(session_store)
        try:
            result = app.acquire_token_by_auth_code_flow(flow, auth_response)
        except ValueError as exc:
            message = str(exc)
            if "state mismatch" in message.lower():
                raise OutlookGraphError("La sesión de autenticación de Outlook ha caducado. Vuelve a intentarlo.") from exc
            raise OutlookGraphError(f"Microsoft devolvió un error al completar la autenticación: {message}") from exc
        cls._persist_token_cache(session_store, cache)

        if result.get("error"):
            message = result.get("error_description") or result.get("error")
            raise OutlookGraphError(f"Microsoft devolvió un error: {message}")

        if require_access_token and not result.get("access_token"):
            raise OutlookGraphError("Microsoft no devolvió un token de acceso para Outlook")

        account = cls.get_connected_account(session_store)
        id_token_claims = result.get("id_token_claims") or {}
        profile = {
            "id": id_token_claims.get("oid") or id_token_claims.get("sub"),
            "display_name": id_token_claims.get("name") or (account.get("name") if account else None),
            "mail": id_token_claims.get("email") or id_token_claims.get("preferred_username"),
            "user_principal_name": id_token_claims.get("preferred_username") or id_token_claims.get("upn") or (account.get("username") if account else None),
            "employee_id": id_token_claims.get("employeeid") or id_token_claims.get("employee_id"),
            "given_name": id_token_claims.get("given_name"),
            "surname": id_token_claims.get("family_name"),
            "account": account,
        }

        if result.get("access_token"):
            try:
                graph_profile = cls.get_user_profile(session_store)
            except OutlookGraphError:
                graph_profile = None
            if graph_profile:
                profile.update({key: value for key, value in graph_profile.items() if value is not None})

        return {
            "account": account,
            "id_token_claims": id_token_claims,
            "profile": profile,
            "scopes": result.get("scope") or config["scopes"],
        }

    @classmethod
    def disconnect(cls, session_store):
        if session_store is None:
            return
        session_store.pop(SESSION_CACHE_KEY, None)
        session_store.pop(SESSION_FLOW_KEY, None)
        session_store.pop(SESSION_FLOWS_KEY, None)

    @classmethod
    def get_access_token(cls, session_store):
        config = cls.get_config()
        if config["auth_mode"] == "app-only":
            cache_key = f"{config['client_id']}:{config['tenant_id']}"
            if cache_key in _APP_ONLY_TOKEN_CACHE:
                return _APP_ONLY_TOKEN_CACHE[cache_key]

            _, _, app = cls._build_client_app(None)
            result = app.acquire_token_for_client(scopes=APP_ONLY_SCOPE)
            access_token = (result or {}).get("access_token")
            if not access_token:
                message = result.get("error_description") or result.get("error") or "No se pudo obtener el token app-only"
                raise OutlookGraphError(f"No se pudo obtener el token de Outlook: {message}")
            _APP_ONLY_TOKEN_CACHE[cache_key] = access_token
            return access_token

        config, cache, app = cls._build_client_app(session_store)
        accounts = app.get_accounts()
        if not accounts:
            raise OutlookGraphError("Outlook no está conectado para este usuario")

        result = app.acquire_token_silent(scopes=cls._get_effective_delegated_scopes(config), account=accounts[0])
        cls._persist_token_cache(session_store, cache)

        access_token = (result or {}).get("access_token")
        if not access_token:
            raise OutlookGraphError("La sesión de Outlook ha caducado. Vuelve a conectar tu cuenta de Microsoft.")
        return access_token

    @classmethod
    def get_user_profile(cls, session_store):
        if cls.get_config()["auth_mode"] == "app-only":
            raise OutlookGraphError("El modo app-only no expone un perfil /me del usuario autenticado.")

        payload = cls._request(
            session_store,
            "GET",
            "/me",
            params={
                "$select": "id,displayName,mail,userPrincipalName,employeeId,givenName,surname",
            },
        )
        account = cls.get_connected_account(session_store) or {}
        return {
            "id": payload.get("id"),
            "display_name": payload.get("displayName") or account.get("name"),
            "mail": payload.get("mail"),
            "user_principal_name": payload.get("userPrincipalName") or account.get("username"),
            "employee_id": payload.get("employeeId"),
            "given_name": payload.get("givenName"),
            "surname": payload.get("surname"),
            "account": account,
        }

    @staticmethod
    def _normalize_folder(folder_name):
        normalized = str(folder_name or "inbox").strip().lower()
        return OutlookGraphService.FOLDER_MAP.get(normalized, normalized or "inbox")

    @staticmethod
    def _serialize_recipient(recipient):
        email_address = ((recipient or {}).get("emailAddress") or {})
        address = (email_address.get("address") or "").strip()
        return {
            "name": (email_address.get("name") or "").strip() or None,
            "address": address or None,
        }

    @classmethod
    def _request(cls, session_store, method, endpoint, params=None, json_payload=None):
        access_token = cls.get_access_token(session_store)
        http_client = cls._build_http_client()
        response = http_client.request(
            method=method.upper(),
            url=f"{GRAPH_BASE_URL}{endpoint}",
            params=params,
            json=json_payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        if response.status_code >= 400:
            try:
                payload = response.json()
                graph_error = ((payload or {}).get("error") or {})
                message = graph_error.get("message") or response.text
            except Exception:
                message = response.text
            if response.status_code == 401:
                raise OutlookGraphError("La sesión de Outlook ha caducado. Vuelve a conectar tu cuenta de Microsoft.")
            raise OutlookGraphError(f"Graph API devolvió {response.status_code}: {message}")

        if response.text:
            return response.json()
        return {"success": True, "status_code": response.status_code}

    @classmethod
    def _serialize_message_summary(cls, message):
        sender = cls._serialize_recipient(message.get("from"))
        return {
            "id": message.get("id"),
            "subject": message.get("subject") or "(sin asunto)",
            "received_at": message.get("receivedDateTime"),
            "body_preview": message.get("bodyPreview") or "",
            "sender_name": sender.get("name"),
            "sender_email": sender.get("address"),
            "is_read": bool(message.get("isRead")),
            "has_attachments": bool(message.get("hasAttachments")),
            "conversation_id": message.get("conversationId"),
            "web_link": message.get("webLink"),
        }

    @classmethod
    def _serialize_message_detail(cls, message):
        sender = cls._serialize_recipient(message.get("from"))
        recipients = [cls._serialize_recipient(item) for item in (message.get("toRecipients") or [])]
        cc_recipients = [cls._serialize_recipient(item) for item in (message.get("ccRecipients") or [])]
        body = message.get("body") or {}
        return {
            "id": message.get("id"),
            "subject": message.get("subject") or "(sin asunto)",
            "received_at": message.get("receivedDateTime"),
            "body_preview": message.get("bodyPreview") or "",
            "body_content": body.get("content") or "",
            "body_content_type": body.get("contentType") or "text",
            "sender_name": sender.get("name"),
            "sender_email": sender.get("address"),
            "to_recipients": recipients,
            "cc_recipients": cc_recipients,
            "is_read": bool(message.get("isRead")),
            "has_attachments": bool(message.get("hasAttachments")),
            "conversation_id": message.get("conversationId"),
            "internet_message_id": message.get("internetMessageId"),
            "web_link": message.get("webLink"),
        }

    @classmethod
    def list_messages(cls, session_store, folder="inbox", top=20):
        folder_name = cls._normalize_folder(folder)
        config = cls.get_config()
        mailbox = quote(str(config.get("mailbox") or ""), safe="")
        endpoint = f"/me/mailFolders/{folder_name}/messages"
        if config["auth_mode"] == "app-only":
            endpoint = f"/users/{mailbox}/mailFolders/{folder_name}/messages"

        payload = cls._request(
            session_store,
            "GET",
            endpoint,
            params={
                "$top": max(1, min(int(top or 20), 50)),
                "$orderby": "receivedDateTime DESC",
                "$select": "id,subject,receivedDateTime,bodyPreview,from,isRead,hasAttachments,conversationId,webLink",
            },
        )
        account = cls.get_connected_account(session_store)
        return {
            "account": account,
            "folder": folder_name,
            "messages": [cls._serialize_message_summary(item) for item in payload.get("value", [])],
        }

    @classmethod
    def get_message(cls, session_store, message_id):
        config = cls.get_config()
        mailbox = quote(str(config.get("mailbox") or ""), safe="")
        endpoint = f"/me/messages/{quote(str(message_id), safe='')}"
        if config["auth_mode"] == "app-only":
            endpoint = f"/users/{mailbox}/messages/{quote(str(message_id), safe='')}"

        payload = cls._request(
            session_store,
            "GET",
            endpoint,
            params={
                "$select": "id,subject,receivedDateTime,bodyPreview,body,from,toRecipients,ccRecipients,isRead,hasAttachments,conversationId,internetMessageId,webLink",
            },
        )
        detail = cls._serialize_message_detail(payload)
        detail["account"] = cls.get_connected_account(session_store)
        return detail

    @classmethod
    def list_messages_by_conversation(cls, session_store, conversation_id, top=100):
        conversation_key = str(conversation_id or "").strip()
        if not conversation_key:
            return []

        config = cls.get_config()
        mailbox = quote(str(config.get("mailbox") or ""), safe="")
        endpoint = "/me/messages"
        if config["auth_mode"] == "app-only":
            endpoint = f"/users/{mailbox}/messages"

        escaped_conversation = conversation_key.replace("'", "''")
        payload = cls._request(
            session_store,
            "GET",
            endpoint,
            params={
                "$top": max(1, min(int(top or 100), 200)),
                "$orderby": "receivedDateTime ASC",
                "$filter": f"conversationId eq '{escaped_conversation}'",
                "$select": "id,subject,receivedDateTime,bodyPreview,body,from,toRecipients,ccRecipients,isRead,hasAttachments,conversationId,internetMessageId,webLink",
            },
        )
        return [cls._serialize_message_detail(item) for item in payload.get("value", [])]

    @staticmethod
    def _normalize_recipients(value, field_name):
        if isinstance(value, str):
            raw_items = [item.strip() for item in value.replace(";", ",").split(",")]
        elif isinstance(value, list):
            raw_items = [str(item).strip() for item in value]
        else:
            raw_items = []

        recipients = []
        seen = set()
        for item in raw_items:
            if not item:
                continue
            normalized = item.lower()
            if "@" not in item:
                raise OutlookGraphError(f"El campo {field_name} contiene un correo no válido: {item}")
            if normalized in seen:
                continue
            seen.add(normalized)
            recipients.append({"emailAddress": {"address": item}})
        return recipients

    @classmethod
    def send_mail(cls, session_store, subject, body, to_recipients, cc_recipients=None, is_html=True, save_to_sent_items=True):
        recipients = cls._normalize_recipients(to_recipients, "to_recipients")
        if not recipients:
            raise OutlookGraphError("Debes indicar al menos un destinatario en to_recipients")

        payload = {
            "message": {
                "subject": str(subject or "").strip(),
                "body": {
                    "contentType": "HTML" if is_html else "Text",
                    "content": str(body or ""),
                },
                "toRecipients": recipients,
                "ccRecipients": cls._normalize_recipients(cc_recipients or [], "cc_recipients"),
            },
            "saveToSentItems": bool(save_to_sent_items),
        }

        if not payload["message"]["subject"]:
            raise OutlookGraphError("El asunto es obligatorio")
        if not payload["message"]["body"]["content"].strip():
            raise OutlookGraphError("El cuerpo del correo es obligatorio")

        config = cls.get_config()
        mailbox = quote(str(config.get("mailbox") or ""), safe="")
        endpoint = "/me/sendMail"
        if config["auth_mode"] == "app-only":
            endpoint = f"/users/{mailbox}/sendMail"

        cls._request(session_store, "POST", endpoint, json_payload=payload)
        return {"success": True, "account": cls.get_connected_account(session_store)}