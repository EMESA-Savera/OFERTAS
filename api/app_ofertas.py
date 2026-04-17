import hashlib
import importlib
import os
import re
import sys
import tempfile
from contextlib import contextmanager
from datetime import datetime, timedelta
from email import policy
from email.parser import BytesParser
from email.utils import parseaddr, parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser

import pyodbc
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "ofertas-dev-secret-key")
    DEBUG = os.getenv("FLASK_ENV", "development").lower() == "development"
    APP_PORT = int(os.getenv("APP_PORT", "3009"))

    DB_SERVER = os.getenv("DB_SERVER", "EMEBIDWH")
    DB_DATABASE = os.getenv("DB_DATABASE", "Digitalizacion")
    DB_USER = os.getenv("DB_USER", "sa")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")

    SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "ofertas_session")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)


def get_runtime_root():
    if getattr(sys, "frozen", False):
        return getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_runtime_env(project_dir):
    candidate_paths = []

    if getattr(sys, "frozen", False):
        candidate_paths.append(os.path.join(os.path.dirname(sys.executable), ".env"))

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
load_dotenv()


app = Flask(
    __name__,
    template_folder=os.path.join(PROJECT_DIR, "templates"),
    static_folder=os.path.join(PROJECT_DIR, "static"),
)
app.config.from_object(Config)
app.secret_key = app.config["SECRET_KEY"]
CORS(app, supports_credentials=True)


@contextmanager
def db_connection(autocommit=False):
    conn = None
    last_error = None
    drivers_to_try = []

    if not app.config.get("DB_SERVER"):
        raise RuntimeError("Falta configurar DB_SERVER en el archivo .env")

    if not app.config.get("DB_DATABASE"):
        raise RuntimeError("Falta configurar DB_DATABASE en el archivo .env")

    if not app.config.get("DB_USER"):
        raise RuntimeError("Falta configurar DB_USER en el archivo .env")

    if not app.config.get("DB_PASSWORD"):
        raise RuntimeError("Falta configurar DB_PASSWORD en el archivo .env")

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


def normalize_optional_text(value, max_length=None):
    text = str(value or "").strip()
    if not text:
        return None
    if max_length is not None:
        return text[:max_length]
    return text


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


