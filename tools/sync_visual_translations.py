from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable


ROOT_DIR = Path(__file__).resolve().parents[1]
TRANSLATION_DIR = ROOT_DIR / "static" / "translations"
TRANSLATION_FILES = {
    "es": TRANSLATION_DIR / "es.json",
    "en": TRANSLATION_DIR / "en.json",
    "cs": TRANSLATION_DIR / "cs.json",
}
DEFAULT_INVENTORY_PATH = ROOT_DIR / "data" / "i18n_visual_inventory.json"
DEFAULT_INCLUDE_DIRS = ("api", "static", "templates")
DEFAULT_INCLUDE_FILES = ("index.html",)
SUPPORTED_SUFFIXES = {".html", ".js", ".py"}
IGNORED_DIR_NAMES = {
    ".git",
    ".venv",
    "__pycache__",
    "build",
    "certificados_ofertas",
    "data",
    "dist",
    "excel",
    "node_modules",
}
IGNORED_FILE_NAMES = {"i18n_visual_inventory.json"}
VISIBLE_ATTRIBUTE_CONTEXTS = {
    "placeholder": "placeholder",
    "title": "title",
    "aria-label": "aria_label",
}
VISIBLE_TEXT_TAGS = {
    "a",
    "button",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "label",
    "legend",
    "li",
    "option",
    "p",
    "small",
    "span",
    "strong",
    "td",
    "th",
}
NON_VISIBLE_HTML_TAGS = {"script", "style"}
WORD_RE = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñČčĚěŠšŘřŽžÝý]+")
WHITESPACE_RE = re.compile(r"\s+")
T_CALL_RE = re.compile(
    r"\bt\(\s*(?P<key>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")"
    r"(?:\s*,\s*(?P<fallback>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"))?",
    re.MULTILINE,
)
TRANSLATE_CALL_RE = re.compile(
    r"\btranslate\(\s*(?P<key>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")(?P<rest>[^\)]{0,240})\)",
    re.MULTILINE,
)
JS_VISUAL_LITERAL_PATTERNS = {
    "text_assignment": re.compile(
        r"(?:textContent|innerText|placeholder|title|ariaLabel)\s*=\s*"
        r"(?P<literal>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")",
        re.MULTILINE,
    ),
    "object_label": re.compile(
        r"\b(?:label|text|title|message|emptyMessage)\s*:\s*"
        r"(?P<literal>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")",
        re.MULTILINE,
    ),
    "return_literal": re.compile(
        r"\breturn\s+(?P<literal>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")\s*;",
        re.MULTILINE,
    ),
}
PY_VISUAL_LITERAL_PATTERNS = {
    "dict_message": re.compile(
        r"['\"](?:message|detail|title|label|placeholder)['\"]\s*:\s*"
        r"(?P<literal>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")",
        re.MULTILINE,
    ),
    "jsonify_message": re.compile(
        r"\bjsonify\([^\)]*?(?P<literal>'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")[^\)]*\)",
        re.MULTILINE,
    ),
}


@dataclass
class KeyOccurrence:
    file: str
    source: str
    context: str
    fallback: str


@dataclass
class RawOccurrence:
    file: str
    source: str
    context: str
    text: str
    generated_key: str


@dataclass
class Catalog:
    keyed: dict[str, list[KeyOccurrence]] = field(default_factory=dict)
    raw: list[RawOccurrence] = field(default_factory=list)

    def add_keyed(self, key: str, occurrence: KeyOccurrence) -> None:
        self.keyed.setdefault(key, []).append(occurrence)

    def add_raw(self, occurrence: RawOccurrence) -> None:
        self.raw.append(occurrence)


def normalize_text(value: str | None) -> str:
    collapsed = WHITESPACE_RE.sub(" ", str(value or "")).strip()
    return collapsed


def looks_like_visible_text(value: str | None) -> bool:
    text = normalize_text(value)
    if not text:
        return False
    if "{{" in text or "{%" in text or "}}" in text or "%}" in text:
        return False
    if text.startswith(("/", "#", ".", "http://", "https://")):
        return False
    if text.startswith(("data:", "mailto:")):
        return False
    if not WORD_RE.search(text):
        return False
    return True


