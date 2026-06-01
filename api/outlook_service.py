import os
import ssl
from urllib.parse import quote, unquote


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
        use_system_trust_store = str(
            cls._getenv("OAUTH_USE_SYSTEM_TRUST_STORE", "AZURE_USE_SYSTEM_TRUST_STORE", "MICROSOFT_USE_SYSTEM_TRUST_STORE")
            or ""
        ).strip().lower() in {"1", "true", "yes", "on"}
        return {
            "ca_bundle": ca_bundle,
            "use_system_trust_store": use_system_trust_store,
        }

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

        if HTTPAdapter is None:
            raise OutlookGraphError("No se pudo inicializar el adaptador HTTPS para Microsoft Graph")

        try:
            if ca_bundle:
                if not os.path.exists(ca_bundle):
                    raise OutlookGraphError(f"No se encuentra el bundle TLS de Microsoft: {ca_bundle}")
                ssl_context = ssl.create_default_context(cafile=ca_bundle)
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
    def _encode_graph_path_segment(value):
        raw_value = str(value or "").strip()
        if not raw_value:
            return ""
        # Normalize already-encoded inputs (e.g. %2F) to avoid double encoding.
        return quote(unquote(raw_value), safe="")

    @staticmethod
    def _looks_like_message_not_found(error_message):
        normalized = str(error_message or "").strip().lower()
        return (
            "resource not found for the segment" in normalized
            or "erroritemnotfound" in normalized
            or "item not found" in normalized
        )

    @classmethod
    def _translate_exchange_message_ids(cls, session_store, raw_message_id, config):
        raw_id = str(raw_message_id or "").strip()
        if not raw_id:
            return []

        mailbox = quote(str(config.get("mailbox") or ""), safe="")
        endpoint = "/me/translateExchangeIds"
        if config["auth_mode"] == "app-only":
            endpoint = f"/users/{mailbox}/translateExchangeIds"

        source_id_candidates = [raw_id]
        decoded_raw_id = unquote(raw_id)
        if decoded_raw_id and decoded_raw_id not in source_id_candidates:
            source_id_candidates.append(decoded_raw_id)

        source_types = ["restId", "restImmutableEntryId", "ewsId", "entryId", "immutableEntryId"]
        target_types = ["restId", "restImmutableEntryId"]
        translated_ids = []
        seen_ids = set()

        for source_id in source_id_candidates:
            for source_type in source_types:
                for target_type in target_types:
                    if source_type == target_type:
                        continue

                    payload = {
                        "inputIds": [source_id],
                        "sourceIdType": source_type,
                        "targetIdType": target_type,
                    }
                    try:
                        translate_result = cls._request(
                            session_store,
                            "POST",
                            endpoint,
                            json_payload=payload,
                        )
                    except OutlookGraphError:
                        continue

                    for item in (translate_result or {}).get("value", []):
                        target_id = str((item or {}).get("targetId") or "").strip()
                        if not target_id:
                            continue
                        if target_id in seen_ids:
                            continue
                        seen_ids.add(target_id)
                        translated_ids.append(target_id)

        return translated_ids

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
                "$select": "id,subject,receivedDateTime,bodyPreview,from,isRead,hasAttachments,webLink",
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
        message_id_candidates = []

        primary_message_id = str(message_id or "").strip()
        if primary_message_id:
            message_id_candidates.append(primary_message_id)

        decoded_message_id = unquote(primary_message_id)
        if decoded_message_id and decoded_message_id not in message_id_candidates:
            message_id_candidates.append(decoded_message_id)

        translated_message_ids = cls._translate_exchange_message_ids(session_store, primary_message_id, config)
        for translated_message_id in translated_message_ids:
            if translated_message_id not in message_id_candidates:
                message_id_candidates.append(translated_message_id)

        last_not_found_error = None
        for candidate_id in message_id_candidates:
            encoded_message_id = cls._encode_graph_path_segment(candidate_id)
            endpoint = f"/me/messages/{encoded_message_id}"
            if config["auth_mode"] == "app-only":
                endpoint = f"/users/{mailbox}/messages/{encoded_message_id}"

            try:
                payload = cls._request(
                    session_store,
                    "GET",
                    endpoint,
                    params={
                        "$select": "id,subject,receivedDateTime,bodyPreview,body,from,toRecipients,ccRecipients,isRead,hasAttachments,internetMessageId,webLink",
                    },
                )
                detail = cls._serialize_message_detail(payload)
                detail["account"] = cls.get_connected_account(session_store)
                return detail
            except OutlookGraphError as exc:
                if cls._looks_like_message_not_found(exc):
                    last_not_found_error = exc
                    continue
                raise

        if last_not_found_error is not None:
            raise last_not_found_error
        raise OutlookGraphError("No se pudo resolver el identificador del correo en Microsoft Graph")

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