def extract_sender_email(value):
    _, email_address = parseaddr(str(value or ""))
    return email_address.strip().lower() or None


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
        SELECT Id_cliente, Descripcion_cliente, dominio
        FROM ofertas.Clientes
        WHERE LOWER(LTRIM(RTRIM(ISNULL(dominio, '')))) IN ({placeholders})
        ORDER BY CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(dominio, '')))) = ? THEN 0 ELSE 1 END,
                 LEN(LTRIM(RTRIM(ISNULL(dominio, '')))) DESC,
                 Descripcion_cliente ASC
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
    sender_email = extract_sender_email(message.get("from"))
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
        "sender_email": sender_email,
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
        sender_email = extract_sender_email(
            getattr(message, "sender", None)
            or getattr(message, "sender_email", None)
            or getattr(message, "header", "")
        )

        return {
            "sender_email": sender_email,
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


def build_oferta_payload(data):
    return {
        "fecha_email": normalize_optional_date(data.get("fecha_email"), "Fecha_email"),
        "fecha_alta_oferta": normalize_optional_date(data.get("fecha_alta_oferta"), "Fecha_alta_oferta"),
        "ref_cliente_asunto_email": normalize_optional_text(data.get("ref_cliente_asunto_email"), 500),
        "id_cliente": normalize_optional_int(data.get("id_cliente") if data.get("id_cliente") is not None else data.get("cliente"), "Cliente"),
        "observaciones": normalize_optional_text(data.get("observaciones")),
    }


def build_oferta_update_payload(data):
    payload = build_oferta_payload(data)
    payload["id_estado"] = normalize_required_int(data.get("id_estado"), "Estado")
    return payload


def build_oferta_estado_payload(data):
    return {
        "id_estado": normalize_required_int(data.get("id_estado"), "Estado siguiente"),
        "comentario": normalize_optional_text(data.get("comentario")),
    }


def build_cliente_payload(data):
    return {
        "descripcion_cliente": normalize_required_text(data.get("descripcion_cliente"), "Descripción cliente", 255),
        "dominio": normalize_cliente_domain(data.get("dominio")),
    }


def build_estado_payload(data):
    return {
        "descripcion_estado": normalize_required_text(data.get("descripcion_estado"), "Descripción estado", 255),
        "orden": normalize_optional_int(data.get("orden"), "Orden"),
    }


def get_available_offer_columns():
    return [
        {"value": "ID_oferta", "label": "ID oferta", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Estado", "label": "Estado", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Fecha_email", "label": "Fecha e-mail", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Fecha_alta_oferta", "label": "Fecha alta oferta", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Numero_oferta", "label": "Nº oferta", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Ref_cliente_asunto_email", "label": "Ref. cliente / asunto e-mail", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Cliente", "label": "Cliente", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Observaciones_oferta", "label": "Observaciones oferta", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Tipo_interaccion", "label": "Tipos interacción", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Fecha_interaccion", "label": "Fechas interacción", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
        {"value": "Observaciones_interaccion", "label": "Observaciones interacción", "source": "ofertas.vw_Listado_Ofertas_Interacciones"},
    ]


def get_available_offer_column_map():
    return {column["value"]: column for column in get_available_offer_columns()}


def normalize_offer_column_name(column_name):
    normalized = normalize_optional_text(column_name, 100)
    if normalized is None:
        return None

    legacy_map = {
        "Id_estado": "Estado",
        "Observaciones": "Observaciones_oferta",
        "Oferta_Interacciones.Tipo_interaccion": "Tipo_interaccion",
        "Oferta_Interacciones.Fecha_interaccion": "Fecha_interaccion",
        "Oferta_Interacciones.Observaciones": "Observaciones_interaccion",
        "Concepto": None,
        "Columna1": None,
        "Id_cliente": None,
        "Oferta_Interacciones.ID_interaccion": None,
    }

    return legacy_map.get(normalized, normalized)


def build_configuracion_columna_payload(data):
    return {
        "columna": normalize_required_text(data.get("columna"), "Columna", 100),
        "descripcion_columna": normalize_optional_text(data.get("descripcion_columna"), 255),
        "orden_columna": normalize_optional_int(data.get("orden_columna"), "Orden columna"),
    }


def get_next_numero_oferta(cursor):
    current_year = datetime.now().year
    cursor.execute(
        """
        SELECT ISNULL(MAX(TRY_CONVERT(INT, RIGHT(Numero_oferta, 5))), 0)
        FROM ofertas.Listado_Ofertas
        WHERE LEFT(ISNULL(Numero_oferta, ''), 4) = ?
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


def serialize_interaction_date_list(value):
    if value is None:
        return None
    return str(value)


def cliente_exists(cursor, descripcion_cliente, excluded_id=None):
    query = """
        SELECT TOP 1 Id_cliente
        FROM ofertas.Clientes
        WHERE LTRIM(RTRIM(Descripcion_cliente)) = LTRIM(RTRIM(?))
    """
    params = [descripcion_cliente]

    if excluded_id is not None:
        query += " AND Id_cliente <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def cliente_domain_exists(cursor, dominio, excluded_id=None):
    if not dominio:
        return False

    query = """
        SELECT TOP 1 Id_cliente
        FROM ofertas.Clientes
        WHERE LOWER(LTRIM(RTRIM(ISNULL(dominio, '')))) = LOWER(LTRIM(RTRIM(?)))
    """
    params = [dominio]

    if excluded_id is not None:
        query += " AND Id_cliente <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def estado_exists(cursor, descripcion_estado, excluded_id=None):
    query = """
        SELECT TOP 1 Id_estado
        FROM ofertas.Estados
        WHERE LTRIM(RTRIM(Descripcion_estado)) = LTRIM(RTRIM(?))
    """
    params = [descripcion_estado]

    if excluded_id is not None:
        query += " AND Id_estado <> ?"
        params.append(excluded_id)

    cursor.execute(query, tuple(params))
    return cursor.fetchone() is not None


def configuracion_columna_exists(cursor, id_estado, columna, excluded_id=None):
    normalized_target = normalize_offer_column_name(columna)
    cursor.execute(
        """
        SELECT Id_config, Columna
        FROM ofertas.ConfiguracionColumnas
        WHERE Id_estado = ?
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
    return render_template("index.html")


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
                SELECT Id_Usuario, Num_Operario, Nombre, Nivel_Permisos, Roles, Contrasena
                FROM General.Usuarios
                WHERE Num_Operario = ?
                """,
                (usuario,),
            )
            result = cursor.fetchone()

            if not result:
                return jsonify({"success": False, "message": "Usuario no encontrado"}), 401

            if not verify_password(password, result[5]):
                return jsonify({"success": False, "message": "Contraseña incorrecta"}), 401

            user_data = {
                "id": result[0],
                "num_operario": result[1],
                "usuario": result[1],
                "nombre": result[2],
                "nivel": result[3],
                "Nivel_Permisos": result[3],
                "rol": result[4],
                "success": True,
            }

            session["user_id"] = result[0]
            session["user_data"] = user_data
            session.permanent = True

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


@app.route("/api/me", methods=["GET"])
def api_me():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "No hay sesión activa"}), 401
    return jsonify({"success": True, "user": user_data})


@app.route("/api/session/check", methods=["GET"])
def api_session_check():
    user_data = get_logged_user_data()
    return jsonify({"success": bool(user_data), "authenticated": bool(user_data), "user": user_data or None})


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
                    vw.ID_oferta,
                    lo.Id_estado,
                    vw.Numero_oferta,
                    vw.Fecha_email,
                    vw.Fecha_alta_oferta,
                    vw.Ref_cliente_asunto_email,
                    lo.Id_cliente,
                    vw.Cliente,
                    vw.Observaciones_oferta,
                    STRING_AGG(ISNULL(vw.Tipo_interaccion, ''), ' | ') AS Tipos_interaccion,
                    STRING_AGG(CONVERT(VARCHAR(19), vw.Fecha_interaccion, 120), ' | ') AS Fechas_interaccion,
                    STRING_AGG(ISNULL(vw.Observaciones_interaccion, ''), ' | ') AS Observaciones_interaccion,
                    vw.Estado
                FROM ofertas.vw_Listado_Ofertas_Interacciones vw
                INNER JOIN ofertas.Listado_Ofertas lo
                    ON lo.ID_oferta = vw.ID_oferta
            """
            params = []

            if estado_id is not None:
                query += " WHERE lo.Id_estado = ?"
                params.append(estado_id)

            query += """
                GROUP BY
                    vw.ID_oferta,
                    lo.Id_estado,
                    vw.Numero_oferta,
                    vw.Fecha_email,
                    vw.Fecha_alta_oferta,
                    vw.Ref_cliente_asunto_email,
                    lo.Id_cliente,
                    vw.Cliente,
                    vw.Observaciones_oferta,
                    vw.Estado
                ORDER BY vw.ID_oferta DESC
            """
            cursor.execute(query, tuple(params))

            ofertas = [
                {
                    "id_oferta": row[0],
                    "id_estado": row[1],
                    "numero_oferta": row[2],
                    "fecha_email": serialize_date(row[3]),
                    "fecha_alta_oferta": serialize_date(row[4]),
                    "ref_cliente_asunto_email": row[5],
                    "id_cliente": row[6],
                    "cliente": row[7],
                    "observaciones": row[8],
                    "observaciones_oferta": row[8],
                    "interaction_types": row[9],
                    "interaction_dates": serialize_interaction_date_list(row[10]),
                    "interaction_observaciones": row[11],
                    "estado": row[12],
                    "ID_oferta": row[0],
                    "Numero_oferta": row[2],
                    "Fecha_email": serialize_date(row[3]),
                    "Fecha_alta_oferta": serialize_date(row[4]),
                    "Ref_cliente_asunto_email": row[5],
                    "Cliente": row[7],
                    "Observaciones_oferta": row[8],
                    "Tipo_interaccion": row[9],
                    "Fecha_interaccion": serialize_interaction_date_list(row[10]),
                    "Observaciones_interaccion": row[11],
                    "Estado": row[12],
                }
                for row in cursor.fetchall()
            ]

        return jsonify({"success": True, "ofertas": ofertas})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudieron consultar las ofertas: {str(exc)}"}), 500


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
        cliente_resolution = None
        with db_connection(autocommit=True) as conn:
            cursor = conn.cursor()
            try:
                cliente_resolution = resolve_cliente_from_email(cursor, parsed_email.get("sender_email"))
            except Exception as exc:
                app.logger.exception("Error al resolver cliente desde correo importado: %s", exc)
                cliente_resolution = {
                    "sender_email": parsed_email.get("sender_email"),
                    "domain": None,
                    "domain_root": None,
                    "cliente": None,
                }

        matched_cliente = (cliente_resolution or {}).get("cliente")
        fecha_email = parsed_email.get("received_at")
        fecha_alta = datetime.now().date()

        message_parts = ["Correo importado correctamente."]
        if matched_cliente:
            message_parts.append(f"Cliente detectado: {matched_cliente['descripcion_cliente']}.")
        elif cliente_resolution and cliente_resolution.get("domain"):
            message_parts.append(f"No se encontró cliente para el dominio {cliente_resolution['domain']}.")

        return jsonify(
            {
                "success": True,
                "message": " ".join(message_parts),
                "data": {
                    "id_cliente": matched_cliente["id_cliente"] if matched_cliente else None,
                    "cliente": matched_cliente["descripcion_cliente"] if matched_cliente else None,
                    "sender_email": parsed_email.get("sender_email"),
                    "domain": (cliente_resolution or {}).get("domain"),
                    "fecha_email": fecha_email.date().isoformat() if isinstance(fecha_email, datetime) else (fecha_email.isoformat() if fecha_email else None),
                    "fecha_alta_oferta": fecha_alta.isoformat(),
                    "ref_cliente_asunto_email": parsed_email.get("subject"),
                    "observaciones": parsed_email.get("body"),
                },
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
                    lo.ID_oferta,
                    lo.Numero_oferta,
                    lo.Id_estado,
                    e.Descripcion_estado,
                    lo.Fecha_email,
                    lo.Fecha_alta_oferta,
                    lo.Ref_cliente_asunto_email,
                    lo.Id_cliente,
                    lo.Observaciones
                FROM ofertas.Listado_Ofertas lo
                LEFT JOIN ofertas.Estados e
                    ON e.Id_estado = lo.Id_estado
                WHERE lo.ID_oferta = ?
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
                "interacciones": [],
            }

            cursor.execute(
                """
                SELECT
                    Tipo_interaccion,
                    Fecha_interaccion,
                    Observaciones
                FROM ofertas.Oferta_Interacciones
                WHERE ID_oferta = ?
                ORDER BY Fecha_interaccion DESC, ID_interaccion DESC
                """,
                (oferta_id,),
            )

            oferta["interacciones"] = [
                {
                    "tipo_interaccion": interaction_row[0],
                    "fecha_interaccion": interaction_row[1].isoformat() if interaction_row[1] else None,
                    "observaciones": interaction_row[2],
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

    data = request.get_json(silent=True) or {}

    try:
        payload = build_oferta_update_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT 1 FROM ofertas.Estados WHERE Id_estado = ?", (payload["id_estado"],))
            if cursor.fetchone() is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            if payload["id_cliente"] is not None:
                cursor.execute("SELECT 1 FROM ofertas.Clientes WHERE Id_cliente = ?", (payload["id_cliente"],))
                if cursor.fetchone() is None:
                    conn.rollback()
                    return jsonify({"success": False, "message": "Cliente no encontrado"}), 404

            cursor.execute(
                """
                UPDATE ofertas.Listado_Ofertas
                SET Id_estado = ?,
                    Fecha_email = ?,
                    Fecha_alta_oferta = ?,
                    Ref_cliente_asunto_email = ?,
                    Id_cliente = ?,
                    Observaciones = ?
                WHERE ID_oferta = ?
                """,
                (
                    payload["id_estado"],
                    payload["fecha_email"],
                    payload["fecha_alta_oferta"],
                    payload["ref_cliente_asunto_email"],
                    payload["id_cliente"],
                    payload["observaciones"],
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


@app.route("/api/ofertas/<int:oferta_id>/estado", methods=["POST"])
def update_oferta_estado(oferta_id):
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para actualizar el estado de la oferta"}), 401

    data = request.get_json(silent=True) or {}

    try:
        payload = build_oferta_estado_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT
                    lo.ID_oferta,
                    lo.Id_estado,
                    e.Descripcion_estado
                FROM ofertas.Listado_Ofertas lo
                LEFT JOIN ofertas.Estados e
                    ON e.Id_estado = lo.Id_estado
                WHERE lo.ID_oferta = ?
                """,
                (oferta_id,),
            )
            oferta_row = cursor.fetchone()

            if not oferta_row:
                conn.rollback()
                return jsonify({"success": False, "message": "Oferta no encontrada"}), 404

            previous_estado_id = oferta_row[1]
            previous_estado = (oferta_row[2] or "Sin estado").strip()

            cursor.execute(
                "SELECT Descripcion_estado FROM ofertas.Estados WHERE Id_estado = ?",
                (payload["id_estado"],),
            )
            next_estado_row = cursor.fetchone()
            if next_estado_row is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado siguiente no encontrado"}), 404

            if previous_estado_id == payload["id_estado"]:
                conn.rollback()
                return jsonify({"success": False, "message": "Debes seleccionar un estado distinto al actual"}), 400

            next_estado = (next_estado_row[0] or "Sin estado").strip()
            interaction_date = datetime.now()
            interaction_type = f"{previous_estado} -> {next_estado}"

            cursor.execute(
                """
                UPDATE ofertas.Listado_Ofertas
                SET Id_estado = ?
                WHERE ID_oferta = ?
                """,
                (payload["id_estado"], oferta_id),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Oferta no encontrada"}), 404

            cursor.execute(
                """
                INSERT INTO ofertas.Oferta_Interacciones (
                    ID_oferta,
                    Tipo_interaccion,
                    Fecha_interaccion,
                    Observaciones
                )
                VALUES (?, ?, ?, ?)
                """,
                (oferta_id, interaction_type, interaction_date, payload["comentario"]),
            )

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Estado actualizado correctamente",
                "fecha_interaccion": interaction_date.isoformat(),
                "tipo_interaccion": interaction_type,
                "estado_anterior": previous_estado,
                "estado_siguiente": next_estado,
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
                SELECT Id_cliente, Descripcion_cliente, dominio
                FROM ofertas.Clientes
                ORDER BY Descripcion_cliente ASC
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
                INSERT INTO ofertas.Clientes (Descripcion_cliente, dominio)
                OUTPUT INSERTED.Id_cliente
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
                UPDATE ofertas.Clientes
                SET Descripcion_cliente = ?, dominio = ?
                WHERE Id_cliente = ?
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
                    e.Id_estado,
                    e.Descripcion_estado,
                    e.Orden,
                    ISNULL(o.total_ofertas, 0) AS Total_ofertas
                FROM ofertas.Estados e
                LEFT JOIN (
                    SELECT Id_estado, COUNT(*) AS total_ofertas
                    FROM ofertas.Listado_Ofertas
                    GROUP BY Id_estado
                ) o
                    ON o.Id_estado = e.Id_estado
                ORDER BY
                    CASE WHEN e.Orden IS NULL THEN 1 ELSE 0 END,
                    e.Orden ASC,
                    e.Descripcion_estado ASC
                """
            )
            estados = [
                {
                    "id_estado": row[0],
                    "descripcion_estado": row[1],
                    "orden": row[2],
                    "total_ofertas": row[3],
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

    data = request.get_json(silent=True) or {}

    try:
        payload = build_estado_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if estado_exists(cursor, payload["descripcion_estado"]):
                return jsonify({"success": False, "message": "Ya existe un estado con esa descripción"}), 409

            if payload["orden"] is None:
                cursor.execute("SELECT ISNULL(MAX(Orden), 0) + 1 FROM ofertas.Estados")
                next_order_row = cursor.fetchone()
                payload["orden"] = next_order_row[0] if next_order_row and next_order_row[0] is not None else 1

            cursor.execute(
                """
                INSERT INTO ofertas.Estados (Descripcion_estado, Orden)
                OUTPUT INSERTED.Id_estado
                VALUES (?, ?)
                """,
                (payload["descripcion_estado"], payload["orden"]),
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

    data = request.get_json(silent=True) or {}

    try:
        payload = build_estado_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()

            if estado_exists(cursor, payload["descripcion_estado"], excluded_id=estado_id):
                return jsonify({"success": False, "message": "Ya existe un estado con esa descripción"}), 409

            cursor.execute(
                """
                UPDATE ofertas.Estados
                SET Descripcion_estado = ?, Orden = ?
                WHERE Id_estado = ?
                """,
                (payload["descripcion_estado"], payload["orden"], estado_id),
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

    items = (request.get_json(silent=True) or {}).get("orden", [])
    if not isinstance(items, list) or not items:
        return jsonify({"success": False, "message": "Payload inválido: se espera {orden: [{id_estado, orden}]}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            for item in items:
                cursor.execute(
                    "UPDATE ofertas.Estados SET Orden = ? WHERE Id_estado = ?",
                    (int(item["orden"]), int(item["id_estado"])),
                )
            conn.commit()
        return jsonify({"success": True, "message": "Orden actualizado"})
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
                "SELECT 1 FROM ofertas.Estados WHERE Id_estado = ?",
                (estado_id,),
            )
            if cursor.fetchone() is None:
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            cursor.execute(
                """
                SELECT Id_config, Id_estado, Columna, Descripcion_columna, Orden_columna
                FROM ofertas.ConfiguracionColumnas
                WHERE Id_estado = ?
                ORDER BY ISNULL(Orden_columna, 2147483647), Id_config ASC
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

    data = request.get_json(silent=True) or {}
    available_column_map = get_available_offer_column_map()

    try:
        columnas = data.get("columnas") if isinstance(data.get("columnas"), list) else None
        if columnas:
            columnas = [normalize_offer_column_name(normalize_required_text(column, "Columna", 100)) for column in columnas]
            payload = {
                "columna": columnas[0],
                "descripcion_columna": normalize_optional_text(data.get("descripcion_columna"), 255),
                "orden_columna": normalize_optional_int(data.get("orden_columna"), "Orden columna"),
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
        return jsonify({"success": False, "message": f"Columnas no válidas: {', '.join(invalid_columns)}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT 1 FROM ofertas.Estados WHERE Id_estado = ?",
                (estado_id,),
            )
            if cursor.fetchone() is None:
                conn.rollback()
                return jsonify({"success": False, "message": "Estado no encontrado"}), 404

            cursor.execute(
                "SELECT ISNULL(MAX(Orden_columna), 0) FROM ofertas.ConfiguracionColumnas WHERE Id_estado = ?",
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
                    INSERT INTO ofertas.ConfiguracionColumnas (Id_estado, Columna, Descripcion_columna, Orden_columna)
                    OUTPUT INSERTED.Id_config
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
                "message": "Columna de configuración creada correctamente",
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

    data = request.get_json(silent=True) or {}
    available_column_map = get_available_offer_column_map()

    try:
        payload = build_configuracion_columna_payload(data)
        payload["columna"] = normalize_offer_column_name(payload["columna"])
        id_estado = normalize_required_int(data.get("id_estado"), "Id_estado")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    if payload["columna"] is None:
        return jsonify({"success": False, "message": "La columna indicada ya no existe en la estructura actual"}), 400

    if payload["columna"] not in available_column_map:
        return jsonify({"success": False, "message": f"Columna no válida: {payload['columna']}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT 1 FROM ofertas.Estados WHERE Id_estado = ?",
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
                UPDATE ofertas.ConfiguracionColumnas
                SET Id_estado = ?,
                    Columna = ?,
                    Descripcion_columna = ?,
                    Orden_columna = ?
                WHERE Id_config = ?
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
                "message": "Columna de configuración actualizada correctamente",
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

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM ofertas.ConfiguracionColumnas WHERE Id_config = ?",
                (config_id,),
            )

            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": "Configuración de columna no encontrada"}), 404

            conn.commit()

        return jsonify({"success": True, "message": "Columna de configuración eliminada correctamente"})
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo eliminar la columna de configuración: {str(exc)}"}), 500


@app.route("/api/configuracion-columnas/reorder", methods=["POST"])
def reorder_configuracion_columnas():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para reordenar columnas de configuración"}), 401

    items = (request.get_json(silent=True) or {}).get("orden", [])
    if not isinstance(items, list) or not items:
        return jsonify({"success": False, "message": "Payload inválido: se espera {orden: [{id_config, orden_columna}]}"}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            for item in items:
                cursor.execute(
                    "UPDATE ofertas.ConfiguracionColumnas SET Orden_columna = ? WHERE Id_config = ?",
                    (int(item["orden_columna"]), int(item["id_config"])),
                )
            conn.commit()

        return jsonify({"success": True, "message": "Orden de columnas actualizado"})
    except (KeyError, TypeError, ValueError) as exc:
        return jsonify({"success": False, "message": f"Datos inválidos: {str(exc)}"}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo reordenar la configuración de columnas: {str(exc)}"}), 500


@app.route("/api/ofertas", methods=["POST"])
def create_oferta():
    user_data = get_logged_user_data()
    if not user_data:
        return jsonify({"success": False, "message": "Debes iniciar sesión para guardar una oferta"}), 401

    data = request.get_json(silent=True) or {}

    try:
        payload = build_oferta_payload(data)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        with db_connection(autocommit=False) as conn:
            cursor = conn.cursor()
            # OUTPUT directo no funciona cuando la tabla tiene triggers activos.
            # Se usa tabla temporal para capturar el ID insertado.
            cursor.execute("CREATE TABLE #inserted_oferta (ID_oferta INT)")
            cursor.execute(
                """
                INSERT INTO ofertas.Listado_Ofertas (
                    Fecha_email,
                    Fecha_alta_oferta,
                    Ref_cliente_asunto_email,
                    Id_cliente,
                    Observaciones
                )
                OUTPUT INSERTED.ID_oferta INTO #inserted_oferta
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    payload["fecha_email"],
                    payload["fecha_alta_oferta"],
                    payload["ref_cliente_asunto_email"],
                    payload["id_cliente"],
                    payload["observaciones"],
                ),
            )
            cursor.execute("SELECT ID_oferta FROM #inserted_oferta")
            inserted = cursor.fetchone()
            inserted_id = inserted[0] if inserted else None

            numero_oferta = None
            if inserted_id is not None:
                cursor.execute(
                    "SELECT Numero_oferta FROM ofertas.Listado_Ofertas WHERE ID_oferta = ?",
                    (inserted_id,),
                )
                numero_row = cursor.fetchone()
                numero_oferta = numero_row[0] if numero_row else None

            conn.commit()

        return jsonify(
            {
                "success": True,
                "message": "Oferta guardada correctamente",
                "id_oferta": inserted_id,
                "numero_oferta": numero_oferta,
            }
        )
    except RuntimeError as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    except Exception as exc:
        return jsonify({"success": False, "message": f"No se pudo guardar la oferta: {str(exc)}"}), 500


def create_app():
    return app


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=app.config["APP_PORT"], debug=app.config["DEBUG"])
