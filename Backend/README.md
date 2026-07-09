

### Backend Coding Standards
    variableNames = "Use Camel Case"
    
    def naming_functions_uses_lowercase_underscores:

    class ClassNamesUseCapitalCase:

    FilesAndFoldersUseCapitalCase.py

### Backend Environment & Virtualenv (recommended)

If you're running this project for the first time, it's recommended to use a Python virtual environment to keep dependencies isolated.

High-level steps (all platforms):

1. Navigate to the `Backend/` folder.
2. Create and activate a virtual environment (if you don't already have one).
3. Install dependencies from `requirements.txt` inside the venv.
4. Create or update your `.env` file with the secrets (see your team's secrets channel).
5. Run the Flask app from inside the virtual environment.

Notes about the `.env` file:
- Place a `.env` file in the root of `Backend/` with all required keys (ask your team for the exact contents).

macOS (zsh) — recommended workflow

1) Open a terminal and change to the Backend folder:

```bash
cd Backend
```

2) Check you have a suitable Python 3.x:

```bash
python3 --version
# or
which python3
```

3) Create a virtual environment (creates a directory named `.venv`):

```bash
python3 -m venv .venv
```

4) Activate the virtual environment (zsh / bash):

```bash
source .venv/bin/activate
```

5) Verify the venv is active and the interpreter is from `.venv`:

```bash
# Should show path inside the .venv directory
which python
echo "$VIRTUAL_ENV"
```

6) Upgrade packaging tools (optional but recommended):

```bash
pip install --upgrade pip setuptools wheel
```

7) Install project requirements:

```bash
pip install -r requirements.txt
```

8) Run the Flask app (still inside the activated venv):

```bash
python -m flask --app AHFULbackend run --debug
```

9) When you're done, deactivate the venv:

```bash
deactivate
```

Windows (PowerShell) — recommended workflow

1) Open PowerShell and change to the Backend folder:

```powershell
cd Backend
```

2) Create a virtual environment:

```powershell
python -m venv .venv
```

3) Activate the venv (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

4) Verify activation:

```powershell
where.exe python
echo $env:VIRTUAL_ENV
```

5) Upgrade pip and install dependencies:

```powershell
python -m pip install --upgrade pip setuptools wheel
pip install -r newReqs.txt
```

6) Run the Flask app:

```powershell
python -m flask --app AHFULbackend run --debug
```

Quick checks & troubleshooting

- If `python3` / `python` is missing or reports an older version, install a modern Python (3.8+) via your system package manager or use pyenv.
- If activation fails on Windows PowerShell with an execution policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` as admin (or follow your org policies).
- If `pip install -r requirements.txt` fails for a package with native extensions, ensure Xcode command line tools are installed on macOS: `xcode-select --install`.
- To confirm you're installing into the venv: run `pip --version` and check the path printed refers to the `.venv` directory.

Environment checklist (success criteria)

- `python --version` returns a valid Python 3.x inside the venv.
- `pip list` shows installed packages from `requirements.txt`.
- `python -m flask --app AHFULbackend run --debug` starts the app without import errors.

Optional for VSCode: Ctrl+Shft+P, Type 'Python: Select Interpreter', Find and select your .venv file


To cleanup your Non Virutal Env:
```bash
pip3 freeze > packages_to_remove.txt
cat packages_to_remove.txt  # Review what's being removed
pip3 uninstall -y -r packages_to_remove.txt
```


Congrats! If you start up the application and Google doesn't yell at you, you survived!

## Testing

This project uses pytest for integration tests that exercise the Services/Drivers against a MongoDB instance. The test suite expects a MongoDB instance with the fixtures referenced by the tests (object ids in `tests/test_routes.py`).

What the test fixture does
- A session-scoped pytest fixture automatically creates a minimal Flask app and pushes an app context.

Environment variables used by tests
- MONGODB_URI — required. The MongoDB connection URI used by tests and by the app.
- MONGODB_NAME — optional. If set, this will be used as the database name for both runtime and testing connections. 

Run tests locally (zsh)
```bash
# from the Backend Directory
pytest -q tests/test_routes.py
```

CI notes (GitHub Actions)
- The workflow `.github/workflows/RouteTesting.yml` has been updated: tests no longer start a background Flask server. The workflow sets `MONGODB_URI` and `MONGODB_NAME` from secrets and runs `pytest` with `PYTHONPATH` pointing at `Backend`.

Quality gates to run after making changes
- Lint / static checks: ensure no syntax errors (python -m pyflakes or your preferred linter).
- Unit / integration tests: run `pytest -q Backend/tests/test_routes.py` (or the subset you changed).
- Smoke test: import the backend services to ensure there are no import-time errors.
