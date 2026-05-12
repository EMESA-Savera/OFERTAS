import hashlib
import importlib
import ipaddress
import os
import re
import sys
import tempfile
from contextlib import contextmanager
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from email.header import decode_header, make_header
from email import policy
from email.parser import BytesParser
from email.utils import parseaddr, parsedate_to_datetime
from html import escape as html_escape, unescape
from html.parser import HTMLParser
from urllib.parse import urlparse

import pyodbc
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, render_template_string, request, session, url_for
from flask_cors import CORS
from flask_session import Session
from outlook_service import OutlookGraphError, OutlookGraphService
from werkzeug.security import check_password_hash


def get_runtime_root():
    if getattr(sys, "frozen", False):
        return getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_runtime_env(project_dir):
    candidate_paths = []
    is_frozen = getattr(sys, "frozen", False)

    if is_frozen:
        executable_dir = os.path.dirname(sys.executable)
        candidate_paths.append(os.path.join(executable_dir, ".env.production"))
        candidate_paths.append(os.path.join(project_dir, ".env.production"))
        candidate_paths.append(os.path.join(executable_dir, ".env"))
    else:
        candidate_paths.append(os.path.join(project_dir, ".env"))

    seen = set()
    for env_path in candidate_paths:
        normalized = os.path.normpath(env_path)
        if normalized in seen:
            continue
        seen.add(normalized)
        if os.path.exists(env_path):
            load_dotenv(env_path, override=True)


PROJECT_DIR = get_runtime_root()
load_runtime_env(PROJECT_DIR)
if not getattr(sys, "frozen", False):
    load_dotenv(override=True)


def get_env_value(*names, default=None):
    for name in names:
        value = os.getenv(name)
        if value is not None and str(value).strip() != "":
            return value
    return default


class Config:
    SECRET_KEY = get_env_value("SESSION_SECRET", "SECRET_KEY", default="ofertas-dev-secret-key")
    APP_ENV = get_env_value("APP_ENV", "FLASK_ENV", default="development").lower()
    DEBUG = APP_ENV == "development"
    APP_PORT = int(get_env_value("PORT", "APP_PORT", default="3010"))

    DB_SERVER = get_env_value("DB_SERVER", "SQL_SERVER", "DATABASE_HOST", "ODBC_SERVER", default="EMEBIDWH")
    DB_DATABASE = get_env_value("DB_DATABASE", "SQL_DATABASE", "DATABASE_NAME", default="Digitalizacion")
    DB_USER = get_env_value("DB_USER", "SQL_USER", "DATABASE_USER", default="sa")
    DB_PASSWORD = get_env_value("DB_PASSWORD", "SQL_PASSWORD", "DATABASE_PASSWORD", default="")
    DB_DRIVER = get_env_value("DB_DRIVER", "SQL_DRIVER", "ODBC_DRIVER", default="ODBC Driver 18 for SQL Server")

    SESSION_COOKIE_NAME = get_env_value("SESSION_COOKIE_NAME", default="ofertas_session")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = get_env_value("SESSION_COOKIE_SECURE", default="false").lower() == "true"
    SESSION_TYPE = "filesystem"
    SESSION_FILE_DIR = os.path.join(PROJECT_DIR, ".flask_session")
    SESSION_FILE_THRESHOLD = 500
    SESSION_USE_SIGNER = True
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)


app = Flask(
    __name__,
    template_folder=os.path.join(PROJECT_DIR, "templates"),
    static_folder=os.path.join(PROJECT_DIR, "static"),
)
app.config.from_object(Config)
app.secret_key = app.config["SECRET_KEY"]
CORS(app, supports_credentials=True)
os.makedirs(app.config["SESSION_FILE_DIR"], exist_ok=True)
Session(app)


class DuplicateOfertaError(ValueError):
    pass


def get_configured_oauth_redirect_uri():
    redirect_uri = get_env_value("OAUTH_REDIRECT_URI", "AZURE_REDIRECT_URI", "MICROSOFT_REDIRECT_URI", "OUTLOOK_REDIRECT_URI", default="")
    if not redirect_uri:
        return None
    parsed = urlparse(redirect_uri)
    if not parsed.scheme or not parsed.hostname:
        return None
    return parsed


def is_local_or_private_host(hostname):
    normalized = (hostname or "").strip().lower()
    if not normalized:
        return False
    if normalized in {"localhost", "127.0.0.1"}:
        return True

    try:
        parsed_ip = ipaddress.ip_address(normalized)
    except ValueError:
        return False

    return parsed_ip.is_loopback or parsed_ip.is_private


def get_request_oauth_redirect_uri():
    configured_redirect = get_configured_oauth_redirect_uri()
    if configured_redirect is None:
        return None

    if app.config.get("APP_ENV") == "production":
        return configured_redirect.geturl()

    current_host = (request.host.split(":", 1)[0] or "").strip().lower()
    configured_host = (configured_redirect.hostname or "").strip().lower()
    if not current_host:
        return configured_redirect.geturl()

    if not (is_local_or_private_host(current_host) and is_local_or_private_host(configured_host)):
        return configured_redirect.geturl()

    target_scheme = configured_redirect.scheme or request.scheme
    target_port = request.host.split(":", 1)[1].strip() if ":" in request.host else None
    if not target_port:
        configured_port = configured_redirect.port
        target_port = str(configured_port or (443 if target_scheme == "https" else 80))

    host_port = current_host
    if not ((target_scheme == "https" and target_port == "443") or (target_scheme == "http" and target_port == "80")):
        host_port = f"{host_port}:{target_port}"

    return f"{target_scheme}://{host_port}{configured_redirect.path}"


@app.before_request
def normalize_local_oauth_host():
    if request.method not in {"GET", "HEAD"}:
        return None

    if app.config.get("APP_ENV") == "production":
        return None

    configured_redirect = get_configured_oauth_redirect_uri()
    if not configured_redirect or not request.host:
        return None

    current_host = (request.host.split(":", 1)[0] or "").strip().lower()
    configured_host = (configured_redirect.hostname or "").strip().lower()
    local_aliases = {"127.0.0.1", "localhost"}

    if current_host == configured_host or {current_host, configured_host} - local_aliases:
        return None

    target_scheme = configured_redirect.scheme or request.scheme
    target_port = configured_redirect.port or (443 if target_scheme == "https" else 80)
    host_port = configured_host
    if not ((target_scheme == "https" and target_port == 443) or (target_scheme == "http" and target_port == 80)):
        host_port = f"{configured_host}:{target_port}"

    query_string = request.query_string.decode("utf-8") if request.query_string else ""
    target_url = f"{target_scheme}://{host_port}{request.path}"
    if query_string:
        target_url = f"{target_url}?{query_string}"
    return redirect(target_url, code=302)


READ_ONLY_OPERARIO_NUMBERS = {4}
GENERAL_USER_MICROSOFT_IDENTITY_COLUMNS = ("Email", "Correo", "Mail", "UPN", "Usuario", "Login")


@contextmanager
def db_connection(autocommit=False):
    conn = None
    last_error = None
    drivers_to_try = []

    if not app.config.get("DB_SERVER"):
        raise RuntimeError("Falta configurar DB_SERVER/SQL_SERVER en el archivo .env")

    if not app.config.get("DB_DATABASE"):
        raise RuntimeError("Falta configurar DB_DATABASE/SQL_DATABASE en el archivo .env")

    if not app.config.get("DB_USER"):
        raise RuntimeError("Falta configurar DB_USER/SQL_USER en el archivo .env")

    if not app.config.get("DB_PASSWORD"):
        raise RuntimeError("Falta configurar DB_PASSWORD/SQL_PASSWORD en el archivo .env")

    preferred_driver = app.config.get("DB_DRIVER")
    if preferred_driver:
        drivers_to_try.append(preferred_driver)

    for fallback_driver in ("ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server"):
        if fallback_driver not in drivers_to_try:
            drivers_to_try.append(fallback_driver)

    for driver in drivers_to_try:
        try:
            conn_str = (
                f"DRIVER={{{driver}}};"
                f"SERVER={app.config['DB_SERVER']};"
                f"DATABASE={app.config['DB_DATABASE']};"
                f"UID={app.config['DB_USER']};"
                f"PWD={app.config['DB_PASSWORD']};"
                "Encrypt=yes;"
                "TrustServerCertificate=yes;"
            )
            conn = pyodbc.connect(conn_str, timeout=8, autocommit=autocommit)
            break
        except Exception as exc:
            last_error = exc
            conn = None

    if conn is None:
        raise last_error or RuntimeError("No se pudo abrir la conexión ODBC")

    try:
        yield conn
    finally:
        conn.close()


def verify_password(password, hashed_password):
    if not hashed_password:
        return False

    try:
        if hashed_password.startswith("scrypt:") or hashed_password.startswith("pbkdf2:"):
            return check_password_hash(hashed_password, password)

        if hashed_password.startswith("sha256$"):
            parts = hashed_password.split("$")
            if len(parts) == 3:
                salt = parts[1]
                stored_hash = parts[2]
                calc = hashlib.sha256((password + salt).encode("utf-8")).hexdigest()
                return calc == stored_hash

        return password == hashed_password
    except Exception:
        return False


def get_logged_user_data():
    return session.get("user_data") or {}


def get_user_config(cursor, num_operario, fallback_role=None):
    cursor.execute(
        """
        SELECT TOP 1
            uc.email,
            uc.id_rol,
            r.nombre_rol,
            uc.id_departamento,
            d.nombre_departamento,
            d.descripcion,
            d.estado_activo
        FROM ofertas.usuarios_config uc
        LEFT JOIN ofertas.roles r
            ON r.id_rol = uc.id_rol
        LEFT JOIN ofertas.departamentos d
            ON d.id_departamento = uc.id_departamento
        WHERE uc.num_operario = ?
        """,
        (num_operario,),
    )
    row = cursor.fetchone()

    fallback_role_id = None
    fallback_role_name = normalize_optional_text(fallback_role, 100)
    if fallback_role is not None:
        try:
            fallback_role_id = int(fallback_role)
        except (TypeError, ValueError):
            fallback_role_id = None

        if fallback_role_id is not None:
            cursor.execute(
                "SELECT TOP 1 nombre_rol FROM ofertas.roles WHERE id_rol = ?",
                (fallback_role_id,),
            )
            fallback_role_row = cursor.fetchone()
            if fallback_role_row:
                fallback_role_name = fallback_role_row[0]
        elif fallback_role_name:
            cursor.execute(
                "SELECT TOP 1 id_rol, nombre_rol FROM ofertas.roles WHERE LOWER(LTRIM(RTRIM(nombre_rol))) = LOWER(LTRIM(RTRIM(?)))",
                (fallback_role_name,),
            )
            fallback_role_row = cursor.fetchone()
            if fallback_role_row:
                fallback_role_id = fallback_role_row[0]
                fallback_role_name = fallback_role_row[1]

    if row:
        department = None
        if row[3] is not None:
            department = {
                "id_departamento": row[3],
                "nombre_departamento": row[4],
                "descripcion": row[5],
                "estado_activo": bool(row[6]) if row[6] is not None else True,
            }
        return {
            "email": row[0],
            "id_rol": row[1] or fallback_role_id,
            "nombre_rol": row[2] or fallback_role_name or "Estandar",
            "departamento": department,
        }

    if fallback_role_name or fallback_role_id is not None:
        return {"email": None, "id_rol": fallback_role_id, "nombre_rol": fallback_role_name or "Estandar", "departamento": None}

    return {"email": None, "id_rol": None, "nombre_rol": "Estandar", "departamento": None}


def get_role_permission_level(role_name):
    normalized_role = str(role_name or "").strip().lower()
    if normalized_role == "manager":
        return 2
    return 1


def get_role_id_by_name(cursor, role_name):
    cursor.execute(
        """
        SELECT TOP 1 id_rol
        FROM ofertas.roles
        WHERE LOWER(LTRIM(RTRIM(nombre_rol))) = LOWER(LTRIM(RTRIM(?)))
        """,
        (role_name,),
    )
    row = cursor.fetchone()
    return row[0] if row else None


def get_outlook_automation_session_store():
    config = OutlookGraphService.get_config()
    if config.get("auth_mode") == "app-only":
        return None
    return session


def build_estado_manager_notification(cursor, oferta_id, estado_id):
    cursor.execute(
        """
        SELECT
            e.descripcion_estado,
            e.id_departamento,
            d.nombre_departamento
        FROM ofertas.estados e
        LEFT JOIN ofertas.departamentos d
            ON d.id_departamento = e.id_departamento
        WHERE e.id_estado = ?
        """,
        (estado_id,),
    )
    estado_row = cursor.fetchone()

    if not estado_row:
        return {"skipped": True, "message": "Estado no encontrado"}

    estado_nombre = normalize_optional_text(estado_row[0], 255) or f"#{estado_id}"
    id_departamento = estado_row[1]
    departamento_nombre = normalize_optional_text(estado_row[2], 255)

    if id_departamento is None:
        return {
            "skipped": True,
            "message": "El estado no tiene un departamento asociado",
            "estado": estado_nombre,
        }

    cursor.execute(
        """
        SELECT DISTINCT LOWER(LTRIM(RTRIM(uc.email)))
        FROM ofertas.usuarios_config uc
        LEFT JOIN ofertas.roles r
            ON r.id_rol = uc.id_rol
        WHERE uc.id_departamento = ?
          AND uc.email IS NOT NULL
          AND LTRIM(RTRIM(uc.email)) <> ''
          AND (
              uc.id_rol = 1
              OR LOWER(LTRIM(RTRIM(ISNULL(r.nombre_rol, '')))) = 'manager'
          )
        """,
        (id_departamento,),
    )
    recipient_rows = cursor.fetchall()
    recipients = [row[0] for row in recipient_rows if row and row[0]]

    if not recipients:
        return {
            "skipped": True,
            "message": "No hay managers con email configurado en el departamento del estado",
            "estado": estado_nombre,
            "departamento": departamento_nombre,
        }

    cursor.execute(
        """
        SELECT
            lo.numero_oferta,
            lo.ref_cliente_asunto_email,
            c.descripcion_cliente,
            lo.nombre_emisor,
            lo.email_emisor
        FROM ofertas.listado_ofertas lo
        LEFT JOIN ofertas.clientes c
            ON c.id_cliente = lo.id_cliente
        WHERE lo.id_oferta = ?
        """,
        (oferta_id,),
    )
    oferta_row = cursor.fetchone()

    numero_oferta = normalize_optional_text(oferta_row[0], 100) if oferta_row else None
    referencia = normalize_optional_text(oferta_row[1], 500) if oferta_row else None
    cliente = normalize_optional_text(oferta_row[2], 255) if oferta_row else None
    emisor = format_sender_display(oferta_row[3], oferta_row[4]) if oferta_row else None

    oferta_label = numero_oferta or f"ID {oferta_id}"
    subject = f"Oferta {oferta_label} en estado {estado_nombre}"
    body = """<p>La oferta <strong>{oferta}</strong> ha llegado al estado <strong>{estado}</strong>.</p>
<p>Este estado está asociado al departamento <strong>{departamento}</strong>.</p>
<ul>
  <li><strong>Oferta:</strong> {oferta}</li>
  <li><strong>Estado:</strong> {estado}</li>
  <li><strong>Departamento:</strong> {departamento}</li>
  <li><strong>Cliente:</strong> {cliente}</li>
  <li><strong>Referencia / asunto:</strong> {referencia}</li>
  <li><strong>Emisor:</strong> {emisor}</li>
</ul>""".format(
        oferta=html_escape(oferta_label),
        estado=html_escape(estado_nombre),
        departamento=html_escape(departamento_nombre or "Sin departamento"),
        cliente=html_escape(cliente or "Sin cliente"),
        referencia=html_escape(referencia or "Sin referencia"),
        emisor=html_escape(emisor or "Sin emisor"),
    )

    return {
        "skipped": False,
        "oferta_id": oferta_id,
        "to_recipients": recipients,
        "subject": subject,
        "body": body,
        "estado": estado_nombre,
        "departamento": departamento_nombre,
    }


