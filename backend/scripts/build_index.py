"""Build spatial index of lots that contain claim samples (Marcos Juárez focus)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.catalog import catalog  # noqa: E402


def main() -> None:
    print("Building index (this may take a few minutes on first run)...")
    meta = catalog.ensure_ready(force=True)
    print(meta)


if __name__ == "__main__":
    main()
