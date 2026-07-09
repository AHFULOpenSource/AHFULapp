## Backend Setup

### Environment & Virtualenv (recommended)

If you're running this project for the first time, it's recommended to use a Python virtual environment to keep dependencies isolated.

### macOS (zsh)

1. Open a terminal and change to the Backend folder:

    ```bash
    cd Backend
    ```

2. Check you have a suitable Python 3.x:

    ```bash
    python3 --version
    ```

3. Create a virtual environment:

    ```bash
    python3 -m venv .venv
    ```

4. Activate it:

    ```bash
    source .venv/bin/activate
    ```

5. Verify activation:

    ```bash
    which python
    echo "$VIRTUAL_ENV"
    ```

6. Upgrade packaging tools (optional but recommended):

    ```bash
    pip install --upgrade pip setuptools wheel
    ```

7. Install project requirements:

    ```bash
    pip install -r requirements.txt
    ```

8. Run the Flask app:

    ```bash
    python -m flask --app AHFULbackend run --debug
    ```

9. When done, deactivate:

    ```bash
    deactivate
    ```

### Windows (PowerShell)

1. Open PowerShell and change to the Backend folder:

    ```powershell
    cd Backend
    ```

2. Create a virtual environment:

    ```powershell
    python -m venv .venv
    ```

3. Activate it:

    ```powershell
    .\.venv\Scripts\Activate.ps1
    ```

4. Verify activation:

    ```powershell
    where.exe python
    echo $env:VIRTUAL_ENV
    ```

5. Upgrade pip and install dependencies:

    ```powershell
    python -m pip install --upgrade pip setuptools wheel
    pip install -r newReqs.txt
    ```

6. Run the Flask app:

    ```powershell
    python -m flask --app AHFULbackend run --debug
    ```

### Environment Variables

Place a `.env` file in the root of `Backend/` with all required keys (ask your team for the exact contents).

### Troubleshooting

- If `python3`/`python` is missing or reports an older version, install Python 3.13+ via your system package manager or pyenv.
- If activation fails on Windows PowerShell with an execution policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` as admin (or follow your org policies).
- If `pip install -r requirements.txt` fails for a package with native extensions, ensure Xcode command line tools are installed on macOS: `xcode-select --install`.
- To confirm you're installing into the venv: run `pip --version` and check the path refers to the `.venv` directory.

### Environment Checklist (success criteria)

- `python --version` returns a valid Python 3.x inside the venv
- `pip list` shows installed packages from `requirements.txt`
- `python -m flask --app AHFULbackend run --debug` starts the app without import errors

### Optional: VSCode Interpreter

Press `Ctrl+Shift+P`, type `Python: Select Interpreter`, find and select your `.venv` file.

### Cleanup (non-virtual env)

```bash
pip3 freeze > packages_to_remove.txt
cat packages_to_remove.txt
pip3 uninstall -y -r packages_to_remove.txt
```
