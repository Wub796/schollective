#!/usr/bin/env python3
"""
Color migration pass 2:
  forest/emerald  →  obsidian/electric-indigo/warm-cream
Run from repo root: python3 scripts/recolor.py
"""
import re, os

ROOT = os.path.join(os.path.dirname(__file__), "..")
EXTS = {".tsx", ".ts", ".css"}

# ─── Palette map  (old forest/emerald  →  new obsidian/indigo) ────────────
#
# OLD                    NEW
# ─────────────────────  ─────────────────────────────────────────────────
# #0a0f09  forest base → #09090b  true obsidian
# #111a0e  dark forest → #111113  lifted card surface
# #162112  mid forest  → #18181b  card hover
# #1e2e18  light hover → #27272a  border-level surface
# #1a4732  accent sect → #312e81  deep indigo section
# #39d98a  emerald     → #818cf8  electric indigo / periwinkle
# #2d7a52  forest mid  → #6366f1  vivid indigo mid
# #f0ede6  warm ivory  → #fafaf9  warm white (barely off-white)
# #c8d8b0  sage green  → #a8b3cf  soft blue-grey secondary
# #6a8a60  muted olive → #52525b  muted zinc tertiary

REPLACEMENTS = [
    # hex
    ("#0a0f09", "#09090b"),
    ("#0A0F09", "#09090b"),
    ("#111a0e", "#111113"),
    ("#111A0E", "#111113"),
    ("#162112", "#18181b"),
    ("#1e2e18", "#27272a"),
    ("#1E2E18", "#27272a"),
    ("#1a4732", "#312e81"),
    ("#1A4732", "#312e81"),
    ("#39d98a", "#818cf8"),
    ("#39D98A", "#818cf8"),
    ("#2d7a52", "#6366f1"),
    ("#2D7A52", "#6366f1"),
    ("#f0ede6", "#fafaf9"),
    ("#F0EDE6", "#fafaf9"),
    ("#c8d8b0", "#a8b3cf"),
    ("#C8D8B0", "#a8b3cf"),
    ("#6a8a60", "#52525b"),
    ("#6A8A60", "#52525b"),
    # Tailwind utility classes using old accent
    ("bg-[#f0ede6]", "bg-[#fafaf9]"),
    ("text-[#f0ede6]", "text-[#fafaf9]"),
    ("bg-[#0a0f09]", "bg-[#09090b]"),
    ("text-[#0a0f09]", "text-[#09090b]"),
    ("border-[#39d98a]", "border-[#818cf8]"),
    ("bg-[#0d1527]", "bg-[#111113]"),
    ("bg-[#4ec9d4]", "bg-[#818cf8]"),
    ("text-[#4ec9d4]", "text-[#818cf8]"),
    ("bg-[#0d1527]", "bg-[#111113]"),
    ("bg-[#0f1526]", "bg-[#111113]"),
    # Inline style direct references (from hero CTA)
    ('"#39d98a"', '"#818cf8"'),
    ('"#0a0f09"', '"#09090b"'),
    ('"#111a0e"', '"#111113"'),
    ('"#f0ede6"', '"#fafaf9"'),
]

REGEX_REPLACEMENTS = [
    # emerald rgba(57, 217, 138, …) → indigo rgba(129, 140, 248, …)
    (r"rgba\(\s*57\s*,\s*217\s*,\s*138\s*,\s*([^)]+)\)",
     r"rgba(129, 140, 248, \1)"),
    # forest-green rgba(29, 100, 68, …) → deep-indigo rgba(99, 102, 241, …)
    (r"rgba\(\s*29\s*,\s*100\s*,\s*68\s*,\s*([^)]+)\)",
     r"rgba(99, 102, 241, \1)"),
    # forest base rgba(10, 15, 9, …) → obsidian rgba(9, 9, 11, …)
    (r"rgba\(\s*10\s*,\s*15\s*,\s*9\s*,\s*([^)]+)\)",
     r"rgba(9, 9, 11, \1)"),
    # forest surface rgba(14, 22, 12, …) → obsidian surface rgba(17, 17, 19, …)
    (r"rgba\(\s*14\s*,\s*22\s*,\s*12\s*,\s*([^)]+)\)",
     r"rgba(17, 17, 19, \1)"),
    # sage rgba(184, 208, 172, …) → blue-grey rgba(168, 179, 207, …)
    (r"rgba\(\s*184\s*,\s*208\s*,\s*172\s*,\s*([^)]+)\)",
     r"rgba(168, 179, 207, \1)"),
    # olive rgba(90, 122, 80, …) → zinc rgba(82, 82, 91, …)
    (r"rgba\(\s*90\s*,\s*122\s*,\s*80\s*,\s*([^)]+)\)",
     r"rgba(82, 82, 91, \1)"),
    # warm ivory rgba(240, 237, 230, …) → warm white rgba(250, 250, 249, …)
    (r"rgba\(\s*240\s*,\s*237\s*,\s*230\s*,\s*([^)]+)\)",
     r"rgba(250, 250, 249, \1)"),
]

def process_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    text = original
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    for pattern, repl in REGEX_REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    if text == original:
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return 1

SKIP = {".next", "node_modules", ".git"}
changed = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP]
    for fname in filenames:
        if os.path.splitext(fname)[1] not in EXTS:
            continue
        fpath = os.path.join(dirpath, fname)
        n = process_file(fpath)
        if n:
            print(f"  ✓  {os.path.relpath(fpath, ROOT)}")
            changed += 1

print(f"\nDone — {changed} file(s) updated.")