def send_estado_manager_notification(notification_payload):
    if not notification_payload:
        return {"success": False, "sent": False, "message": "No se ha generado la notificación"}

    if notification_payload.get("skipped"):
        return {
            "success": True,
            "sent": False,
            "skipped": True,
            "message": notification_payload.get("message"),
            "estado": notification_payload.get("estado"),
            "departamento": notification_payload.get("departamento"),
            "recipients": [],
        }

    try:
        result = OutlookGraphService.send_mail(
            get_outlook_automation_session_store(),
            subject=notification_payload["subject"],
            body=notification_payload["body"],
            to_recipients=notification_payload["to_recipients"],
            is_html=True,
            save_to_sent_items=True,
        )
        return {
            "success": True,
            "sent": True,
            "message": "Aviso enviado a los managers del departamento",
            "estado": notification_payload.get("estado"),
            "departamento": notification_payload.get("departamento"),
            "recipients": notification_payload.get("to_recipients") or [],
            "account": result.get("account"),
        }
    except Exception as exc:
        app.logger.exception(
            "No se pudo enviar la notificación automática para la oferta %s al estado %s",
            notification_payload.get("oferta_id"),
            notification_payload.get("estado"),
        )
        return {
            "success": False,
            "sent": False,
            "message": str(exc),
            "estado": notification_payload.get("estado"),
            "departamento": notification_payload.get("departamento"),
            "recipients": notification_payload.get("to_recipients") or [],
        }


def usuario_exists(cursor, num_operario):
    cursor.execute(
        """
        SELECT TOP 1 1
        FROM general.usuarios
        WHERE num_operario = ?
        """,
        (num_operario,),
    )
    return cursor.fetchone() is not None


def get_general_user(cursor, num_operario):
    cursor.execute(
        """
        SELECT TOP 1 id_usuario, num_operario, nombre, nivel_permisos, roles
        FROM general.usuarios
        WHERE num_operario = ?
        """,
        (num_operario,),
    )
    row = cursor.fetchone()
    if row is None:
        return None

    return {
        "id_usuario": row[0],
        "num_operario": row[1],
        "nombre": row[2],
        "nivel_permisos": row[3],
        "rol": row[4],
    }


def get_general_user_column_names(cursor):
    column_names = set()
    try:
        for row in cursor.columns(table="usuarios", schema="general"):
            raw_name = getattr(row, "column_name", None)
            if raw_name is None and len(row) > 3:
                raw_name = row[3]
            normalized = normalize_optional_text(raw_name, 128)
            if normalized:
                column_names.add(normalized.lower())
    except Exception:
        return set()
    return column_names


def get_general_user_by_column_value(cursor, column_name, value):
    normalized_value = normalize_optional_text(value, 255)
    if not normalized_value:
        return None

    cursor.execute(
        f"""
        SELECT TOP 1 id_usuario, num_operario, nombre, nivel_permisos, roles
        FROM general.usuarios
        WHERE LOWER(LTRIM(RTRIM([{column_name}]))) = LOWER(LTRIM(RTRIM(?)))
        """,
        (normalized_value,),
    )
    row = cursor.fetchone()
    if row is None:
        return None

    return {
        "id_usuario": row[0],
        "num_operario": row[1],
        "nombre": row[2],
        "nivel_permisos": row[3],
        "rol": row[4],
    }


def build_authenticated_user_data(cursor, general_user):
    num_operario = general_user["num_operario"]
    user_config = get_user_config(cursor, num_operario, fallback_role=general_user.get("rol"))
    departamentos = [user_config["departamento"]] if user_config["departamento"] else []
    return {
        "id": general_user["id_usuario"],
        "num_operario": num_operario,
        "usuario": num_operario,
        "nombre": general_user["nombre"],
        "nivel": general_user["nivel_permisos"],
        "nivel_permisos": general_user["nivel_permisos"],
        "id_rol": user_config["id_rol"],
        "rol": user_config["nombre_rol"],
        "read_only": int(num_operario) in READ_ONLY_OPERARIO_NUMBERS,
        "departamentos": departamentos,
        "success": True,
    }


def persist_authenticated_user(user_data):
    session["user_id"] = user_data["id"]
    session["user_data"] = user_data
    session.permanent = True


def refresh_authenticated_session_user():
    current_user = get_logged_user_data()
    if not current_user:
        return None

    num_operario = current_user.get("num_operario")
    if num_operario is None:
        return current_user

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            general_user = get_general_user(cursor, num_operario)
            if general_user is None:
                session.pop("user_data", None)
                session.pop("user_id", None)
                return None

            refreshed_user = build_authenticated_user_data(cursor, general_user)
            refreshed_user["read_only"] = is_read_only_user(refreshed_user)
            persist_authenticated_user(refreshed_user)
            return refreshed_user
    except Exception:
        current_user["read_only"] = is_read_only_user(current_user)
        session["user_data"] = current_user
        return current_user


def resolve_general_user_from_microsoft_profile(cursor, profile):
    employee_id = normalize_optional_text(profile.get("employee_id"), 50)
    if employee_id:
        try:
            user_by_employee_id = get_general_user(cursor, int(employee_id))
            if user_by_employee_id:
                return user_by_employee_id
        except (TypeError, ValueError):
            pass

    identity_values = []
    seen_values = set()
    for raw_value in (
        profile.get("mail"),
        profile.get("user_principal_name"),
        (profile.get("account") or {}).get("username"),
    ):
        normalized = normalize_optional_text(raw_value, 255)
        if normalized and normalized.lower() not in seen_values:
            identity_values.append(normalized)
            seen_values.add(normalized.lower())
            if "@" in normalized:
                alias = normalize_optional_text(normalized.split("@", 1)[0], 120)
                if alias and alias.lower() not in seen_values:
                    identity_values.append(alias)
                    seen_values.add(alias.lower())

    available_columns = get_general_user_column_names(cursor)
    for column_name in GENERAL_USER_MICROSOFT_IDENTITY_COLUMNS:
        if column_name.lower() not in available_columns:
            continue
        for value in identity_values:
            match = get_general_user_by_column_value(cursor, column_name, value)
            if match:
                return match

    return None


def is_read_only_user(user_data=None):
    current_user = user_data or get_logged_user_data()
    if not current_user:
        return False

    if current_user.get("read_only") is True:
        return True

    try:
        return int(current_user.get("num_operario")) in READ_ONLY_OPERARIO_NUMBERS
    except (TypeError, ValueError):
        return False


def read_only_response():
    return jsonify(
        {
            "success": False,
            "read_only": True,
            "message": "Usuario en modo solo lectura. No puede crear, editar, eliminar ni guardar cambios.",
        }
    ), 403


def is_manager_user(user_data=None):
    current_user = user_data or get_logged_user_data()
    if not current_user:
        return False

    try:
        if int(current_user.get("id_rol")) == 1:
            return True
    except (TypeError, ValueError):
        pass

    return str(current_user.get("rol") or current_user.get("nombre_rol") or "").strip().lower() == "manager"


def manager_only_response():
    return jsonify(
        {
            "success": False,
            "manager_only": True,
            "message": "Solo los usuarios con rol Manager pueden añadir o editar usuarios.",
        }
    ), 403


def normalize_optional_text(value, max_length=None):
    text = str(value or "").strip()
    if not text:
        return None
    if max_length is not None:
        return text[:max_length]
    return text


def normalize_optional_email(value, field_name="Email"):
    email = normalize_optional_text(value, 255)
    if email is None:
        return None
    if "@" not in email:
        raise ValueError(f"El campo {field_name} debe contener un email válido")
    return email.lower()


def normalize_required_text(value, field_name, max_length=None):
    text = normalize_optional_text(value, max_length=max_length)
    if text is None:
        raise ValueError(f"El campo {field_name} es obligatorio")
    return text


def normalize_required_int(value, field_name):
    if value in (None, ""):
        raise ValueError(f"El campo {field_name} es obligatorio")

    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"El campo {field_name} debe ser numérico") from exc


def normalize_optional_int(value, field_name):
    if value in (None, ""):
        return None

    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"El campo {field_name} debe ser numérico") from exc


def normalize_optional_date(value, field_name):
    raw_value = str(value or "").strip()
    if not raw_value:
        return None

    try:
        return datetime.strptime(raw_value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"El campo {field_name} debe tener formato YYYY-MM-DD") from exc


def normalize_required_date(value, field_name):
    parsed_date = normalize_optional_date(value, field_name)
    if parsed_date is None:
        raise ValueError(f"El campo {field_name} es obligatorio")
    return parsed_date


def normalize_optional_decimal(value, field_name):
    if value in (None, ""):
        return None

    raw_value = str(value).strip().replace(",", ".")
    if not raw_value:
        return None

    try:
        return Decimal(raw_value)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"El campo {field_name} debe ser decimal") from exc


def normalize_optional_bool(value, field_name):
    if value in (None, ""):
        return None

    if isinstance(value, bool):
        return value

    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "t", "si", "sí", "s", "yes", "y"}:
        return True
    if normalized in {"0", "false", "f", "no", "n"}:
        return False

    raise ValueError(f"El campo {field_name} debe ser booleano")


def normalize_etc_priority(value):
    normalized = normalize_optional_text(value, 20)
    if normalized is None:
        return "NORMAL"

    priority = normalized.upper()
    valid_priorities = {"BAJA", "NORMAL", "ALTA", "CRITICA"}
    if priority not in valid_priorities:
        raise ValueError("El campo prioridad debe ser BAJA, NORMAL, ALTA o CRITICA")
    return priority


class HtmlToTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {"br", "p", "div", "li", "tr", "table"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"p", "div", "li", "tr", "table"}:
            self.parts.append("\n")

    def handle_data(self, data):
        if data:
            self.parts.append(data)

    def get_text(self):
        return "".join(self.parts)


def html_to_text(value):
    if not value:
        return ""

    parser = HtmlToTextParser()
    parser.feed(value)
    return unescape(parser.get_text())


def normalize_email_datetime(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    try:
        return parsedate_to_datetime(str(value))
    except (TypeError, ValueError, IndexError, OverflowError):
        return None


def decode_email_header(value):
    raw_value = str(value or "").strip()
    if not raw_value:
        return None

    try:
        decoded_value = str(make_header(decode_header(raw_value))).strip()
    except Exception:
        decoded_value = raw_value

    return decoded_value or None


def format_sender_display(sender_name=None, sender_email=None):
    normalized_name = normalize_optional_text(sender_name, 255)
    normalized_email = normalize_optional_text(sender_email, 255)
    if normalized_email:
        normalized_email = normalized_email.lower()

    if normalized_name and normalized_email:
        return f"{normalized_name} <{normalized_email}>"
    return normalized_email or normalized_name


def extract_sender_identity(value, fallback_email=None):
    raw_value = str(value or "").strip()
    parsed_name, parsed_email = parseaddr(raw_value)

    sender_name = decode_email_header(parsed_name)
    sender_email = normalize_optional_text(parsed_email or fallback_email, 255)
    if sender_email:
        sender_email = sender_email.lower()

    if sender_name is None and raw_value and raw_value != sender_email and "@" not in raw_value:
        sender_name = decode_email_header(raw_value)

    if sender_name and sender_email and sender_name.strip().lower() == sender_email.strip().lower():
        sender_name = None

    return {
        "sender_name": sender_name,
        "sender_email": sender_email,
        "sender_display": format_sender_display(sender_name, sender_email),
    }


def extract_sender_email(value):
    return extract_sender_identity(value).get("sender_email")


def extract_sender_domain(value):
    sender_email = extract_sender_email(value)
    if not sender_email or "@" not in sender_email:
        return sender_email, None

    raw_domain = sender_email.split("@", 1)[1].strip().lower().strip(".")
    if raw_domain.startswith("www."):
        raw_domain = raw_domain[4:]

    return sender_email, raw_domain or None


def get_domain_root(domain):
    normalized = str(domain or "").strip().lower()
    if not normalized:
        return None

    labels = [label for label in normalized.split(".") if label]
    if not labels:
        return None

    compound_suffixes = {
        ("co", "uk"),
        ("com", "es"),
        ("com", "mx"),
        ("com", "ar"),
        ("com", "br"),
        ("com", "co"),
        ("co", "jp"),
    }

    if len(labels) >= 3 and tuple(labels[-2:]) in compound_suffixes:
        return labels[-3]
    if len(labels) >= 2:
        return labels[-2]
    return labels[0]


def normalize_identifier(value):
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


def normalize_cliente_domain(value):
    normalized = normalize_optional_text(value, 255)
    if normalized is None:
        return None

    normalized = normalized.strip().lower()
    if "@" in normalized:
        normalized = normalized.split("@", 1)[1]

    normalized = normalized.strip(".")
    if normalized.startswith("www."):
        normalized = normalized[4:]

    if not normalized:
        return None

    if not re.fullmatch(r"[a-z0-9.-]+", normalized) or "." not in normalized:
        raise ValueError("Dominio cliente no válido")

    return normalized


def resolve_cliente_from_email(cursor, sender_email):
    sender_email, raw_domain = extract_sender_domain(sender_email)
    if not sender_email:
        return None

    domain_root = normalize_identifier(get_domain_root(raw_domain)) if raw_domain else None
    if not raw_domain:
        return {"sender_email": sender_email, "domain": None, "domain_root": domain_root, "cliente": None}

    try:
        domain = normalize_cliente_domain(raw_domain)
    except ValueError:
        return {
            "sender_email": sender_email,
            "domain": raw_domain,
            "domain_root": domain_root,
            "cliente": None,
        }

    domain_labels = [label for label in domain.split(".") if label]
    candidate_domains = [".".join(domain_labels[index:]) for index in range(len(domain_labels) - 1)] or [domain]
    placeholders = ", ".join("?" for _ in candidate_domains)

    cursor.execute(
        f"""
        SELECT id_cliente, descripcion_cliente, dominio
        FROM ofertas.clientes
        WHERE LOWER(LTRIM(RTRIM(ISNULL(dominio, '')))) IN ({placeholders})
        ORDER BY CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(dominio, '')))) = ? THEN 0 ELSE 1 END,
                 LEN(LTRIM(RTRIM(ISNULL(dominio, '')))) DESC,
                 descripcion_cliente ASC
        """,
        tuple(candidate_domains + [domain]),
    )
    row = cursor.fetchone()

    best_match = None
    if row is not None:
        best_match = {
            "id_cliente": row[0],
            "descripcion_cliente": row[1],
            "dominio": row[2],
        }

    return {
        "sender_email": sender_email,
        "domain": domain,
        "domain_root": domain_root,
        "cliente": best_match,
    }


def clean_email_body(body_text):
    normalized = str(body_text or "").replace("\r\n", "\n").replace("\r", "\n")
    lines = normalized.split("\n")

    header_regex = re.compile(r"^(from|de|sent|enviado|to|para|cc|subject|asunto)\s*:", re.IGNORECASE)
    original_message_regex = re.compile(r"^(-----\s*original message\s*-----|_{5,})$", re.IGNORECASE)
    mobile_signatures = {
        "sent from my iphone",
        "sent from my ipad",
        "enviado desde mi iphone",
        "enviado desde mi ipad",
        "obtener outlook para android",
    }
    signature_markers = (
        "--",
        "__",
        "saludos",
        "un saludo",
        "atentamente",
        "best regards",
        "kind regards",
        "muchas gracias",
        "gracias",
    )

    cleaned_lines = []
    signature_name = None

    for index, line in enumerate(lines):
        stripped = line.strip()
        lowered = stripped.lower()

        if not stripped:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue

        if stripped.startswith(">") or header_regex.match(stripped):
            continue

        if original_message_regex.match(stripped):
            break

        if lowered in mobile_signatures:
            break

        if any(lowered == marker or lowered.startswith(f"{marker},") for marker in signature_markers):
            for candidate in lines[index + 1:index + 4]:
                candidate = candidate.strip()
                if not candidate:
                    continue
                if len(candidate) <= 60 and "@" not in candidate and not re.search(r"\d{3,}", candidate):
                    signature_name = candidate
                break
            break

        cleaned_lines.append(stripped)

    while cleaned_lines and cleaned_lines[-1] == "":
        cleaned_lines.pop()

    cleaned_text = "\n".join(cleaned_lines).strip()
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

    if signature_name and signature_name.lower() not in cleaned_text.lower():
        cleaned_text = f"{cleaned_text}\n\n{signature_name}".strip()

    return cleaned_text


def parse_eml_bytes(file_bytes):
    message = BytesParser(policy=policy.default).parsebytes(file_bytes)
    sender_identity = extract_sender_identity(message.get("from"))
    received_at = normalize_email_datetime(message.get("date"))
    subject = str(message.get("subject") or "").strip()

    body_part = None
    if message.is_multipart():
        body_part = message.get_body(preferencelist=("plain", "html"))

    if body_part is not None:
        body_text = body_part.get_content()
        if body_part.get_content_type() == "text/html":
            body_text = html_to_text(body_text)
    else:
        body_text = message.get_content()
        if message.get_content_type() == "text/html":
            body_text = html_to_text(body_text)

    return {
        "sender_name": sender_identity["sender_name"],
        "sender_email": sender_identity["sender_email"],
        "sender_display": sender_identity["sender_display"],
        "received_at": received_at,
        "subject": subject,
        "body": clean_email_body(body_text),
    }


def parse_msg_bytes(file_bytes):
    try:
        extract_msg = importlib.import_module("extract_msg")
    except ImportError as exc:
        raise RuntimeError("Falta la dependencia 'extract-msg' para importar correos .msg") from exc

    temp_path = None
    message = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".msg") as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        message = extract_msg.Message(temp_path)
        body_text = getattr(message, "body", None) or html_to_text(getattr(message, "htmlBody", None) or "")
        sender_identity = extract_sender_identity(
            getattr(message, "sender", None)
            or getattr(message, "header", ""),
            fallback_email=getattr(message, "sender_email", None),
        )

        return {
            "sender_name": sender_identity["sender_name"],
            "sender_email": sender_identity["sender_email"],
            "sender_display": sender_identity["sender_display"],
            "received_at": normalize_email_datetime(getattr(message, "date", None)),
            "subject": str(getattr(message, "subject", "") or "").strip(),
            "body": clean_email_body(body_text),
        }
    finally:
        close_message = getattr(message, "close", None)
        if callable(close_message):
            try:
                close_message()
            except Exception:
                app.logger.warning("No se pudo cerrar el mensaje .msg temporal", exc_info=True)

        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except PermissionError:
                app.logger.warning("No se pudo borrar el archivo temporal del correo .msg: %s", temp_path, exc_info=True)


