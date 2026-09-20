#!/usr/bin/env python3
"""Validate a previously built Phase 1 manifest and immutable source lock."""

from __future__ import annotations

import json
import sys

from build_phase1 import LOCK_PATH, MANIFEST_PATH, REPORT_PATH, duplicate_groups, source_files, validate, write_json


def main() -> int:
    if not LOCK_PATH.exists() or not MANIFEST_PATH.exists():
        raise SystemExit("Build artifacts are missing. Run build_phase1.py first.")
    lock = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    report = validate(manifest["assets"], lock, duplicate_groups(source_files()))
    write_json(REPORT_PATH, report)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
