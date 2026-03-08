#!/usr/bin/env python3
import sys
import io

# Fix Windows console encoding for emoji/unicode output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

"""
validate_skills.py - Automated validation for Human Skill Tree SKILL.md files.

Scans all skills/*/SKILL.md files and checks each one for:
  - Presence of all 7 required sections (H1 title, Description, Triggers,
    Methodology, Instructions, Examples, References)
  - Minimum content length / item count for each section
  - Absence of stub markers
  - Minimum total line count

Exit code:
  0  All files pass all REQUIRED checks (sections present).
  1  One or more files are missing a required section.

Usage:
  python scripts/validate_skills.py              # summary report
  python scripts/validate_skills.py --verbose     # detailed per-file report
"""

import argparse
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Optional


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REQUIRED_SECTIONS = [
    "Description",
    "Triggers",
    "Methodology",
    "Instructions",
    "Examples",
    "References",
]

# Quality thresholds (not hard failures, but reported as warnings)
MIN_DESCRIPTION_CHARS = 50
MIN_TRIGGER_ITEMS = 3
MIN_METHODOLOGY_ITEMS = 3
MIN_INSTRUCTIONS_CHARS = 200
MIN_EXAMPLE_COUNT = 1      # at least one ### Example or **User** line
MIN_REFERENCE_ITEMS = 3
MIN_TOTAL_LINES = 80

STUB_MARKERS = [
    "\U0001f6a7",                        # construction emoji
    "Community contributions welcome",   # boilerplate stub text
]


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class CheckResult:
    """Outcome of a single validation check."""
    name: str
    passed: bool
    detail: str = ""
    required: bool = False  # if True, failure means CI exit-code 1


@dataclass
class SkillReport:
    """Full validation report for one SKILL.md file."""
    skill_dir: str          # e.g. "00-learning-how-to-learn"
    file_path: str
    checks: List[CheckResult] = field(default_factory=list)
    is_stub: bool = False

    @property
    def all_required_passed(self) -> bool:
        return all(c.passed for c in self.checks if c.required)

    @property
    def all_passed(self) -> bool:
        return all(c.passed for c in self.checks)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def extract_sections(text: str) -> Dict[str, str]:
    """
    Parse a Markdown file into a dict mapping H2 heading names to
    their body content (everything between one ## heading and the next).
    Also captures the H1 title under key '__title__'.
    """
    sections: Dict[str, str] = {}

    # Extract H1 title
    h1_match = re.search(r"^# (.+)$", text, re.MULTILINE)
    if h1_match:
        sections["__title__"] = h1_match.group(1).strip()

    # Split on H2 headings
    h2_pattern = re.compile(r"^## (.+)$", re.MULTILINE)
    matches = list(h2_pattern.finditer(text))

    for i, m in enumerate(matches):
        heading = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        sections[heading] = body

    return sections


def count_list_items(body: str) -> int:
    """Count lines that start with '- ' (Markdown unordered list items)."""
    return len(re.findall(r"^- ", body, re.MULTILINE))


def count_examples(body: str) -> int:
    """
    Count examples by looking for ### Example headings or **User** markers.
    Returns the greater of the two counts so either convention works.
    """
    h3_count = len(re.findall(r"^### Example", body, re.MULTILINE))
    user_count = len(re.findall(r"^\*\*User\*\*", body, re.MULTILINE))
    return max(h3_count, user_count)


def has_stub_markers(text: str) -> bool:
    """Return True if the file contains any known stub marker."""
    for marker in STUB_MARKERS:
        if marker in text:
            return True
    return False


# ---------------------------------------------------------------------------
# Core validation
# ---------------------------------------------------------------------------

def validate_skill(skill_dir: str, file_path: str) -> SkillReport:
    """Run all checks on a single SKILL.md file and return a report."""
    report = SkillReport(skill_dir=skill_dir, file_path=file_path)

    with open(file_path, "r", encoding="utf-8") as fh:
        text = fh.read()

    lines = text.splitlines()
    sections = extract_sections(text)

    # ----- 1. H1 title present (REQUIRED) -----
    has_title = "__title__" in sections
    report.checks.append(CheckResult(
        name="H1 title",
        passed=has_title,
        detail=sections.get("__title__", "(missing)"),
        required=True,
    ))

    # ----- 2-7. Required H2 sections (REQUIRED) -----
    for sec_name in REQUIRED_SECTIONS:
        present = sec_name in sections
        report.checks.append(CheckResult(
            name=f"## {sec_name}",
            passed=present,
            detail="present" if present else "MISSING",
            required=True,
        ))

    # ----- Quality checks (not required for CI pass) -----

    # Description length
    desc = sections.get("Description", "")
    desc_len = len(desc)
    report.checks.append(CheckResult(
        name="Description >= 50 chars",
        passed=desc_len >= MIN_DESCRIPTION_CHARS,
        detail=f"{desc_len} chars",
    ))

    # Trigger items
    triggers = sections.get("Triggers", "")
    trigger_count = count_list_items(triggers)
    report.checks.append(CheckResult(
        name="Triggers >= 3 items",
        passed=trigger_count >= MIN_TRIGGER_ITEMS,
        detail=f"{trigger_count} items",
    ))

    # Methodology items
    meth = sections.get("Methodology", "")
    meth_count = count_list_items(meth)
    report.checks.append(CheckResult(
        name="Methodology >= 3 items",
        passed=meth_count >= MIN_METHODOLOGY_ITEMS,
        detail=f"{meth_count} items",
    ))

    # Instructions length
    instr = sections.get("Instructions", "")
    instr_len = len(instr)
    report.checks.append(CheckResult(
        name="Instructions >= 200 chars",
        passed=instr_len >= MIN_INSTRUCTIONS_CHARS,
        detail=f"{instr_len} chars",
    ))

    # Examples count
    examples = sections.get("Examples", "")
    example_count = count_examples(examples)
    report.checks.append(CheckResult(
        name="Examples >= 1 example",
        passed=example_count >= MIN_EXAMPLE_COUNT,
        detail=f"{example_count} examples",
    ))

    # References count
    refs = sections.get("References", "")
    ref_count = count_list_items(refs)
    report.checks.append(CheckResult(
        name="References >= 3 items",
        passed=ref_count >= MIN_REFERENCE_ITEMS,
        detail=f"{ref_count} items",
    ))

    # Total lines
    line_count = len(lines)
    report.checks.append(CheckResult(
        name=f"Total lines >= {MIN_TOTAL_LINES}",
        passed=line_count >= MIN_TOTAL_LINES,
        detail=f"{line_count} lines",
    ))

    # Stub markers
    is_stub = has_stub_markers(text)
    report.is_stub = is_stub
    report.checks.append(CheckResult(
        name="No stub markers",
        passed=not is_stub,
        detail="contains stub marker" if is_stub else "clean",
    ))

    return report


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