def parse_uploaded_email(file_storage):
    filename = str(getattr(file_storage, "filename", "") or "")
    extension = os.path.splitext(filename)[1].lower()
    file_bytes = file_storage.read()

    if not file_bytes:
        raise ValueError("El archivo de correo está vacío")

    if extension == ".eml":
        return parse_eml_bytes(file_bytes)
    if extension == ".msg":
        return parse_msg_bytes(file_bytes)

    raise ValueError("Formato de correo no soportado. Usa un archivo .eml o .msg")


def build_imported_email_response_data(parsed_email, cliente_resolution=None):
    matched_cliente = (cliente_resolution or {}).get("cliente")
    fecha_email = parsed_email.get("received_at")
    fecha_alta = datetime.now().date()

    return {
        "id_cliente": matched_cliente["id_cliente"] if matched_cliente else None,
        "cliente": matched_cliente["descripcion_cliente"] if matched_cliente else None,
        "nombre_emisor": parsed_email.get("sender_name"),
        "sender_email": parsed_email.get("sender_email"),
        "email_emisor": parsed_email.get("sender_email"),
        "emisor": parsed_email.get("sender_display"),
        "domain": (cliente_resolution or {}).get("domain"),
        "fecha_email": fecha_email.date().isoformat() if isinstance(fecha_email, datetime) else (fecha_email.isoformat() if fecha_email else None),
        "fecha_alta_oferta": fecha_alta.isoformat(),
        "ref_cliente_asunto_email": parsed_email.get("subject"),
        "observaciones": parsed_email.get("body"),
    }


def resolve_cliente_for_sender_email(sender_email):
    with db_connection(autocommit=True) as conn:
        cursor = conn.cursor()
        try:
            return resolve_cliente_from_email(cursor, sender_email)
        except Exception as exc:
            app.logger.exception("Error al resolver cliente desde correo: %s", exc)
            return {
                "sender_email": sender_email,
                "domain": None,
                "domain_root": None,
                "cliente": None,
            }


def normalize_outlook_message_for_offer(message):
    body_content = message.get("body_content") or message.get("body_preview") or ""
    body_type = str(message.get("body_content_type") or "text").strip().lower()
    body_text = html_to_text(body_content) if body_type == "html" else str(body_content)
    body_text = clean_email_body(body_text)

    sender_name = normalize_optional_text(message.get("sender_name"), 255)
    sender_email = normalize_optional_text(message.get("sender_email"), 255)
    if sender_email:
        sender_email = sender_email.lower()

    return {
        "sender_name": sender_name,
        "sender_email": sender_email,
        "sender_display": format_sender_display(sender_name, sender_email),
        "subject": normalize_optional_text(message.get("subject"), 500),
        "received_at": normalize_email_datetime(message.get("received_at")),
        "body": body_text,
    }


def build_oferta_payload(data):
    sender_identity = extract_sender_identity(
        data.get("emisor") or format_sender_display(data.get("nombre_emisor"), data.get("email_emisor")),
        fallback_email=data.get("email_emisor"),
    )

    if sender_identity["sender_name"] is None:
        sender_identity["sender_name"] = normalize_optional_text(data.get("nombre_emisor"), 255)

    if sender_identity["sender_email"] is None:
        raise ValueError("El campo Quién lo envía debe incluir un correo electrónico")

    sender_display = format_sender_display(sender_identity["sender_name"], sender_identity["sender_email"])

    return {
        "fecha_email": normalize_required_date(data.get("fecha_email"), "fecha_email"),
        "fecha_alta_oferta": normalize_optional_date(data.get("fecha_alta_oferta"), "fecha_alta_oferta"),
        "ref_cliente_asunto_email": normalize_optional_text(data.get("ref_cliente_asunto_email"), 500),
        "id_cliente": normalize_required_int(data.get("id_cliente") if data.get("id_cliente") is not None else data.get("cliente"), "Cliente"),
        "observaciones": normalize_optional_text(data.get("observaciones")),
        "nombre_emisor": sender_identity["sender_name"],
        "email_emisor": sender_identity["sender_email"],
        "emisor": sender_display,
    }


def build_oferta_update_payload(data):
    payload = build_oferta_payload(data)
    payload["id_estado"] = normalize_required_int(data.get("id_estado"), "Estado")
    return payload


def build_oferta_etc_payload(data):
    payload = {
        "fecha_recepcion": normalize_optional_date(data.get("fecha_recepcion"), "fecha_recepcion"),
        "fecha_envio_oferta": normalize_optional_date(data.get("fecha_envio_oferta"), "fecha_envio_oferta"),
        "fecha_limite_respuesta": normalize_optional_date(data.get("fecha_limite_respuesta"), "fecha_limite_respuesta"),
        "id_estado": normalize_optional_int(data.get("id_estado"), "Estado") or 1,
        "id_cliente": normalize_optional_int(data.get("id_cliente") if data.get("id_cliente") is not None else data.get("cliente"), "Cliente"),
        "num_operario_responsable": normalize_required_int(data.get("num_operario_responsable"), "Num_operario_responsable"),
        "id_departamento_destino": normalize_required_int(data.get("id_departamento_destino"), "id_departamento_destino"),
        "codigo_externo_oferta": normalize_required_text(data.get("codigo_externo_oferta"), "Código externo", 100),
        "codigo_interno_oferta": normalize_optional_text(data.get("codigo_interno_oferta"), 100),
        "referencia_cliente": normalize_required_text(data.get("referencia_cliente"), "Referencia cliente", 255),
        "numero_comision": normalize_optional_text(data.get("numero_comision"), 100),
        "po_original": normalize_optional_text(data.get("po_original"), 100),
        "pedido_b2b": normalize_optional_text(data.get("pedido_b2b"), 100),
        "proyecto": normalize_optional_text(data.get("proyecto"), 255),
        "nombre_solicitante": normalize_optional_text(data.get("nombre_solicitante"), 255),
        "email_solicitante": normalize_optional_text(data.get("email_solicitante"), 255),
        "empresa_solicitante": normalize_optional_text(data.get("empresa_solicitante"), 255),
        "incoterm": normalize_required_text(data.get("incoterm"), "incoterm", 10),
        "moneda": (normalize_optional_text(data.get("moneda"), 3) or "EUR").upper(),
        "prioridad": normalize_etc_priority(data.get("prioridad")),
        "es_urgente": normalize_optional_bool(data.get("es_urgente"), "es_urgente"),
        "resumen_material_solicitado": normalize_optional_text(data.get("resumen_material_solicitado")),
        "resumen_material_ofertado": normalize_optional_text(data.get("resumen_material_ofertado")),
        "total_material_eur": normalize_optional_decimal(data.get("total_material_eur"), "total_material_eur"),
        "total_fee_eur": normalize_optional_decimal(data.get("total_fee_eur"), "total_fee_eur"),
        "observaciones_cliente": normalize_optional_text(data.get("observaciones_cliente")),
        "observaciones_tecnicas": normalize_optional_text(data.get("observaciones_tecnicas")),
        "observaciones_internas": normalize_optional_text(data.get("observaciones_internas")),
        "origen_registro": (normalize_optional_text(data.get("origen_registro"), 20) or "MANUAL").upper(),
        "activo": normalize_optional_bool(data.get("activo"), "activo"),
    }

    if payload["es_urgente"] is None:
        payload["es_urgente"] = False
    if payload["activo"] is None:
        payload["activo"] = True

    identifying_values = (
        payload["codigo_externo_oferta"],
        payload["codigo_interno_oferta"],
        payload["referencia_cliente"],
        payload["numero_comision"],
        payload["proyecto"],
    )
    if not any(identifying_values):
        raise ValueError(
            "Debes indicar al menos un identificador para la oferta ETC: código externo, código interno, referencia de cliente, número de comisión o proyecto"
        )

    return payload


def build_oferta_estado_payload(data):
    return {
        "id_estado": normalize_required_int(data.get("id_estado"), "Estado siguiente"),
        "fecha_limite": normalize_optional_date(data.get("fecha_limite"), "Fecha límite"),
        "comentario": normalize_optional_text(data.get("comentario")),
    }


def build_cliente_payload(data):
    return {
        "descripcion_cliente": normalize_required_text(data.get("descripcion_cliente"), "Descripción cliente", 255),
        "dominio": normalize_cliente_domain(data.get("dominio")),
    }


def build_proyecto_payload(data):
    return {
        "descripcion_proyecto": normalize_required_text(data.get("descripcion_proyecto"), "Descripción proyecto", 255),
    }


def build_estado_payload(data):
    payload = {
        "descripcion_estado": normalize_required_text(data.get("descripcion_estado"), "Descripción estado", 255),
        "orden": normalize_optional_int(data.get("orden"), "orden"),
        "emoji_sidebar": normalize_optional_text(data.get("emoji_sidebar"), 8),
        "activo": normalize_optional_bool(data.get("activo"), "activo"),
    }

    if payload["activo"] is None:
        payload["activo"] = True

    return payload


def build_usuario_payload(data):
    role_id = normalize_optional_int(data.get("id_rol"), "id_rol")
    role_name = normalize_optional_text(data.get("rol") or data.get("nombre_rol"), 100)
    if role_id is None and role_name is None:
        raise ValueError("El campo Rol es obligatorio")

    return {
        "num_operario": normalize_required_int(data.get("num_operario"), "Num_operario"),
        "nombre": normalize_required_text(data.get("nombre"), "Nombre", 255),
        "email": normalize_optional_email(data.get("email"), "Email"),
        "id_rol": role_id,
        "rol": role_name,
        "id_departamento": normalize_optional_int(data.get("id_departamento"), "id_departamento"),
    }


def get_available_offer_columns():
    return [
        {"value": "id_oferta", "label": "ID oferta", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "estado", "label": "Estado", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "fecha_email", "label": "Fecha e-mail", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "fecha_alta_oferta", "label": "Fecha alta oferta", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "fecha_limite", "label": "Fecha límite", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "numero_oferta", "label": "Nº oferta", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "ref_cliente_asunto_email", "label": "Ref. cliente / asunto e-mail", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "cliente", "label": "Cliente", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "emisor", "label": "Emisor", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "observaciones_oferta", "label": "Observaciones oferta", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "tipo_interaccion", "label": "Tipos interacción", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "fecha_interaccion", "label": "Fechas interacción", "source": "ofertas.vw_listado_ofertas_interacciones"},
        {"value": "observaciones_interaccion", "label": "Observaciones interacción", "source": "ofertas.vw_listado_ofertas_interacciones"},
    ]


def get_available_offer_column_map():
    return {column["value"]: column for column in get_available_offer_columns()}


