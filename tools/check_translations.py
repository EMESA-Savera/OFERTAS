from __future__ import annotations

import json
import sys
from pathlib import Path


TRANSLATION_DIR = Path(__file__).resolve().parents[1] / "static" / "translations"
TRANSLATION_FILES = {
    "es": TRANSLATION_DIR / "es.json",
    "en": TRANSLATION_DIR / "en.json",
    "cs": TRANSLATION_DIR / "cs.json",
}


def load_translation_file(path: Path) -> dict[str, str]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data, dict):
        raise ValueError(f"{path} no contiene un objeto JSON de primer nivel")

    normalized: dict[str, str] = {}
    for key, value in data.items():
        if not isinstance(key, str):
            raise ValueError(f"{path} contiene una clave no textual: {key!r}")
        if not isinstance(value, str):
            raise ValueError(f"{path} contiene un valor no textual para {key!r}")
        normalized[key] = value

    return normalized


def main() -> int:
    translations = {language: load_translation_file(path) for language, path in TRANSLATION_FILES.items()}
    all_keys = sorted({key for values in translations.values() for key in values})
    has_errors = False

    print("Translation key parity check")
    print(f"Directory: {TRANSLATION_DIR}")
    print(f"Total unique keys: {len(all_keys)}")

    for language, values in translations.items():
        missing = [key for key in all_keys if key not in values]
        extra = [key for key in values if key not in all_keys]

        print(f"\n[{language}] keys: {len(values)}")
        if missing:
          has_errors = True
          print(f"  Missing keys ({len(missing)}):")
          for key in missing:
              print(f"    - {key}")
        else:
          print("  Missing keys: none")

        if extra:
          has_errors = True
          print(f"  Extra keys ({len(extra)}):")
          for key in extra:
              print(f"    + {key}")
        else:
          print("  Extra keys: none")

    if has_errors:
        print("\nResult: FAILED")
        return 1

    print("\nResult: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())