def discover_skills(project_root: str) -> List[str]:
    """
    Find all skills/*/SKILL.md files under the project root.
    Returns a sorted list of absolute paths.
    """
    skills_dir = os.path.join(project_root, "skills")
    if not os.path.isdir(skills_dir):
        print(f"ERROR: skills directory not found at {skills_dir}", file=sys.stderr)
        sys.exit(2)

    results = []
    for entry in sorted(os.listdir(skills_dir)):
        skill_md = os.path.join(skills_dir, entry, "SKILL.md")
        if os.path.isfile(skill_md):
            results.append(skill_md)
    return results


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

PASS_ICON = "\u2705"   # green check
FAIL_ICON = "\u274c"   # red cross
WARN_ICON = "\u26a0\ufe0f"   # warning


def print_report(reports: List[SkillReport], verbose: bool = False) -> bool:
    """
    Print a human-readable validation report.
    Returns True if all REQUIRED checks passed across all files.
    """
    total = len(reports)
    complete = sum(1 for r in reports if not r.is_stub and r.all_passed)
    stubs = sum(1 for r in reports if r.is_stub)
    has_required_failure = any(not r.all_required_passed for r in reports)

    # Header
    print("=" * 70)
    print("  Human Skill Tree - SKILL.md Validation Report")
    print("=" * 70)
    print()

    # Per-file details
    for report in reports:
        status_label = "STUB" if report.is_stub else (
            "PASS" if report.all_passed else (
                "FAIL" if not report.all_required_passed else "WARN"
            )
        )
        icon = (FAIL_ICON if not report.all_required_passed
                else (WARN_ICON if not report.all_passed else PASS_ICON))

        print(f"{icon}  [{status_label}]  {report.skill_dir}")

        if verbose:
            for chk in report.checks:
                mark = PASS_ICON if chk.passed else (
                    FAIL_ICON if chk.required else WARN_ICON
                )
                req_tag = " [REQUIRED]" if chk.required and not chk.passed else ""
                print(f"      {mark}  {chk.name}: {chk.detail}{req_tag}")
            print()

    # Missing-section detail for files that have required failures
    # (always shown, even without --verbose)
    files_with_missing = [r for r in reports if not r.all_required_passed]
    if files_with_missing and not verbose:
        print()
        print("Files with MISSING required sections:")
        for report in files_with_missing:
            missing = [c.name for c in report.checks if c.required and not c.passed]
            print(f"  {FAIL_ICON}  {report.skill_dir}: {', '.join(missing)}")

    # Summary
    print()
    print("-" * 70)
    print(f"  Total skills scanned:   {total}")
    print(f"  Complete (all checks):  {complete}")
    print(f"  Stubs:                  {stubs}")
    print(f"  Partial (has warnings): {total - complete - stubs}")

    if has_required_failure:
        failing_count = len(files_with_missing)
        print()
        print(f"  {FAIL_ICON}  {failing_count} file(s) MISSING required sections  "
              f"-> exit code 1")
    else:
        print()
        print(f"  {PASS_ICON}  All required sections present in every file.")

    print("-" * 70)
    print()

    return not has_required_failure


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate SKILL.md files in the Human Skill Tree project."
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show per-check details for every file.",
    )
    parser.add_argument(
        "--root",
        default=None,
        help="Project root directory (auto-detected if omitted).",
    )
    args = parser.parse_args()

    # Determine project root
    if args.root:
        project_root = os.path.abspath(args.root)
    else:
        # Assume script lives in <root>/scripts/
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)

    print(f"Project root: {project_root}")
    print()

    # Discover and validate
    skill_files = discover_skills(project_root)
    if not skill_files:
        print("No SKILL.md files found!", file=sys.stderr)
        sys.exit(2)

    reports: List[SkillReport] = []
    for fpath in skill_files:
        skill_dir = os.path.basename(os.path.dirname(fpath))
        reports.append(validate_skill(skill_dir, fpath))

    # Print report and set exit code
    all_ok = print_report(reports, verbose=args.verbose)
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