def normalize_offer_column_name(column_name):
    normalized = normalize_optional_text(column_name, 100)
    if normalized is None:
        return None

    legacy_map = {
        "id_oferta": "id_oferta",
        "id_estado": "estado",
        "Estado": "estado",
        "fecha_email": "fecha_email",
        "fecha_alta_oferta": "fecha_alta_oferta",
        "fecha_limite": "fecha_limite",
        "numero_oferta": "numero_oferta",
        "ref_cliente_asunto_email": "ref_cliente_asunto_email",
        "Cliente": "cliente",
        "Emisor": "emisor",
        "Observaciones": "observaciones_oferta",
        "Observaciones_oferta": "observaciones_oferta",
        "Oferta_Interacciones.Tipo_interaccion": "tipo_interaccion",
        "Tipo_interaccion": "tipo_interaccion",
        "Oferta_Interacciones.fecha_interaccion": "fecha_interaccion",
        "fecha_interaccion": "fecha_interaccion",
        "Oferta_Interacciones.Observaciones": "observaciones_interaccion",
        "Observaciones_interaccion": "observaciones_interaccion",
        "Concepto": None,
        "columna1": None,
        "id_cliente": None,
        "Oferta_Interacciones.id_interaccion": None,
    }

    return legacy_map.get(normalized, normalized.lower())


def build_configuracion_columna_payload(data):
    return {
        "columna": normalize_required_text(data.get("columna"), "columna", 100),
        "descripcion_columna": normalize_optional_text(data.get("descripcion_columna"), 255),
        "orden_columna": normalize_optional_int(data.get("orden_columna"), "orden columna"),
    }


def get_next_numero_oferta(cursor):
    current_year = datetime.now().year
    cursor.execute(
        """
        SELECT ISNULL(MAX(TRY_CONVERT(INT, RIGHT(numero_oferta, 5))), 0)
        FROM ofertas.listado_ofertas
        WHERE LEFT(ISNULL(numero_oferta, ''), 4) = ?
        """,
        (str(current_year),),
    )
    current_max = cursor.fetchone()[0] or 0
    return f"{current_year}{current_max + 1:05d}"