def slugify(value: str, max_length: int = 48) -> str:
    lowered = normalize_text(value).lower()
    lowered = re.sub(r"[^a-z0-9]+", "_", lowered)
    lowered = lowered.strip("_") or "text"
    return lowered[:max_length].strip("_") or "text"


def decode_literal(literal: str) -> str:
    if len(literal) < 2:
        return literal
    try:
        value = ast.literal_eval(literal)
    except (SyntaxError, ValueError):
        inner = literal[1:-1]
        return inner.replace("\\'", "'").replace('\\"', '"').replace("\\n", "\n")
    return value if isinstance(value, str) else str(value)


def relative_posix(path: Path) -> str:
    return path.relative_to(ROOT_DIR).as_posix()


def generate_auto_key(file_path: Path, context: str, text: str) -> str:
    relative = relative_posix(file_path)
    path_part = re.sub(r"[^a-z0-9]+", ".", relative.lower()).strip(".")
    digest = hashlib.sha1(f"{relative}|{context}|{text}".encode("utf-8")).hexdigest()[:8]
    return f"auto.{path_part}.{context}.{slugify(text)}.{digest}"


def choose_source_text(occurrences: Iterable[KeyOccurrence]) -> str:
    for occurrence in occurrences:
        if looks_like_visible_text(occurrence.fallback):
            return normalize_text(occurrence.fallback)
    return ""


def load_translations() -> dict[str, dict[str, str]]:
    translations: dict[str, dict[str, str]] = {}
    for language, path in TRANSLATION_FILES.items():
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict):
            raise ValueError(f"{path} no contiene un objeto JSON de primer nivel")
        translations[language] = {str(key): str(value) for key, value in data.items()}
    return translations


def dump_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


