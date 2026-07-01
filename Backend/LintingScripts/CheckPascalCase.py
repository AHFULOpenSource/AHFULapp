import os
import re
import sys

IGNORE_NAMES = {
    ".venv",
    "venv",
    "__pycache__",
    ".git",
    ".pytest_cache",
    "node_modules",
    "migrations",
    "tests",
    "conftest.py",
    "setup.py",
    "manage.py",
}

IGNORE_PATTERNS = [
    r"^__.*__$",       # dunder files/folders like __init__.py, __main__.py
    r"^\..*",           # dotfiles/dotfolders like .env, .pylintrc
    r".*\.pyc$",
]

SKIP_DESCEND = {
    ".venv",
    "venv",
    "__pycache__",
    ".git",
    ".pytest_cache",
    "node_modules",
    "migrations",
}

# ─────────────────────────────────────────────────────────────────────────────

PASCAL_CASE_RE = re.compile(r"^[A-Z][a-zA-Z0-9]*$")


def is_ignored(name):
    if name in IGNORE_NAMES:
        return True
    for pattern in IGNORE_PATTERNS:
        if re.match(pattern, name):
            return True
    return False


def check_name(name, is_file):
    """Return True if the name (stem only, no extension) is valid PascalCase."""
    stem = name[:-3] if is_file and name.endswith(".py") else name
    return bool(PASCAL_CASE_RE.match(stem))


def walk_and_check(root):
    violations = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Filter out directories we should never descend into (mutating
        # dirnames in place is how os.walk lets you prune the walk)
        dirnames[:] = [d for d in dirnames if d not in SKIP_DESCEND]

        # Check folder names (skip the root itself)
        if dirpath != root:
            folder_name = os.path.basename(dirpath)
            if not is_ignored(folder_name) and not check_name(folder_name, is_file=False):
                violations.append((dirpath, "folder"))

        # Check .py file names
        for fname in filenames:
            if not fname.endswith(".py"):
                continue
            if is_ignored(fname):
                continue
            if not check_name(fname, is_file=True):
                violations.append((os.path.join(dirpath, fname), "file"))

    return violations


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."

    violations = walk_and_check(root)

    if not violations:
        print("✅ All files and folders conform to PascalCase.")
        return 0

    print(f"❌ {len(violations)} PascalCase violation(s) found:\n")
    for path, kind in violations:
        print(f"  [{kind}] {path}")

    return 1


if __name__ == "__main__":
    sys.exit(main())