def serialize_date(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def serialize_decimal(value):
    if value is None:
        return None
    return float(value)


def materiales_precio_table_exists(cursor):
    cursor.execute("SELECT 1 WHERE OBJECT_ID('ofertas.materiales_precio', 'U') IS NOT NULL")
    return cursor.fetchone() is not None


def materiales_precio_has_fecha_creacion(cursor):
    cursor.execute("SELECT 1 WHERE COL_LENGTH('ofertas.materiales_precio', 'fecha_creacion') IS NOT NULL")
    return cursor.fetchone() is not None


def build_material_precio_payload(data):
    material = normalize_required_text(data.get("material"), "material", 255)
    precio = normalize_optional_decimal(data.get("precio"), "precio")

    if precio is None:
        raise ValueError("El campo precio es obligatorio")
    if precio < 0:
        raise ValueError("El campo precio no puede ser negativo")

    return {
        "material": material,
        "precio": precio.quantize(Decimal("0.01")),
    }


def list_materiales_precio_snapshot(cursor):
    cursor.execute(
        """
        WITH ranked_materiales AS (
            SELECT
                mp.id_material_precio,
                mp.material,
                mp.precio,
                mp.fecha_creacion,
                LOWER(LTRIM(RTRIM(mp.material))) AS material_key,
                ROW_NUMBER() OVER (
                    PARTITION BY LOWER(LTRIM(RTRIM(mp.material)))
                    ORDER BY mp.fecha_creacion DESC, mp.id_material_precio DESC
                ) AS rn
            FROM ofertas.materiales_precio mp
            WHERE mp.material IS NOT NULL
              AND LTRIM(RTRIM(mp.material)) <> ''
        )
        SELECT
            latest_row.id_material_precio,
            latest_row.material,
            latest_row.precio,
            latest_row.fecha_creacion,
            previous_row.precio AS precio_anterior,
            CASE
                WHEN previous_row.precio IS NULL THEN NULL
                ELSE latest_row.precio - previous_row.precio
            END AS diferencia_precio
        FROM ranked_materiales latest_row
        LEFT JOIN ranked_materiales previous_row
            ON previous_row.material_key = latest_row.material_key
           AND previous_row.rn = 2
        WHERE latest_row.rn = 1
        ORDER BY latest_row.material ASC
        """
    )

    materiales = []
    for row in cursor.fetchall():
        materiales.append(
            {
                "id_material_precio": row[0],
                "material": row[1],
                "precio": serialize_decimal(row[2]),
                "fecha_creacion": serialize_date(row[3]),
                "precio_anterior": serialize_decimal(row[4]),
                "diferencia_precio": serialize_decimal(row[5]),
            }
        )

    return materiales


def serialize_interaction_date_list(value):
    if value is None:
        return None
    return str(value)


def oferta_etc_table_exists(cursor):
    cursor.execute("SELECT 1 WHERE OBJECT_ID('ofertas.oferta_etc', 'U') IS NOT NULL")
    return cursor.fetchone() is not None


def oferta_email_subject_exists(cursor, fecha_email, ref_cliente_asunto_email, excluded_id=None):
    query = """
        SELECT TOP 1 id_oferta
        FROM ofertas.listado_ofertas
        WHERE fecha_email = ?
          AND LOWER(LTRIM(RTRIM(ISNULL(ref_cliente_asunto_email, '')))) = LOWER(LTRIM(RTRIM(ISNULL(?, ''))))
    """
    params = [fecha_email, ref_cliente_asunto_email]

    if excluded_id is not None:
        query += " AND id_oferta <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def cliente_exists(cursor, descripcion_cliente, excluded_id=None):
    query = """
        SELECT TOP 1 id_cliente
        FROM ofertas.clientes
        WHERE LTRIM(RTRIM(descripcion_cliente)) = LTRIM(RTRIM(?))
    """
    params = [descripcion_cliente]

    if excluded_id is not None:
        query += " AND id_cliente <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def cliente_domain_exists(cursor, dominio, excluded_id=None):
    if not dominio:
        return False

    query = """
        SELECT TOP 1 id_cliente
        FROM ofertas.clientes
        WHERE LOWER(LTRIM(RTRIM(ISNULL(dominio, '')))) = LOWER(LTRIM(RTRIM(?)))
    """
    params = [dominio]

    if excluded_id is not None:
        query += " AND id_cliente <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def proyecto_exists(cursor, descripcion_proyecto, excluded_id=None):
    query = """
        SELECT TOP 1 id_proyecto
        FROM ofertas.proyectos
        WHERE LTRIM(RTRIM(descripcion_proyecto)) = LTRIM(RTRIM(?))
    """
    params = [descripcion_proyecto]

    if excluded_id is not None:
        query += " AND id_proyecto <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def estado_exists(cursor, descripcion_estado, excluded_id=None):
    query = """
        SELECT TOP 1 id_estado
        FROM ofertas.estados
        WHERE LTRIM(RTRIM(descripcion_estado)) = LTRIM(RTRIM(?))
    """
    params = [descripcion_estado]

    if excluded_id is not None:
        query += " AND id_estado <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def get_estado_metadata(cursor, estado_id):
    cursor.execute(
        """
        SELECT id_estado, descripcion_estado, ISNULL(activo, 1) AS activo, emoji_sidebar
        FROM ofertas.estados
        WHERE id_estado = ?
        """,
        (estado_id,),
    )
    row = cursor.fetchone()
    if row is None:
        return None

    return {
        "id_estado": row[0],
        "descripcion_estado": row[1],
        "activo": bool(row[2]),
        "emoji_sidebar": row[3],
    }


def configuracion_columna_exists(cursor, id_estado, columna, excluded_id=None):
    normalized_target = normalize_offer_column_name(columna)
    cursor.execute(
        """
        SELECT id_config, columna
        FROM ofertas.configuracioncolumnas
        WHERE id_estado = ?
        """,
        (id_estado,),
    )

    for row in cursor.fetchall():
        config_id = row[0]
        existing_column = normalize_offer_column_name(row[1])
        if excluded_id is not None and config_id == excluded_id:
            continue
        if existing_column == normalized_target:
            return True
    return False


@app.route("/")
def index():
    template_path = os.path.join(PROJECT_DIR, "templates", "index.html")
    with open(template_path, encoding="utf-8") as template_file:
        return render_template_string(template_file.read())


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "success": True,
            "service": "OFERTAS",
            "port": app.config["APP_PORT"],
            "database": app.config["DB_DATABASE"],
            "db_password_configured": bool(app.config.get("DB_PASSWORD")),
        }
    )


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    usuario = (data.get("usuario") or "").strip()
    password = (data.get("password") or "").strip()

    if not usuario or not password:
        return jsonify({"success": False, "message": "Usuario y contraseña requeridos"}), 400

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id_usuario, num_operario, nombre, nivel_permisos, roles, contrasena
                FROM general.usuarios
                WHERE num_operario = ?
                """,
                (usuario,),
            )
            result = cursor.fetchone()

            if not result:
                return jsonify({"success": False, "message": "Usuario no encontrado"}), 401

            if not verify_password(password, result[5]):
                return jsonify({"success": False, "message": "Contraseña incorrecta"}), 401

            user_data = build_authenticated_user_data(
                cursor,
                {
                    "id_usuario": result[0],
                    "num_operario": result[1],
                    "nombre": result[2],
                    "nivel_permisos": result[3],
                    "rol": result[4],
                },
            )

            persist_authenticated_user(user_data)

            return jsonify(user_data)
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"Error del servidor: {str(exc)}"}), 500


@app.route("/api/logout", methods=["POST"])
def api_logout():
    try:
        session.clear()
        return jsonify({"success": True, "message": "Sesión cerrada exitosamente"})
    except Exception as exc:
        return jsonify({"success": False, "message": f"Error del servidor: {str(exc)}"}), 500


@app.route("/auth/logout", methods=["GET"])
def auth_logout():
    session.clear()
    return redirect("/")


def start_microsoft_login():
    session["microsoft_auth_context"] = "app"
    session["microsoft_post_auth_redirect"] = url_for("index")
    try:
        effective_redirect_uri = get_request_oauth_redirect_uri()
        print(
            f"[oauth] login env={app.config.get('APP_ENV')} "
            f"client_id={OutlookGraphService.get_config().get('client_id')} "
            f"tenant_id={OutlookGraphService.get_config().get('tenant_id')} "
            f"redirect_uri={effective_redirect_uri}",
            flush=True,
        )
        return redirect(
            OutlookGraphService.start_auth_flow(
                session,
                scopes=OutlookGraphService.get_login_scopes(),
                redirect_uri=effective_redirect_uri,
            )
        )
    except OutlookGraphError as exc:
        return redirect(url_for("index", auth_error=str(exc)))


@app.route("/auth/microsoft/login", methods=["GET"])
def auth_microsoft_login():
    return start_microsoft_login()


@app.route("/auth/login", methods=["GET"])
def auth_login():
    return start_microsoft_login()


@app.route("/auth/microsoft/callback", methods=["GET"])
def auth_microsoft_callback():
    return auth_outlook_callback()


@app.route("/auth/callback", methods=["GET"])
def auth_callback():
    return auth_outlook_callback()


@app.route("/api/me", methods=["GET"])
def api_me():
    user_data = refresh_authenticated_session_user()
    if not user_data:
        return jsonify({"success": False, "message": "No hay sesión activa"}), 401
    return jsonify({"success": True, "user": user_data})


@app.route("/api/session/check", methods=["GET"])
def api_session_check():
    user_data = refresh_authenticated_session_user()
    return jsonify({"success": bool(user_data), "authenticated": bool(user_data), "user": user_data or None})


@app.route("/api/outlook/status", methods=["GET"])
def api_outlook_status():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para usar Outlook"}), 401

    status = OutlookGraphService.get_status(session)
    account = status.get("account") or {}
    status["mailbox"] = account.get("username")
    status["login_url"] = url_for("auth_outlook_login")
    status["disconnect_url"] = url_for("api_outlook_disconnect")
    return jsonify({"success": True, **status})


@app.route("/auth/outlook/login", methods=["GET"])
def auth_outlook_login():
    user_data = get_logged_user_data()
    if not user_data:
        return redirect(url_for("index"))

    try:
        session["microsoft_auth_context"] = "outlook"
        session["outlook_post_auth_redirect"] = url_for("index", open_outlook=1)
        return redirect(OutlookGraphService.start_auth_flow(session, redirect_uri=get_request_oauth_redirect_uri()))
    except OutlookGraphError as exc:
        return redirect(url_for("index", outlook_error=str(exc)))


@app.route("/auth/outlook/callback", methods=["GET"])
def auth_outlook_callback():
    auth_context = session.pop("microsoft_auth_context", "outlook")
    user_data = get_logged_user_data()
    if auth_context != "app" and not user_data:
        return redirect(url_for("index"))

    redirect_target = (
        session.pop("microsoft_post_auth_redirect", None)
        if auth_context == "app"
        else session.pop("outlook_post_auth_redirect", None)
    ) or (url_for("index") if auth_context == "app" else url_for("index", open_outlook=1))

    try:
        auth_result = OutlookGraphService.complete_auth_flow(
            session,
            dict(request.args),
            require_access_token=(auth_context != "app"),
        )
        if auth_context == "app":
            with db_connection(autocommit=True) as conn:
                cursor = conn.cursor()
                profile = auth_result.get("profile") or {}
                general_user = resolve_general_user_from_microsoft_profile(cursor, profile)
                if not general_user:
                    OutlookGraphService.disconnect(session)
                    session.pop("user_id", None)
                    session.pop("user_data", None)
                    return redirect(url_for("index", auth_error="No se ha encontrado tu usuario en general.usuarios para esta cuenta de Microsoft."))

                persist_authenticated_user(build_authenticated_user_data(cursor, general_user))
                session["microsoft_profile"] = profile
        return redirect(redirect_target)
    except OutlookGraphError as exc:
        error_param = "auth_error" if auth_context == "app" else "outlook_error"
        return redirect(url_for("index", **{error_param: str(exc)}))
    except RuntimeError as exc:
        error_param = "auth_error" if auth_context == "app" else "outlook_error"
        return redirect(url_for("index", **{error_param: str(exc)}))


@app.route("/api/outlook/disconnect", methods=["POST"])
def api_outlook_disconnect():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para desconectar Outlook"}), 401

    OutlookGraphService.disconnect(session)
    return jsonify({"success": True, "message": "La cuenta de Outlook se ha desconectado correctamente."})


@app.route("/api/outlook/messages", methods=["GET"])
def api_outlook_messages():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar Outlook"}), 401

    folder = request.args.get("folder", "inbox")
    top = request.args.get("top", default=20, type=int)

    try:
        result = OutlookGraphService.list_messages(session, folder=folder, top=top)
        return jsonify({"success": True, **result})
    except OutlookGraphError as exc:
        return jsonify({"success": False, "message": str(exc)}), 409
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo consultar Outlook: {str(exc)}"}), 500


@app.route("/api/outlook/messages/<path:message_id>", methods=["GET"])
def api_outlook_message_detail(message_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar Outlook"}), 401

    try:
        message = OutlookGraphService.get_message(session, message_id)
        parsed_email = normalize_outlook_message_for_offer(message)
        cliente_resolution = resolve_cliente_for_sender_email(parsed_email.get("sender_email"))
        import_data = build_imported_email_response_data(parsed_email, cliente_resolution)
        return jsonify(
            {
                "success": True,
                "message": "Correo de Outlook cargado correctamente.",
                "mailbox": ((message.get("account") or {}).get("username")),
                "outlook_message": message,
                "import_data": import_data,
            }
        )
    except OutlookGraphError as exc:
        return jsonify({"success": False, "message": str(exc)}), 409
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo cargar el correo de Outlook: {str(exc)}"}), 500


@app.route("/api/outlook/send", methods=["POST"])
def api_outlook_send_mail():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para enviar correos"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    data = request.get_json(silent=True) or {}

    try:
        result = OutlookGraphService.send_mail(
            session,
            subject=data.get("subject"),
            body=data.get("body"),
            to_recipients=data.get("to_recipients"),
            cc_recipients=data.get("cc_recipients"),
            is_html=bool(data.get("is_html", True)),
            save_to_sent_items=bool(data.get("save_to_sent_items", True)),
        )
        return jsonify({"success": True, "message": "Correo enviado correctamente con Outlook.", **result})
    except OutlookGraphError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo enviar el correo: {str(exc)}"}), 500


@app.route("/api/ofertas/siguiente-numero", methods=["GET"])
def get_siguiente_numero_oferta():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar el siguiente número de oferta"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            siguiente_numero = get_next_numero_oferta(cursor)

        return jsonify({"success": True, "numero_oferta": siguiente_numero})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo consultar el siguiente número de oferta: {str(exc)}"}), 500


@app.route("/api/ofertas", methods=["GET"])
def list_ofertas():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar las ofertas"}), 401

    estado_id = request.args.get("estado_id", type=int)

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            query = """
                SELECT
                    vw.id_oferta,
                    lo.id_estado,
                    vw.numero_oferta,
                    vw.fecha_email,
                    vw.fecha_alta_oferta,
                    latest_interaction.fecha_limite,
                    vw.ref_cliente_asunto_email,
                    lo.id_cliente,
                    vw.cliente,
                    vw.emisor,
                    vw.observaciones_oferta,
                    STRING_AGG(ISNULL(vw.tipo_interaccion, ''), ' | ') AS tipos_interaccion,
                    STRING_AGG(CONVERT(VARCHAR(19), vw.fecha_interaccion, 120), ' | ') AS fechas_interaccion,
                    STRING_AGG(ISNULL(vw.observaciones_interaccion, ''), ' | ') AS observaciones_interaccion,
                    vw.estado
                FROM ofertas.vw_listado_ofertas_interacciones vw
                INNER JOIN ofertas.listado_ofertas lo
                    ON lo.id_oferta = vw.id_oferta
                OUTER APPLY (
                    SELECT TOP 1 oi.fecha_limite
                    FROM ofertas.oferta_interacciones oi
                    WHERE oi.id_oferta = lo.id_oferta
                    ORDER BY
                        CASE WHEN oi.fecha_interaccion IS NULL THEN 1 ELSE 0 END,
                        oi.fecha_interaccion DESC,
                        oi.id_interaccion DESC
                ) latest_interaction
            """
            params = []

            if estado_id is not None:
                query += " WHERE lo.id_estado = ?"
                params.append(estado_id)

            query += """
                GROUP BY
                    vw.id_oferta,
                    lo.id_estado,
                    vw.numero_oferta,
                    vw.fecha_email,
                    vw.fecha_alta_oferta,
                    latest_interaction.fecha_limite,
                    vw.ref_cliente_asunto_email,
                    lo.id_cliente,
                    vw.cliente,
                    vw.emisor,
                    vw.observaciones_oferta,
                    vw.estado
                ORDER BY vw.id_oferta DESC
            """
            cursor.execute(query, tuple(params))

            ofertas = [
                {
                    "id_oferta": row[0],
                    "id_estado": row[1],
                    "numero_oferta": row[2],
                    "fecha_email": serialize_date(row[3]),
                    "fecha_alta_oferta": serialize_date(row[4]),
                    "fecha_limite": serialize_date(row[5]),
                    "ref_cliente_asunto_email": row[6],
                    "id_cliente": row[7],
                    "cliente": row[8],
                    "emisor": row[9],
                    "observaciones": row[10],
                    "observaciones_oferta": row[10],
                    "interaction_types": row[11],
                    "interaction_dates": serialize_interaction_date_list(row[12]),
                    "interaction_observaciones": row[13],
                    "estado": row[14],
                    "id_oferta": row[0],
                    "numero_oferta": row[2],
                    "fecha_email": serialize_date(row[3]),
                    "fecha_alta_oferta": serialize_date(row[4]),
                    "fecha_limite": serialize_date(row[5]),
                    "ref_cliente_asunto_email": row[6],
                    "cliente": row[8],
                    "emisor": row[9],
                    "observaciones_oferta": row[10],
                    "tipo_interaccion": row[11],
                    "fecha_interaccion": serialize_interaction_date_list(row[12]),
                    "observaciones_interaccion": row[13],
                    "estado": row[14],
                }
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "ofertas": ofertas})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar las ofertas: {str(exc)}"}), 500


@app.route("/api/ofertas-etc", methods=["GET"])
def list_ofertas_etc():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar las ofertas ETC"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()

            if not oferta_etc_table_exists(cursor):
                return jsonify({"success": False, "message": "La tabla ofertas.oferta_etc no existe todavía"}), 404

            cursor.execute(
                """
                SELECT
                    o.id_oferta_etc,
                    o.fecha_recepcion,
                    o.fecha_envio_oferta,
                    o.fecha_limite_respuesta,
                    o.id_estado,
                    e.descripcion_estado,
                    o.id_cliente,
                    c.descripcion_cliente,
                    o.num_operario_responsable,
                    gu.nombre,
                    o.id_departamento_destino,
                    d.nombre_departamento,
                    o.codigo_externo_oferta,
                    o.codigo_interno_oferta,
                    o.referencia_cliente,
                    o.numero_comision,
                    o.po_original,
                    o.pedido_b2b,
                    o.proyecto,
                    o.nombre_solicitante,
                    o.email_solicitante,
                    o.empresa_solicitante,
                    o.incoterm,
                    o.moneda,
                    o.prioridad,
                    o.es_urgente,
                    o.resumen_material_solicitado,
                    o.resumen_material_ofertado,
                    o.total_material_eur,
                    o.total_fee_eur,
                    o.total_oferta_eur,
                    o.observaciones_cliente,
                    o.observaciones_tecnicas,
                    o.observaciones_internas,
                    o.origen_registro,
                    o.activo,
                    o.fecha_creacion,
                    o.fecha_actualizacion
                FROM ofertas.oferta_etc o
                LEFT JOIN ofertas.estados e
                    ON e.id_estado = o.id_estado
                LEFT JOIN ofertas.clientes c
                    ON c.id_cliente = o.id_cliente
                LEFT JOIN ofertas.departamentos d
                    ON d.id_departamento = o.id_departamento_destino
                LEFT JOIN general.usuarios gu
                    ON gu.num_operario = o.num_operario_responsable
                ORDER BY o.fecha_creacion DESC, o.id_oferta_etc DESC
                """
            )

            ofertas = [
                {
                    "id_oferta_etc": row[0],
                    "fecha_recepcion": serialize_date(row[1]),
                    "fecha_envio_oferta": serialize_date(row[2]),
                    "fecha_limite_respuesta": serialize_date(row[3]),
                    "id_estado": row[4],
                    "estado": row[5],
                    "id_cliente": row[6],
                    "cliente": row[7],
                    "num_operario_responsable": row[8],
                    "nombre_responsable": row[9],
                    "id_departamento_destino": row[10],
                    "nombre_departamento": row[11],
                    "codigo_externo_oferta": row[12],
                    "codigo_interno_oferta": row[13],
                    "referencia_cliente": row[14],
                    "numero_comision": row[15],
                    "po_original": row[16],
                    "pedido_b2b": row[17],
                    "proyecto": row[18],
                    "nombre_solicitante": row[19],
                    "email_solicitante": row[20],
                    "empresa_solicitante": row[21],
                    "incoterm": row[22],
                    "moneda": row[23],
                    "prioridad": row[24],
                    "es_urgente": bool(row[25]) if row[25] is not None else False,
                    "resumen_material_solicitado": row[26],
                    "resumen_material_ofertado": row[27],
                    "total_material_eur": serialize_decimal(row[28]),
                    "total_fee_eur": serialize_decimal(row[29]),
                    "total_oferta_eur": serialize_decimal(row[30]),
                    "observaciones_cliente": row[31],
                    "observaciones_tecnicas": row[32],
                    "observaciones_internas": row[33],
                    "origen_registro": row[34],
                    "activo": bool(row[35]) if row[35] is not None else True,
                    "fecha_creacion": serialize_date(row[36]),
                    "fecha_actualizacion": serialize_date(row[37]),
                }
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "ofertas_etc": ofertas})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar las ofertas ETC: {str(exc)}"}), 500


@app.route("/api/ofertas-etc/<int:oferta_etc_id>", methods=["GET"])
def get_oferta_etc(oferta_etc_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar la oferta ETC"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()

            if not oferta_etc_table_exists(cursor):
                return jsonify({"success": False, "message": "La tabla ofertas.oferta_etc no existe todavía"}), 404

            cursor.execute(
                """
                SELECT
                    o.id_oferta_etc,
                    o.fecha_recepcion,
                    o.fecha_envio_oferta,
                    o.fecha_limite_respuesta,
                    o.id_estado,
                    e.descripcion_estado,
                    o.id_cliente,
                    c.descripcion_cliente,
                    o.num_operario_responsable,
                    gu.nombre,
                    o.id_departamento_destino,
                    d.nombre_departamento,
                    o.codigo_externo_oferta,
                    o.codigo_interno_oferta,
                    o.referencia_cliente,
                    o.numero_comision,
                    o.po_original,
                    o.pedido_b2b,
                    o.proyecto,
                    o.nombre_solicitante,
                    o.email_solicitante,
                    o.empresa_solicitante,
                    o.incoterm,
                    o.moneda,
                    o.prioridad,
                    o.es_urgente,
                    o.resumen_material_solicitado,
                    o.resumen_material_ofertado,
                    o.total_material_eur,
                    o.total_fee_eur,
                    o.total_oferta_eur,
                    o.observaciones_cliente,
                    o.observaciones_tecnicas,
                    o.observaciones_internas,
                    o.origen_registro,
                    o.activo,
                    o.fecha_creacion,
                    o.fecha_actualizacion
                FROM ofertas.oferta_etc o
                LEFT JOIN ofertas.estados e
                    ON e.id_estado = o.id_estado
                LEFT JOIN ofertas.clientes c
                    ON c.id_cliente = o.id_cliente
                LEFT JOIN ofertas.departamentos d
                    ON d.id_departamento = o.id_departamento_destino
                LEFT JOIN general.usuarios gu
                    ON gu.num_operario = o.num_operario_responsable
                WHERE o.id_oferta_etc = ?
                """,
                (oferta_etc_id,),
            )
            row = cursor.fetchone()

            if not row:
                return jsonify({"success": False, "message": "Oferta ETC no encontrada"}), 404

            oferta = {
                "id_oferta_etc": row[0],
                "fecha_recepcion": serialize_date(row[1]),
                "fecha_envio_oferta": serialize_date(row[2]),
                "fecha_limite_respuesta": serialize_date(row[3]),
                "id_estado": row[4],
                "estado": row[5],
                "id_cliente": row[6],
                "cliente": row[7],
                "num_operario_responsable": row[8],
                "nombre_responsable": row[9],
                "id_departamento_destino": row[10],
                "nombre_departamento": row[11],
                "codigo_externo_oferta": row[12],
                "codigo_interno_oferta": row[13],
                "referencia_cliente": row[14],
                "numero_comision": row[15],
                "po_original": row[16],
                "pedido_b2b": row[17],
                "proyecto": row[18],
                "nombre_solicitante": row[19],
                "email_solicitante": row[20],
                "empresa_solicitante": row[21],
                "incoterm": row[22],
                "moneda": row[23],
                "prioridad": row[24],
                "es_urgente": bool(row[25]) if row[25] is not None else False,
                "resumen_material_solicitado": row[26],
                "resumen_material_ofertado": row[27],
                "total_material_eur": serialize_decimal(row[28]),
                "total_fee_eur": serialize_decimal(row[29]),
                "total_oferta_eur": serialize_decimal(row[30]),
                "observaciones_cliente": row[31],
                "observaciones_tecnicas": row[32],
                "observaciones_internas": row[33],
                "origen_registro": row[34],
                "activo": bool(row[35]) if row[35] is not None else True,
                "fecha_creacion": serialize_date(row[36]),
                "fecha_actualizacion": serialize_date(row[37]),
            }

        return jsonify({"success": True, "oferta_etc": oferta})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo consultar la oferta ETC: {str(exc)}"}), 500


@app.route("/api/ofertas/columnas-disponibles", methods=["GET"])
def list_available_offer_columns():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar las columnas disponibles"}), 401

    return jsonify({"success": True, "columnas": get_available_offer_columns()})


@app.route("/api/ofertas/importar-correo", methods=["POST"])
def import_oferta_from_email():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para importar correos"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    uploaded_file = request.files.get("correo")
    if uploaded_file is None:
        return jsonify({"success": False, "message": "Debes adjuntar un correo .eml o .msg"}), 400

    try:
        parsed_email = parse_uploaded_email(uploaded_file)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo interpretar el correo: {str(exc)}"}), 500

    try:
        cliente_resolution = resolve_cliente_for_sender_email(parsed_email.get("sender_email"))
        matched_cliente = (cliente_resolution or {}).get("cliente")

        message_parts = ["Correo importado correctamente."]
        if matched_cliente:
            message_parts.append(f"Cliente detectado: {matched_cliente['descripcion_cliente']}.")
        elif cliente_resolution and cliente_resolution.get("domain"):
            message_parts.append(f"No se encontró cliente para el dominio {cliente_resolution['domain']}.")

        return jsonify(
            {
                "success": True,
                "message": " ".join(message_parts),
                "data": build_imported_email_response_data(parsed_email, cliente_resolution),
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo completar la importación del correo: {str(exc)}"}), 500


@app.route("/api/ofertas/<int:oferta_id>", methods=["GET"])
def get_oferta(oferta_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar la oferta"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT
                    lo.id_oferta,
                    lo.numero_oferta,
                    lo.id_estado,
                    e.descripcion_estado,
                    lo.fecha_email,
                    lo.fecha_alta_oferta,
                    lo.ref_cliente_asunto_email,
                    lo.id_cliente,
                    lo.observaciones,
                    lo.nombre_emisor,
                    lo.email_emisor
                FROM ofertas.listado_ofertas lo
                LEFT JOIN ofertas.estados e
                    ON e.id_estado = lo.id_estado
                WHERE lo.id_oferta = ?
                """,
                (oferta_id,),
            )
            row = cursor.fetchone()

            if not row:
                return jsonify({"success": False, "message": "Oferta no encontrada"}), 404

            oferta = {
                "id_oferta": row[0],
                "numero_oferta": row[1],
                "id_estado": row[2],
                "estado": row[3],
                "fecha_email": serialize_date(row[4]),
                "fecha_alta_oferta": serialize_date(row[5]),
                "ref_cliente_asunto_email": row[6],
                "id_cliente": row[7],
                "observaciones": row[8],
                "nombre_emisor": row[9],
                "email_emisor": row[10],
                "emisor": format_sender_display(row[9], row[10]),
                "interacciones": [],
            }

            cursor.execute(
                """
                SELECT
                    tipo_interaccion,
                    fecha_interaccion,
                    fecha_limite,
                    observaciones
                FROM ofertas.oferta_interacciones
                WHERE id_oferta = ?
                ORDER BY fecha_interaccion DESC, id_interaccion DESC
                """,
                (oferta_id,),
            )

            oferta["interacciones"] = [
                {
                    "tipo_interaccion": interaction_row[0],
                    "fecha_interaccion": interaction_row[1].isoformat() if interaction_row[1] else None,
                    "fecha_limite": interaction_row[2].isoformat() if interaction_row[2] else None,
                    "observaciones": interaction_row[3],
                }
                for interaction_row in cursor.fetchall()
            ]

        return jsonify({"success": True, "oferta": oferta})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo consultar la oferta: {str(exc)}"}), 500