class VisualHtmlParser(HTMLParser):
    def __init__(self, file_path: Path, catalog: Catalog) -> None:
        super().__init__(convert_charrefs=True)
        self.file_path = file_path
        self.catalog = catalog
        self.stack: list[dict[str, object]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {name: value for name, value in attrs}
        frame = {
            "tag": tag.lower(),
            "attrs": attr_map,
            "text_parts": [],
            "key": attr_map.get("data-translate-key"),
        }
        self.stack.append(frame)

        for attr_name, context in VISIBLE_ATTRIBUTE_CONTEXTS.items():
            translate_attr = f"data-translate-key-{attr_name}"
            if attr_map.get(translate_attr):
                self.catalog.add_keyed(
                    str(attr_map[translate_attr]),
                    KeyOccurrence(
                        file=relative_posix(self.file_path),
                        source="html",
                        context=context,
                        fallback=normalize_text(attr_map.get(attr_name)),
                    ),
                )
            elif looks_like_visible_text(attr_map.get(attr_name)):
                text = normalize_text(attr_map.get(attr_name))
                self.catalog.add_raw(
                    RawOccurrence(
                        file=relative_posix(self.file_path),
                        source="html",
                        context=context,
                        text=text,
                        generated_key=generate_auto_key(self.file_path, context, text),
                    )
                )

        if attr_map.get("data-translate-key-value"):
            self.catalog.add_keyed(
                str(attr_map["data-translate-key-value"]),
                KeyOccurrence(
                    file=relative_posix(self.file_path),
                    source="html",
                    context="value",
                    fallback=normalize_text(attr_map.get("value")),
                ),
            )
        elif tag.lower() in {"button", "input", "option"} and looks_like_visible_text(attr_map.get("value")):
            text = normalize_text(attr_map.get("value"))
            self.catalog.add_raw(
                RawOccurrence(
                    file=relative_posix(self.file_path),
                    source="html",
                    context="value",
                    text=text,
                    generated_key=generate_auto_key(self.file_path, "value", text),
                )
            )

    def handle_data(self, data: str) -> None:
        if not self.stack:
            return
        current = self.stack[-1]
        tag = str(current["tag"])
        if tag in NON_VISIBLE_HTML_TAGS:
            return
        normalized = normalize_text(data)
        if not normalized:
            return
        current["text_parts"].append(normalized)
        if self._has_translated_ancestor():
            return
        if tag in VISIBLE_TEXT_TAGS and looks_like_visible_text(normalized):
            self.catalog.add_raw(
                RawOccurrence(
                    file=relative_posix(self.file_path),
                    source="html",
                    context="text",
                    text=normalized,
                    generated_key=generate_auto_key(self.file_path, "text", normalized),
                )
            )

    def handle_endtag(self, tag: str) -> None:
        if not self.stack:
            return
        frame = self.stack.pop()
        joined_text = normalize_text(" ".join(frame["text_parts"]))
        key = frame.get("key")
        if key:
            self.catalog.add_keyed(
                str(key),
                KeyOccurrence(
                    file=relative_posix(self.file_path),
                    source="html",
                    context="text",
                    fallback=joined_text,
                ),
            )
        if self.stack and joined_text:
            self.stack[-1]["text_parts"].append(joined_text)

    def _has_translated_ancestor(self) -> bool:
        return any(frame.get("key") for frame in self.stack[:-1])


def collect_project_files() -> list[Path]:
    files: list[Path] = []

    for include_dir in DEFAULT_INCLUDE_DIRS:
        root = ROOT_DIR / include_dir
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if path.name in IGNORED_FILE_NAMES:
                continue
            if any(part in IGNORED_DIR_NAMES for part in path.parts):
                continue
            if path.suffix.lower() in SUPPORTED_SUFFIXES:
                files.append(path)

    for file_name in DEFAULT_INCLUDE_FILES:
        path = ROOT_DIR / file_name
        if path.exists() and path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES:
            files.append(path)

    unique_files = sorted({path.resolve() for path in files})
    return [Path(path) for path in unique_files]


def scan_html_file(file_path: Path, text: str, catalog: Catalog) -> None:
    parser = VisualHtmlParser(file_path, catalog)
    parser.feed(text)
    parser.close()


def scan_js_file(file_path: Path, text: str, catalog: Catalog) -> None:
    for pattern, source_name in ((T_CALL_RE, "js.t"), (TRANSLATE_CALL_RE, "js.translate")):
        for match in pattern.finditer(text):
            key = normalize_text(decode_literal(match.group("key")))
            if not key:
                continue
            fallback_literal = match.groupdict().get("fallback")
            if not fallback_literal and source_name == "js.translate":
                rest = match.groupdict().get("rest") or ""
                literals = re.findall(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"", rest)
                if literals:
                    fallback_literal = literals[-1]
            fallback = normalize_text(decode_literal(fallback_literal)) if fallback_literal else ""
            catalog.add_keyed(
                key,
                KeyOccurrence(
                    file=relative_posix(file_path),
                    source=source_name,
                    context="js_call",
                    fallback=fallback,
                ),
            )

    for context, pattern in JS_VISUAL_LITERAL_PATTERNS.items():
        for match in pattern.finditer(text):
            literal = match.group("literal")
            value = normalize_text(decode_literal(literal))
            if not looks_like_visible_text(value):
                continue
            catalog.add_raw(
                RawOccurrence(
                    file=relative_posix(file_path),
                    source="js",
                    context=context,
                    text=value,
                    generated_key=generate_auto_key(file_path, context, value),
                )
            )


def scan_python_file(file_path: Path, text: str, catalog: Catalog) -> None:
    for context, pattern in PY_VISUAL_LITERAL_PATTERNS.items():
        for match in pattern.finditer(text):
            literal = match.group("literal")
            value = normalize_text(decode_literal(literal))
            if not looks_like_visible_text(value):
                continue
            catalog.add_raw(
                RawOccurrence(
                    file=relative_posix(file_path),
                    source="python",
                    context=context,
                    text=value,
                    generated_key=generate_auto_key(file_path, context, value),
                )
            )


def build_catalog(files: Iterable[Path]) -> Catalog:
    catalog = Catalog()
    for file_path in files:
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        if file_path.suffix.lower() == ".html":
            scan_html_file(file_path, text, catalog)
        elif file_path.suffix.lower() == ".js":
            scan_js_file(file_path, text, catalog)
        elif file_path.suffix.lower() == ".py":
            scan_python_file(file_path, text, catalog)
    return catalog


def dedupe_raw_occurrences(raw_occurrences: Iterable[RawOccurrence]) -> dict[str, RawOccurrence]:
    deduped: dict[str, RawOccurrence] = {}
    for occurrence in raw_occurrences:
        deduped.setdefault(occurrence.generated_key, occurrence)
    return deduped


def sync_translations(
    translations: dict[str, dict[str, str]],
    catalog: Catalog,
    *,
    copy_source_to_all_languages: bool,
) -> dict[str, list[str]]:
    discovered_keys = set(catalog.keyed)
    raw_by_key = dedupe_raw_occurrences(catalog.raw)
    discovered_keys.update(raw_by_key)
    missing: dict[str, list[str]] = {language: [] for language in translations}

    for key in sorted(discovered_keys):
        source_text = ""
        if key in catalog.keyed:
            source_text = choose_source_text(catalog.keyed[key])
        if not source_text and key in raw_by_key:
            source_text = normalize_text(raw_by_key[key].text)

        for language, values in translations.items():
            if key in values:
                continue
            if language == "es":
                values[key] = source_text or key
            elif copy_source_to_all_languages:
                values[key] = source_text or translations["es"].get(key, key)
            else:
                values[key] = translations["es"].get(key, source_text or key)
            missing[language].append(key)

    for language, values in translations.items():
        ordered = {key: values[key] for key in sorted(values)}
        translations[language] = ordered

    return missing


def build_inventory(
    catalog: Catalog,
    translations: dict[str, dict[str, str]],
    missing: dict[str, list[str]],
) -> dict[str, object]:
    raw_by_key = dedupe_raw_occurrences(catalog.raw)
    keyed_entries = []
    for key in sorted(catalog.keyed):
        occurrences = catalog.keyed[key]
        keyed_entries.append(
            {
                "key": key,
                "source_text": choose_source_text(occurrences),
                "occurrences": [
                    {
                        "file": occurrence.file,
                        "source": occurrence.source,
                        "context": occurrence.context,
                        "fallback": occurrence.fallback,
                    }
                    for occurrence in occurrences
                ],
                "present_in": {language: key in values for language, values in translations.items()},
            }
        )

    raw_entries = []
    for key in sorted(raw_by_key):
        occurrence = raw_by_key[key]
        raw_entries.append(
            {
                "generated_key": key,
                "text": occurrence.text,
                "file": occurrence.file,
                "source": occurrence.source,
                "context": occurrence.context,
                "present_in": {language: key in values for language, values in translations.items()},
            }
        )

    return {
        "summary": {
            "files_scanned": len(collect_project_files()),
            "keyed_entries": len(keyed_entries),
            "raw_entries": len(raw_entries),
            "missing_by_language": {language: len(keys) for language, keys in missing.items()},
        },
        "keyed_entries": keyed_entries,
        "raw_entries": raw_entries,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Inventaria textos visibles del proyecto, compara las claves i18n encontradas "
            "con es/en/cs y da de alta las faltantes."
        )
    )
    parser.add_argument(
        "--inventory",
        type=Path,
        default=DEFAULT_INVENTORY_PATH,
        help="Ruta del JSON donde se guardará el inventario visual.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="No escribe los JSON de traducción; solo genera el inventario y resume faltantes.",
    )
    parser.add_argument(
        "--no-copy-source-to-all-languages",
        action="store_true",
        help=(
            "Cuando falta una clave en en/cs, reutiliza primero el valor de es en lugar de copiar "
            "el texto fuente detectado."
        ),
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    files = collect_project_files()
    catalog = build_catalog(files)
    translations = load_translations()
    missing = sync_translations(
        translations,
        catalog,
        copy_source_to_all_languages=not args.no_copy_source_to_all_languages,
    )
    inventory = build_inventory(catalog, translations, missing)
    dump_json(args.inventory, inventory)

    if not args.check:
        for language, path in TRANSLATION_FILES.items():
            dump_json(path, translations[language])

    print("Visual i18n synchronization")
    print(f"Files scanned: {len(files)}")
    print(f"Keyed entries: {len(catalog.keyed)}")
    print(f"Raw visual entries: {len(dedupe_raw_occurrences(catalog.raw))}")
    print(f"Inventory: {args.inventory}")
    for language, keys in missing.items():
        print(f"[{language}] missing added: {len(keys)}")
        for key in keys[:20]:
            print(f"  - {key}")
        if len(keys) > 20:
            print(f"  ... {len(keys) - 20} more")

    return 1 if args.check and any(missing.values()) else 0


if __name__ == "__main__":
    raise SystemExit(main())