@app.route("/api/ofertas/<int:oferta_id>", methods=["PUT"])
def update_oferta(oferta_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para actualizar la oferta"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_oferta_update_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT 1 FROM ofertas.estados WHERE id_estado = ?", (payload["id_estado"],))
            if cursor.fetchone() is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            if payload["id_cliente"] is not None:
                cursor.execute("SELECT 1 FROM ofertas.clientes WHERE id_cliente = ?", (payload["id_cliente"],))
                if cursor.fetchone() is None:
                    conn.rollback()
                    return jsonify({"success": False, "message": "Cliente no encontrado"}), 404

            if oferta_email_subject_exists(
                cursor,
                payload["fecha_email"],
                payload["ref_cliente_asunto_email"],
                excluded_id=oferta_id,
            ):
                conn.rollback()
                return jsonify({"success": False, "message": "Ya existe una oferta con la misma fecha de e-mail y el mismo asunto."}), 409

            cursor.execute(
                """
                UPDATE ofertas.listado_ofertas
                SET id_estado = ?,
                    fecha_email = ?,
                    fecha_alta_oferta = ?,
                    ref_cliente_asunto_email = ?,
                    id_cliente = ?,
                    observaciones = ?,
                    nombre_emisor = ?,
                    email_emisor = ?
                WHERE id_oferta = ?
                """,
                (
                    payload["id_estado"],
                    payload["fecha_email"],
                    payload["fecha_alta_oferta"],
                    payload["ref_cliente_asunto_email"],
                    payload["id_cliente"],
                    payload["observaciones"],
                    payload["nombre_emisor"],
                    payload["email_emisor"],
                    oferta_id,
                ),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Oferta no encontrada"}), 404

            conn.commit()

        return jsonify({"success": True, "message": "Oferta actualizada correctamente"})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar la oferta: {str(exc)}"}), 500


@app.route("/api/ofertas/verificar-duplicado-correo", methods=["POST"])
def check_oferta_duplicate_email():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para comprobar el correo"}), 401

    data = request.get_json(silent=True) or {}

    try:
        fecha_email = normalize_required_date(data.get("fecha_email"), "fecha_email")
        ref_cliente_asunto_email = normalize_optional_text(data.get("ref_cliente_asunto_email"), 500)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection() as conn:
            cursor = conn.cursor()
            exists = oferta_email_subject_exists(cursor, fecha_email, ref_cliente_asunto_email)

        return jsonify(
            {
                "success": True,
                "exists": exists,
                "message": "Ya existe una oferta con la misma fecha de e-mail y el mismo asunto." if exists else "",
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo comprobar el correo: {str(exc)}"}), 500


@app.route("/api/ofertas/<int:oferta_id>/estado", methods=["POST"])
def update_oferta_estado(oferta_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para actualizar el estado de la oferta"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_oferta_estado_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    notification_result = None

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT
                    lo.id_oferta,
                    lo.id_estado,
                    e.descripcion_estado
                FROM ofertas.listado_ofertas lo
                LEFT JOIN ofertas.estados e
                    ON e.id_estado = lo.id_estado
                WHERE lo.id_oferta = ?
                """,
                (oferta_id,),
            )
            oferta_row = cursor.fetchone()

            if not oferta_row:
                conn.rollback()
                return jsonify({"success": False, "message": "Oferta no encontrada"}), 404

            previous_estado_id = oferta_row[1]
            previous_estado = (oferta_row[2] or "Sin estado").strip()

            next_estado_metadata = get_estado_metadata(cursor, payload["id_estado"])
            if next_estado_metadata is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado siguiente no encontrado"}), 404
            if not next_estado_metadata["activo"]:
                conn.rollback()
                return jsonify({"success": False, "message": "El estado siguiente está inactivo y no se puede seleccionar"}), 409

            if previous_estado_id == payload["id_estado"]:
                conn.rollback()
                return jsonify({"success": False, "message": "Debes seleccionar un estado distinto al actual"}), 400

            next_estado = (next_estado_metadata["descripcion_estado"] or "Sin estado").strip()
            interaction_date = datetime.now()
            interaction_type = f"{previous_estado} -> {next_estado}"

            cursor.execute(
                """
                UPDATE ofertas.listado_ofertas
                SET id_estado = ?
                WHERE id_oferta = ?
                """,
                (payload["id_estado"], oferta_id),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Oferta no encontrada"}), 404

            cursor.execute(
                """
                INSERT INTO ofertas.oferta_interacciones (
                    id_oferta,
                    tipo_interaccion,
                    fecha_interaccion,
                    fecha_limite,
                    observaciones
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (oferta_id, interaction_type, interaction_date, payload["fecha_limite"], payload["comentario"]),
            )

            notification_payload = build_estado_manager_notification(cursor, oferta_id, payload["id_estado"])

            conn.commit()

            notification_result = send_estado_manager_notification(notification_payload)

        return jsonify(
            {
                "success": True,
                "message": "Estado actualizado correctamente",
                "fecha_interaccion": interaction_date.isoformat(),
                "fecha_limite": payload["fecha_limite"].isoformat() if payload["fecha_limite"] else None,
                "tipo_interaccion": interaction_type,
                "estado_anterior": previous_estado,
                "estado_siguiente": next_estado,
                "notification": notification_result,
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar el estado de la oferta: {str(exc)}"}), 500


@app.route("/api/clientes", methods=["GET"])
def list_clientes():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los clientes"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id_cliente, descripcion_cliente, dominio
                FROM ofertas.clientes
                ORDER BY descripcion_cliente ASC
                """
            )
            clientes = [
                {"id_cliente": row[0], "descripcion_cliente": row[1], "dominio": row[2]}
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "clientes": clientes})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los clientes: {str(exc)}"}), 500


@app.route("/api/clientes", methods=["POST"])
def create_cliente():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para crear clientes"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_cliente_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if cliente_exists(cursor, payload["descripcion_cliente"]):
                return jsonify({"success": False, "message": "Ya existe un cliente con esa descripción"}), 409
            if cliente_domain_exists(cursor, payload["dominio"]):
                return jsonify({"success": False, "message": "Ya existe un cliente con ese dominio"}), 409

            cursor.execute(
                """
                INSERT INTO ofertas.clientes (descripcion_cliente, dominio)
                OUTPUT INSERTED.id_cliente
                VALUES (?, ?)
                """,
                (payload["descripcion_cliente"], payload["dominio"]),
            )
            inserted = cursor.fetchone()
            inserted_id = inserted[0] if inserted else None
            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Cliente creado correctamente",
                "cliente": {
                    "id_cliente": inserted_id,
                    "descripcion_cliente": payload["descripcion_cliente"],
                    "dominio": payload["dominio"],
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo crear el cliente: {str(exc)}"}), 500


@app.route("/api/clientes/<int:cliente_id>", methods=["PUT"])
def update_cliente(cliente_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para editar clientes"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_cliente_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if cliente_exists(cursor, payload["descripcion_cliente"], excluded_id=cliente_id):
                return jsonify({"success": False, "message": "Ya existe un cliente con esa descripción"}), 409
            if cliente_domain_exists(cursor, payload["dominio"], excluded_id=cliente_id):
                return jsonify({"success": False, "message": "Ya existe un cliente con ese dominio"}), 409

            cursor.execute(
                """
                UPDATE ofertas.clientes
                SET descripcion_cliente = ?, dominio = ?
                WHERE id_cliente = ?
                """,
                (payload["descripcion_cliente"], payload["dominio"], cliente_id),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Cliente no encontrado"}), 404

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Cliente actualizado correctamente",
                "cliente": {
                    "id_cliente": cliente_id,
                    "descripcion_cliente": payload["descripcion_cliente"],
                    "dominio": payload["dominio"],
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar el cliente: {str(exc)}"}), 500


@app.route("/api/proyectos", methods=["GET"])
def list_proyectos():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los proyectos"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id_proyecto, descripcion_proyecto
                FROM ofertas.proyectos
                ORDER BY descripcion_proyecto ASC
                """
            )
            proyectos = [
                {"id_proyecto": row[0], "descripcion_proyecto": row[1]}
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "proyectos": proyectos})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los proyectos: {str(exc)}"}), 500


@app.route("/api/proyectos", methods=["POST"])
def create_proyecto():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para crear proyectos"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_proyecto_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if proyecto_exists(cursor, payload["descripcion_proyecto"]):
                return jsonify({"success": False, "message": "Ya existe un proyecto con esa descripción"}), 409

            cursor.execute(
                """
                INSERT INTO ofertas.proyectos (descripcion_proyecto)
                OUTPUT INSERTED.id_proyecto
                VALUES (?)
                """,
                (payload["descripcion_proyecto"],),
            )
            inserted = cursor.fetchone()
            inserted_id = inserted[0] if inserted else None
            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "proyecto creado correctamente",
                "proyecto": {
                    "id_proyecto": inserted_id,
                    "descripcion_proyecto": payload["descripcion_proyecto"],
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo crear el proyecto: {str(exc)}"}), 500


@app.route("/api/proyectos/<int:proyecto_id>", methods=["PUT"])
def update_proyecto(proyecto_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para editar proyectos"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_proyecto_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if proyecto_exists(cursor, payload["descripcion_proyecto"], excluded_id=proyecto_id):
                return jsonify({"success": False, "message": "Ya existe un proyecto con esa descripción"}), 409

            cursor.execute(
                """
                UPDATE ofertas.proyectos
                SET descripcion_proyecto = ?
                WHERE id_proyecto = ?
                """,
                (payload["descripcion_proyecto"], proyecto_id),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "proyecto no encontrado"}), 404

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "proyecto actualizado correctamente",
                "proyecto": {
                    "id_proyecto": proyecto_id,
                    "descripcion_proyecto": payload["descripcion_proyecto"],
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar el proyecto: {str(exc)}"}), 500


@app.route("/api/materiales-precio", methods=["GET"])
def list_materiales_precio():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los materiales BOM"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()

            if not materiales_precio_table_exists(cursor):
                return jsonify({"success": False, "message": "La tabla ofertas.materiales_precio no existe."}), 409

            if not materiales_precio_has_fecha_creacion(cursor):
                return jsonify(
                    {
                        "success": False,
                        "message": "La tabla ofertas.materiales_precio debe incluir la columna fecha_creacion. Ejecuta antes el ALTER correspondiente.",
                    }
                ), 409

            materiales = list_materiales_precio_snapshot(cursor)

        return jsonify({"success": True, "materiales": materiales})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los materiales BOM: {str(exc)}"}), 500


@app.route("/api/materiales-precio", methods=["POST"])
def create_material_precio():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para guardar precios BOM"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_material_precio_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if not materiales_precio_table_exists(cursor):
                conn.rollback()
                return jsonify({"success": False, "message": "La tabla ofertas.materiales_precio no existe."}), 409

            if not materiales_precio_has_fecha_creacion(cursor):
                conn.rollback()
                return jsonify(
                    {
                        "success": False,
                        "message": "La tabla ofertas.materiales_precio debe incluir la columna fecha_creacion. Ejecuta antes el ALTER correspondiente.",
                    }
                ), 409

            cursor.execute(
                """
                INSERT INTO ofertas.materiales_precio (material, precio)
                OUTPUT INSERTED.id_material_precio, INSERTED.material, INSERTED.precio, INSERTED.fecha_creacion
                VALUES (?, ?)
                """,
                (payload["material"], payload["precio"]),
            )
            inserted = cursor.fetchone()
            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Precio BOM guardado correctamente. Se ha creado un nuevo registro para conservar el histórico.",
                "material": {
                    "id_material_precio": inserted[0] if inserted else None,
                    "material": inserted[1] if inserted else payload["material"],
                    "precio": serialize_decimal(inserted[2]) if inserted else serialize_decimal(payload["precio"]),
                    "fecha_creacion": serialize_date(inserted[3]) if inserted else None,
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar el precio BOM: {str(exc)}"}), 500


@app.route("/api/estados", methods=["GET"])
def list_estados():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los estados"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT
                    e.id_estado,
                    e.descripcion_estado,
                    e.orden,
                    ISNULL(o.total_ofertas, 0) AS total_ofertas,
                    e.id_departamento,
                    ISNULL(d.nombre_departamento, '') AS nombre_departamento,
                    ISNULL(e.emoji_sidebar, '') AS emoji_sidebar,
                    ISNULL(e.activo, 1) AS activo
                FROM ofertas.estados e
                LEFT JOIN (
                    SELECT id_estado, COUNT(*) AS total_ofertas
                    FROM ofertas.listado_ofertas
                    GROUP BY id_estado
                ) o
                    ON o.id_estado = e.id_estado
                LEFT JOIN ofertas.departamentos d
                    ON d.id_departamento = e.id_departamento
                ORDER BY
                    CASE WHEN e.orden IS NULL THEN 1 ELSE 0 END,
                    e.orden ASC,
                    e.descripcion_estado ASC
                """
            )
            estados = [
                {
                    "id_estado": row[0],
                    "descripcion_estado": row[1],
                    "orden": row[2],
                    "total_ofertas": row[3],
                    "id_departamento": row[4],
                    "nombre_departamento": row[5],
                    "emoji_sidebar": row[6] or "",
                    "activo": bool(row[7]),
                }
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "estados": estados})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los estados: {str(exc)}"}), 500


@app.route("/api/estados", methods=["POST"])
def create_estado():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para crear estados"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_estado_payload(data)
        id_departamento = normalize_optional_int(data.get("id_departamento"), "id_departamento")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if estado_exists(cursor, payload["descripcion_estado"]):
                return jsonify({"success": False, "message": "Ya existe un estado con esa descripción"}), 409

            if id_departamento is not None:
                cursor.execute("SELECT 1 FROM ofertas.departamentos WHERE id_departamento = ?", (id_departamento,))
                if cursor.fetchone() is None:
                    return jsonify({"success": False, "message": "Departamento no encontrado"}), 404

            if payload["orden"] is None:
                cursor.execute("SELECT ISNULL(MAX(orden), 0) + 1 FROM ofertas.estados")
                next_order_row = cursor.fetchone()
                payload["orden"] = next_order_row[0] if next_order_row and next_order_row[0] is not None else 1

            cursor.execute(
                """
                INSERT INTO ofertas.estados (descripcion_estado, orden, id_departamento, emoji_sidebar, activo)
                OUTPUT INSERTED.id_estado
                VALUES (?, ?, ?, ?, ?)
                """,
                (payload["descripcion_estado"], payload["orden"], id_departamento, payload["emoji_sidebar"], 1 if payload["activo"] else 0),
            )
            inserted = cursor.fetchone()
            inserted_id = inserted[0] if inserted else None
            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Estado creado correctamente",
                "estado": {
                    "id_estado": inserted_id,
                    "descripcion_estado": payload["descripcion_estado"],
                    "orden": payload["orden"],
                    "id_departamento": id_departamento,
                    "emoji_sidebar": payload["emoji_sidebar"],
                    "activo": payload["activo"],
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo crear el estado: {str(exc)}"}), 500


@app.route("/api/estados/<int:estado_id>", methods=["PUT"])
def update_estado(estado_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para editar estados"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_estado_payload(data)
        id_departamento = normalize_optional_int(data.get("id_departamento"), "id_departamento")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if estado_exists(cursor, payload["descripcion_estado"], excluded_id=estado_id):
                return jsonify({"success": False, "message": "Ya existe un estado con esa descripción"}), 409

            if id_departamento is not None:
                cursor.execute("SELECT 1 FROM ofertas.departamentos WHERE id_departamento = ?", (id_departamento,))
                if cursor.fetchone() is None:
                    return jsonify({"success": False, "message": "Departamento no encontrado"}), 404

            cursor.execute(
                """
                UPDATE ofertas.estados
                SET descripcion_estado = ?, orden = ?, id_departamento = ?, emoji_sidebar = ?, activo = ?
                WHERE id_estado = ?
                """,
                (payload["descripcion_estado"], payload["orden"], id_departamento, payload["emoji_sidebar"], 1 if payload["activo"] else 0, estado_id),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Estado actualizado correctamente",
                "estado": {
                    "id_estado": estado_id,
                    "descripcion_estado": payload["descripcion_estado"],
                    "orden": payload["orden"],
                    "emoji_sidebar": payload["emoji_sidebar"],
                    "activo": payload["activo"],
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar el estado: {str(exc)}"}), 500


@app.route("/api/estados/reorder", methods=["POST"])
def reorder_estados():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para reordenar estados"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    items = (request.get_json(silent=True) or {}).get("orden", [])
    if not isinstance(items, list) or not items:
        return jsonify({"success": False, "message": "Payload inválido: se espera {orden: [{id_estado, orden}]}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            for item in items:
                cursor.execute(
                    "UPDATE ofertas.estados SET orden = ? WHERE id_estado = ?",
                    (int(item["orden"]), int(item["id_estado"])),
                )
            conn.commit()
        return jsonify({"success": True, "message": "orden actualizado"})
    except (KeyError, TypeError, ValueError) as exc:
        return jsonify({"success": False, "message": f"Datos inválidos: {str(exc)}"}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo reordenar los estados: {str(exc)}"}), 500


@app.route("/api/estados/<int:estado_id>/columnas", methods=["GET"])
def list_configuracion_columnas(estado_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar la configuración de columnas"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT 1 FROM ofertas.estados WHERE id_estado = ?",
                (estado_id,),
            )
            if cursor.fetchone() is None:
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            cursor.execute(
                """
                SELECT id_config, id_estado, columna, descripcion_columna, orden_columna
                FROM ofertas.configuracioncolumnas
                WHERE id_estado = ?
                ORDER BY ISNULL(orden_columna, 2147483647), id_config ASC
                """,
                (estado_id,),
            )
            configuraciones = [
                {
                    "id_config": row[0],
                    "id_estado": row[1],
                    "columna": normalize_offer_column_name(row[2]),
                    "descripcion_columna": row[3],
                    "orden_columna": row[4],
                }
                for row in cursor.fetchall()
                if normalize_offer_column_name(row[2]) in get_available_offer_column_map()
            ]

        return jsonify({"success": True, "configuraciones": configuraciones})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo consultar la configuración de columnas: {str(exc)}"}), 500


@app.route("/api/estados/<int:estado_id>/columnas", methods=["POST"])
def create_configuracion_columna(estado_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para crear columnas de configuración"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}
    available_column_map = get_available_offer_column_map()

    try:
        columnas = data.get("columnas") if isinstance(data.get("columnas"), list) else None
        if columnas:
            columnas = [normalize_offer_column_name(normalize_required_text(column, "columna", 100)) for column in columnas]
            payload = {
                "columna": columnas[0],
                "descripcion_columna": normalize_optional_text(data.get("descripcion_columna"), 255),
                "orden_columna": normalize_optional_int(data.get("orden_columna"), "orden columna"),
            }
        else:
            payload = build_configuracion_columna_payload(data)
            payload["columna"] = normalize_offer_column_name(payload["columna"])
            columnas = [payload["columna"]]
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    if any(column is None for column in columnas):
        return jsonify({"success": False, "message": "Una o más columnas ya no existen en la estructura actual"}), 400

    invalid_columns = [column for column in columnas if column not in available_column_map]
    if invalid_columns:
        return jsonify({"success": False, "message": f"columnas no válidas: {', '.join(invalid_columns)}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT 1 FROM ofertas.estados WHERE id_estado = ?",
                (estado_id,),
            )
            if cursor.fetchone() is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            cursor.execute(
                "SELECT ISNULL(MAX(orden_columna), 0) FROM ofertas.configuracioncolumnas WHERE id_estado = ?",
                (estado_id,),
            )
            current_max_order = cursor.fetchone()[0] or 0

            inserted_configurations = []
            for index, column in enumerate(columnas):
                if configuracion_columna_exists(cursor, estado_id, column):
                    conn.rollback()
                    return jsonify({"success": False, "message": f"Ya existe una columna con ese nombre para el estado seleccionado: {column}"}), 409

                order_value = payload["orden_columna"] + index if payload["orden_columna"] is not None else current_max_order + index + 1
                description_value = payload["descripcion_columna"] if len(columnas) == 1 and payload["descripcion_columna"] else available_column_map[column]["label"]

                cursor.execute(
                    """
                    INSERT INTO ofertas.configuracioncolumnas (id_estado, columna, descripcion_columna, orden_columna)
                    OUTPUT INSERTED.id_config
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        estado_id,
                        column,
                        description_value,
                        order_value,
                    ),
                )
                inserted = cursor.fetchone()
                inserted_configurations.append(
                    {
                        "id_config": inserted[0] if inserted else None,
                        "id_estado": estado_id,
                        "columna": column,
                        "descripcion_columna": description_value,
                        "orden_columna": order_value,
                    }
                )

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "columna de configuración creada correctamente",
                "configuracion": inserted_configurations[0] if len(inserted_configurations) == 1 else None,
                "configuraciones": inserted_configurations,
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo crear la columna de configuración: {str(exc)}"}), 500


@app.route("/api/configuracion-columnas/<int:config_id>", methods=["PUT"])
def update_configuracion_columna(config_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para editar columnas de configuración"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}
    available_column_map = get_available_offer_column_map()

    try:
        payload = build_configuracion_columna_payload(data)
        payload["columna"] = normalize_offer_column_name(payload["columna"])
        id_estado = normalize_required_int(data.get("id_estado"), "id_estado")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    if payload["columna"] is None:
        return jsonify({"success": False, "message": "La columna indicada ya no existe en la estructura actual"}), 400

    if payload["columna"] not in available_column_map:
        return jsonify({"success": False, "message": f"columna no válida: {payload['columna']}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT 1 FROM ofertas.estados WHERE id_estado = ?",
                (id_estado,),
            )
            if cursor.fetchone() is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            if configuracion_columna_exists(cursor, id_estado, payload["columna"], excluded_id=config_id):
                conn.rollback()
                return jsonify({"success": False, "message": "Ya existe una columna con ese nombre para el estado seleccionado"}), 409

            cursor.execute(
                """
                UPDATE ofertas.configuracioncolumnas
                SET id_estado = ?,
                    columna = ?,
                    descripcion_columna = ?,
                    orden_columna = ?
                WHERE id_config = ?
                """,
                (
                    id_estado,
                    payload["columna"],
                    payload["descripcion_columna"],
                    payload["orden_columna"],
                    config_id,
                ),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Configuración de columna no encontrada"}), 404

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "columna de configuración actualizada correctamente",
                "configuracion": {
                    "id_config": config_id,
                    "id_estado": id_estado,
                    "columna": payload["columna"],
                    "descripcion_columna": payload["descripcion_columna"],
                    "orden_columna": payload["orden_columna"],
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar la columna de configuración: {str(exc)}"}), 500


@app.route("/api/configuracion-columnas/<int:config_id>", methods=["DELETE"])
def delete_configuracion_columna(config_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para eliminar columnas de configuración"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM ofertas.configuracioncolumnas WHERE id_config = ?",
                (config_id,),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Configuración de columna no encontrada"}), 404

            conn.commit()

        return jsonify({"success": True, "message": "columna de configuración eliminada correctamente"})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo eliminar la columna de configuración: {str(exc)}"}), 500


@app.route("/api/configuracion-columnas/reorder", methods=["POST"])
def reorder_configuracion_columnas():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para reordenar columnas de configuración"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    items = (request.get_json(silent=True) or {}).get("orden", [])
    if not isinstance(items, list) or not items:
        return jsonify({"success": False, "message": "Payload inválido: se espera {orden: [{id_config, orden_columna}]}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            for item in items:
                cursor.execute(
                    "UPDATE ofertas.configuracioncolumnas SET orden_columna = ? WHERE id_config = ?",
                    (int(item["orden_columna"]), int(item["id_config"])),
                )
            conn.commit()

        return jsonify({"success": True, "message": "orden de columnas actualizado"})
    except (KeyError, TypeError, ValueError) as exc:
        return jsonify({"success": False, "message": f"Datos inválidos: {str(exc)}"}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo reordenar la configuración de columnas: {str(exc)}"}), 500


# =====================================================
# ENDPOINTS PARA DEPARTAMENTOS
# =====================================================

@app.route("/api/departamentos", methods=["GET"])
def list_departamentos():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los departamentos"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT
                    id_departamento,
                    nombre_departamento,
                    descripcion,
                    estado_activo,
                    fecha_creacion
                FROM ofertas.departamentos
                ORDER BY nombre_departamento ASC
                """
            )
            departamentos = [
                {
                    "id_departamento": row[0],
                    "nombre_departamento": row[1],
                    "descripcion": row[2],
                    "estado_activo": bool(row[3]),
                    "fecha_creacion": row[4].isoformat() if row[4] else None,
                }
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "departamentos": departamentos})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los departamentos: {str(exc)}"}), 500


@app.route("/api/departamentos", methods=["POST"])
def create_departamento():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para crear departamentos"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        nombre = normalize_required_text(data.get("nombre_departamento"), "Nombre departamento", 255)
        descripcion = normalize_optional_text(data.get("descripcion"), 500)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            # Verificar si ya existe un departamento con ese nombre
            cursor.execute(
                "SELECT 1 FROM ofertas.departamentos WHERE LOWER(LTRIM(RTRIM(nombre_departamento))) = LOWER(LTRIM(RTRIM(?)))",
                (nombre,),
            )
            if cursor.fetchone() is not None:
                return jsonify({"success": False, "message": "Ya existe un departamento con ese nombre"}), 409

            cursor.execute(
                """
                INSERT INTO ofertas.departamentos (nombre_departamento, descripcion, estado_activo)
                OUTPUT INSERTED.id_departamento, INSERTED.fecha_creacion
                VALUES (?, ?, 1)
                """,
                (nombre, descripcion),
            )
            inserted = cursor.fetchone()
            inserted_id = inserted[0] if inserted else None
            fecha_creacion = inserted[1].isoformat() if inserted and inserted[1] else None
            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Departamento creado correctamente",
                "departamento": {
                    "id_departamento": inserted_id,
                    "nombre_departamento": nombre,
                    "descripcion": descripcion,
                    "estado_activo": True,
                    "fecha_creacion": fecha_creacion,
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo crear el departamento: {str(exc)}"}), 500


@app.route("/api/departamentos/<int:departamento_id>", methods=["PUT"])
def update_departamento(departamento_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para editar departamentos"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        nombre = normalize_required_text(data.get("nombre_departamento"), "Nombre departamento", 255)
        descripcion = normalize_optional_text(data.get("descripcion"), 500)
        estado_activo = bool(data.get("estado_activo", True))
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            # Verificar si existe otro departamento con ese nombre
            cursor.execute(
                "SELECT 1 FROM ofertas.departamentos WHERE LOWER(LTRIM(RTRIM(nombre_departamento))) = LOWER(LTRIM(RTRIM(?))) AND id_departamento <> ?",
                (nombre, departamento_id),
            )
            if cursor.fetchone() is not None:
                return jsonify({"success": False, "message": "Ya existe otro departamento con ese nombre"}), 409

            cursor.execute(
                """
                UPDATE ofertas.departamentos
                SET nombre_departamento = ?, descripcion = ?, estado_activo = ?
                WHERE id_departamento = ?
                """,
                (nombre, descripcion, int(estado_activo), departamento_id),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Departamento no encontrado"}), 404

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Departamento actualizado correctamente",
                "departamento": {
                    "id_departamento": departamento_id,
                    "nombre_departamento": nombre,
                    "descripcion": descripcion,
                    "estado_activo": estado_activo,
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar el departamento: {str(exc)}"}), 500


# =====================================================
# ENDPOINTS PARA CONFIGURACION DE USUARIOS
# =====================================================

@app.route("/api/usuarios-config/<int:num_operario>", methods=["GET"])
def get_usuario_config(num_operario):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar la configuración del usuario"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            config = get_user_config(cursor, num_operario)

        return jsonify(
            {
                "success": True,
                "num_operario": num_operario,
                "email": config["email"],
                "id_rol": config["id_rol"],
                "rol": config["nombre_rol"],
                "departamento": config["departamento"],
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo consultar la configuración del usuario: {str(exc)}"}), 500


@app.route("/api/usuarios-config", methods=["POST"])
def upsert_usuario_config():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para guardar la configuración de usuario"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        num_operario = normalize_required_int(data.get("num_operario"), "Num_operario")
        email = normalize_optional_email(data.get("email"), "Email")
        id_departamento = normalize_optional_int(data.get("id_departamento"), "id_departamento")
        id_rol = normalize_required_int(data.get("id_rol"), "id_rol")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if id_departamento is not None:
                cursor.execute("SELECT 1 FROM ofertas.departamentos WHERE id_departamento = ?", (id_departamento,))
                if cursor.fetchone() is None:
                    return jsonify({"success": False, "message": "Departamento no encontrado"}), 404

            cursor.execute("SELECT 1 FROM ofertas.roles WHERE id_rol = ?", (id_rol,))
            if cursor.fetchone() is None:
                return jsonify({"success": False, "message": "Rol no encontrado"}), 404

            cursor.execute(
                """
                MERGE ofertas.usuarios_config AS target
                USING (SELECT ? AS Num_operario, ? AS Email, ? AS id_departamento, ? AS id_rol) AS source
                    ON target.Num_operario = source.Num_operario
                WHEN MATCHED THEN
                    UPDATE SET Email = source.Email, id_departamento = source.id_departamento, id_rol = source.id_rol
                WHEN NOT MATCHED THEN
                    INSERT (Num_operario, Email, id_departamento, id_rol)
                    VALUES (source.Num_operario, source.Email, source.id_departamento, source.id_rol);
                """,
                (num_operario, email, id_departamento, id_rol),
            )
            conn.commit()

        return jsonify({"success": True, "message": "Configuración de usuario guardada correctamente"})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar la configuración del usuario: {str(exc)}"}), 500


@app.route("/api/roles", methods=["GET"])
def list_roles():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los roles"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id_rol, nombre_rol, descripcion
                FROM ofertas.roles
                ORDER BY id_rol ASC
                """
            )
            roles = [
                {"id_rol": row[0], "nombre_rol": row[1], "descripcion": row[2]}
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "roles": roles})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los roles: {str(exc)}"}), 500


@app.route("/api/usuarios-general", methods=["GET"])
def list_usuarios_general():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los usuarios generales"}), 401

    search = normalize_optional_text(request.args.get("search"), 255)

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            query = """
                SELECT num_operario, nombre
                FROM general.usuarios
            """
            params = []

            if search:
                query += " WHERE CAST(num_operario AS VARCHAR(50)) LIKE ? OR nombre LIKE ?"
                params.extend([f"%{search}%", f"%{search}%"])

            query += " ORDER BY nombre ASC, num_operario ASC"
            cursor.execute(query, tuple(params))

            usuarios = [
                {
                    "num_operario": row[0],
                    "nombre": row[1],
                }
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "usuarios": usuarios})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los usuarios generales: {str(exc)}"}), 500


@app.route("/api/usuarios", methods=["GET"])
def list_usuarios():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para consultar los usuarios"}), 401

    try:
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT
                    ISNULL(u.id_usuario, 0) AS id_usuario,
                    uc.num_operario,
                    u.nombre,
                    uc.email,
                    uc.id_rol,
                    uc.id_departamento,
                    ISNULL(u.nivel_permisos, 0) AS nivel_permisos,
                    COALESCE(r.nombre_rol, 'Estandar') AS nombre_rol,
                    ISNULL(d.nombre_departamento, '') AS departamento
                FROM ofertas.usuarios_config uc
                INNER JOIN general.usuarios u
                    ON u.num_operario = uc.num_operario
                LEFT JOIN ofertas.roles r
                    ON r.id_rol = uc.id_rol
                LEFT JOIN ofertas.departamentos d
                    ON d.id_departamento = uc.id_departamento
                ORDER BY uc.num_operario ASC
                """
            )
            usuarios = [
                {
                    "id_usuario": row[0],
                    "num_operario": row[1],
                    "nombre": row[2],
                    "email": row[3],
                    "id_rol": row[4],
                    "id_departamento": row[5],
                    "nivel_permisos": row[6],
                    "rol": row[7],
                    "departamentos": row[8] or "",
                    "nombre_departamento": row[8] or "",
                }
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "usuarios": usuarios})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar los usuarios: {str(exc)}"}), 500


@app.route("/api/usuarios", methods=["POST"])
def create_usuario():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para crear usuarios"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_usuario_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            general_user = get_general_user(cursor, payload["num_operario"])
            if general_user is None:
                return jsonify({"success": False, "message": "El número de operario no existe en general.usuarios"}), 404

            if normalize_optional_text(general_user["nombre"], 255) != payload["nombre"]:
                return jsonify({"success": False, "message": "El nombre no coincide con el usuario de general.usuarios"}), 409

            role_id = payload["id_rol"]
            if role_id is None:
                role_id = get_role_id_by_name(cursor, payload["rol"])

            if role_id is None:
                return jsonify({"success": False, "message": "Rol no encontrado"}), 404

            cursor.execute("SELECT nombre_rol FROM ofertas.roles WHERE id_rol = ?", (role_id,))
            role_row = cursor.fetchone()
            if role_row is None:
                return jsonify({"success": False, "message": "Rol no encontrado"}), 404

            role_name = role_row[0]
            nivel_permisos = get_role_permission_level(role_name)

            if payload["id_departamento"] is not None:
                cursor.execute("SELECT 1 FROM ofertas.departamentos WHERE id_departamento = ?", (payload["id_departamento"],))
                if cursor.fetchone() is None:
                    conn.rollback()
                    return jsonify({"success": False, "message": "Departamento no encontrado"}), 404

            cursor.execute(
                """
                MERGE ofertas.usuarios_config AS target
                USING (SELECT ? AS num_operario, ? AS email, ? AS id_departamento, ? AS id_rol) AS source
                    ON target.num_operario = source.num_operario
                WHEN MATCHED THEN
                    UPDATE SET email = source.email, id_departamento = source.id_departamento, id_rol = source.id_rol
                WHEN NOT MATCHED THEN
                    INSERT (num_operario, email, id_departamento, id_rol)
                    VALUES (source.num_operario, source.email, source.id_departamento, source.id_rol);
                """,
                (payload["num_operario"], payload["email"], payload["id_departamento"], role_id),
            )

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Configuración de usuario guardada correctamente",
                "usuario": {
                    "id_usuario": general_user["id_usuario"],
                    "num_operario": payload["num_operario"],
                    "nombre": payload["nombre"],
                    "email": payload["email"],
                    "rol": role_name,
                    "nivel_permisos": nivel_permisos,
                },
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo crear el usuario: {str(exc)}"}), 500


@app.route("/api/usuarios/<int:num_operario>", methods=["PUT"])
def update_usuario(num_operario):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para actualizar usuarios"}), 401
    if is_read_only_user(user_data):
        return read_only_response()
    if not is_manager_user(user_data):
        return manager_only_response()

    data = request.get_json(silent=True) or {}
    data["num_operario"] = num_operario

    try:
        payload = build_usuario_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            general_user = get_general_user(cursor, payload["num_operario"])
            if general_user is None:
                return jsonify({"success": False, "message": "El número de operario no existe en general.usuarios"}), 404

            if normalize_optional_text(general_user["nombre"], 255) != payload["nombre"]:
                return jsonify({"success": False, "message": "El nombre no coincide con el usuario de general.usuarios"}), 409

            cursor.execute("SELECT 1 FROM ofertas.usuarios_config WHERE num_operario = ?", (payload["num_operario"],))
            if cursor.fetchone() is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

            role_id = payload["id_rol"]
            if role_id is None:
                role_id = get_role_id_by_name(cursor, payload["rol"])

            if role_id is None:
                return jsonify({"success": False, "message": "Rol no encontrado"}), 404

            cursor.execute("SELECT nombre_rol FROM ofertas.roles WHERE id_rol = ?", (role_id,))
            role_row = cursor.fetchone()
            if role_row is None:
                return jsonify({"success": False, "message": "Rol no encontrado"}), 404

            if payload["id_departamento"] is not None:
                cursor.execute("SELECT 1 FROM ofertas.departamentos WHERE id_departamento = ?", (payload["id_departamento"],))
                if cursor.fetchone() is None:
                    conn.rollback()
                    return jsonify({"success": False, "message": "Departamento no encontrado"}), 404

            cursor.execute(
                """
                UPDATE ofertas.usuarios_config
                SET email = ?,
                    id_departamento = ?,
                    id_rol = ?
                WHERE num_operario = ?
                """,
                (payload["email"], payload["id_departamento"], role_id, payload["num_operario"]),
            )

            conn.commit()

        return jsonify({"success": True, "message": "Usuario actualizado correctamente"})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo actualizar el usuario: {str(exc)}"}), 500


@app.route("/api/ofertas", methods=["POST"])
def create_oferta():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para guardar una oferta"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_oferta_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            inserted_id, numero_oferta = insert_oferta_record(cursor, payload)

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Oferta guardada correctamente",
                "id_oferta": inserted_id,
                "numero_oferta": numero_oferta,
            }
        )
    except DuplicateOfertaError as exc:
        return jsonify({"success": False, "message": str(exc)}), 409
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar la oferta: {str(exc)}"}), 500


def insert_oferta_record(cursor, payload):
    if oferta_email_subject_exists(
        cursor,
        payload["fecha_email"],
        payload["ref_cliente_asunto_email"],
    ):
        raise DuplicateOfertaError("Ya existe una oferta con la misma fecha de e-mail y el mismo asunto.")

    cursor.execute("CREATE TABLE #inserted_oferta (id_oferta INT)")
    cursor.execute(
        """
        INSERT INTO ofertas.listado_ofertas (
            fecha_email,
            fecha_alta_oferta,
            ref_cliente_asunto_email,
            id_cliente,
            observaciones,
            nombre_emisor,
            email_emisor
        )
        OUTPUT INSERTED.id_oferta INTO #inserted_oferta
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["fecha_email"],
            payload["fecha_alta_oferta"],
            payload["ref_cliente_asunto_email"],
            payload["id_cliente"],
            payload["observaciones"],
            payload["nombre_emisor"],
            payload["email_emisor"],
        ),
    )
    cursor.execute("SELECT id_oferta FROM #inserted_oferta")
    inserted = cursor.fetchone()
    inserted_id = inserted[0] if inserted else None

    numero_oferta = None
    if inserted_id is not None:
        cursor.execute(
            "SELECT numero_oferta FROM ofertas.listado_ofertas WHERE id_oferta = ?",
            (inserted_id,),
        )
        numero_row = cursor.fetchone()
        numero_oferta = numero_row[0] if numero_row else None

    return inserted_id, numero_oferta


def insert_oferta_etc_record(cursor, payload):
    if not oferta_etc_table_exists(cursor):
        raise ValueError("La tabla ofertas.oferta_etc no existe todavía")

    estado_metadata = get_estado_metadata(cursor, payload["id_estado"])
    if estado_metadata is None:
        raise ValueError("Estado no encontrado")
    if not estado_metadata["activo"]:
        raise ValueError("El estado seleccionado está inactivo y no se puede usar en procesos")

    if payload["id_cliente"] is not None:
        cursor.execute("SELECT 1 FROM ofertas.clientes WHERE id_cliente = ?", (payload["id_cliente"],))
        if cursor.fetchone() is None:
            raise ValueError("Cliente no encontrado")

    if payload["num_operario_responsable"] is not None:
        cursor.execute(
            "SELECT 1 FROM ofertas.usuarios_config WHERE num_operario = ?",
            (payload["num_operario_responsable"],),
        )
        if cursor.fetchone() is None:
            raise ValueError("Responsable no encontrado en ofertas.usuarios_config")

    if payload["id_departamento_destino"] is not None:
        cursor.execute(
            "SELECT 1 FROM ofertas.departamentos WHERE id_departamento = ?",
            (payload["id_departamento_destino"],),
        )
        if cursor.fetchone() is None:
            raise ValueError("Departamento no encontrado")

    if payload["proyecto"] is not None:
        cursor.execute(
            "SELECT 1 FROM ofertas.proyectos WHERE LTRIM(RTRIM(descripcion_proyecto)) = LTRIM(RTRIM(?))",
            (payload["proyecto"],),
        )
        if cursor.fetchone() is None:
            raise ValueError("proyecto no encontrado en la configuración")

    cursor.execute("CREATE TABLE #inserted_oferta_etc (id_oferta_etc INT)")
    cursor.execute(
        """
        INSERT INTO ofertas.oferta_etc (
            fecha_recepcion,
            fecha_envio_oferta,
            fecha_limite_respuesta,
            id_estado,
            id_cliente,
            num_operario_responsable,
            id_departamento_destino,
            codigo_externo_oferta,
            codigo_interno_oferta,
            referencia_cliente,
            numero_comision,
            po_original,
            pedido_b2b,
            proyecto,
            nombre_solicitante,
            email_solicitante,
            empresa_solicitante,
            incoterm,
            moneda,
            prioridad,
            es_urgente,
            resumen_material_solicitado,
            resumen_material_ofertado,
            total_material_eur,
            total_fee_eur,
            observaciones_cliente,
            observaciones_tecnicas,
            observaciones_internas,
            origen_registro,
            activo
        )
        OUTPUT INSERTED.id_oferta_etc INTO #inserted_oferta_etc
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["fecha_recepcion"],
            payload["fecha_envio_oferta"],
            payload["fecha_limite_respuesta"],
            payload["id_estado"],
            payload["id_cliente"],
            payload["num_operario_responsable"],
            payload["id_departamento_destino"],
            payload["codigo_externo_oferta"],
            payload["codigo_interno_oferta"],
            payload["referencia_cliente"],
            payload["numero_comision"],
            payload["po_original"],
            payload["pedido_b2b"],
            payload["proyecto"],
            payload["nombre_solicitante"],
            payload["email_solicitante"],
            payload["empresa_solicitante"],
            payload["incoterm"],
            payload["moneda"],
            payload["prioridad"],
            1 if payload["es_urgente"] else 0,
            payload["resumen_material_solicitado"],
            payload["resumen_material_ofertado"],
            payload["total_material_eur"],
            payload["total_fee_eur"],
            payload["observaciones_cliente"],
            payload["observaciones_tecnicas"],
            payload["observaciones_internas"],
            payload["origen_registro"],
            1 if payload["activo"] else 0,
        ),
    )
    cursor.execute("SELECT id_oferta_etc FROM #inserted_oferta_etc")
    inserted = cursor.fetchone()
    return inserted[0] if inserted else None


@app.route("/api/ofertas-completa", methods=["POST"])
def create_oferta_completa():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para guardar una oferta"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    data = request.get_json(silent=True) or {}
    oferta_data = data.get("oferta") or {}
    oferta_etc_data = data.get("oferta_etc") or {}

    try:
        oferta_payload = build_oferta_payload(oferta_data)
        oferta_etc_payload = build_oferta_etc_payload(oferta_etc_data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            inserted_id, numero_oferta = insert_oferta_record(cursor, oferta_payload)
            inserted_etc_id = insert_oferta_etc_record(cursor, oferta_etc_payload)
            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Oferta y ETC guardados correctamente",
                "id_oferta": inserted_id,
                "numero_oferta": numero_oferta,
                "id_oferta_etc": inserted_etc_id,
            }
        )
    except DuplicateOfertaError as exc:
        return jsonify({"success": False, "message": str(exc)}), 409
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except pyodbc.IntegrityError as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar la oferta completa por una restricción de datos: {str(exc)}"}), 409
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar la oferta completa: {str(exc)}"}), 500


@app.route("/api/ofertas-etc", methods=["POST"])
def create_oferta_etc():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para guardar una oferta ETC"}), 401
    if is_read_only_user(user_data):
        return read_only_response()

    data = request.get_json(silent=True) or {}

    try:
        payload = build_oferta_etc_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            inserted_id = insert_oferta_etc_record(cursor, payload)

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Oferta ETC guardada correctamente",
                "id_oferta_etc": inserted_id,
            }
        )
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except pyodbc.IntegrityError as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar la oferta ETC por una restricción de datos: {str(exc)}"}), 409
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar la oferta ETC: {str(exc)}"}), 500


def create_app():
    return app


if __name__ == "__main__":
    redirect_uri = get_env_value("OAUTH_REDIRECT_URI", "AZURE_REDIRECT_URI", "MICROSOFT_REDIRECT_URI", "OUTLOOK_REDIRECT_URI", default="")
    parsed_redirect = urlparse(redirect_uri) if redirect_uri else None
    use_https = parsed_redirect is not None and parsed_redirect.scheme.lower() == "https"
    app.run(
        host="0.0.0.0",
        port=app.config["APP_PORT"],
        debug=app.config["DEBUG"],
        ssl_context="adhoc" if use_https else None,
    )
