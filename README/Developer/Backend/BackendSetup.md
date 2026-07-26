## Backend Setup

### External Requirements

- **Python** (version 3.13+ required)
  - Download from: https://www.python.org/downloads/
  - **Windows**: Download the installer and check "Add Python to PATH" during installation
  - **macOS**: Download the installer or use Homebrew: `brew install python@3.13`
  - **Linux**: Use your package manager (e.g. `sudo apt install python3.13 python3.13-venv`)
  - Verify installation:
    ```bash
    python --version    # Windows
    python3 --version   # macOS / Linux
    ```
- **pip** (ships with Python 3.4+, no separate install needed)
  - Verify:
    ```bash
    pip --version       # Windows
    pip3 --version      # macOS / Linux
    ```
- **Git** (for cloning the repository)
  - Download from: https://git-scm.com/downloads
  - Verify:
    ```bash
    git --version
    ```
- **MongoDB** (required for local testing; production uses an externally hosted instance)
  - Download from: https://www.mongodb.com/try/download/community
  - Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
- Internet connection (for pip packages and API connections)

### Environment & Virtualenv (recommended)

Using a Python virtual environment keeps dependencies isolated per project.

- **Navigate to the Backend folder**
  ```bash
  cd Backend
  ```

- **Create a virtual environment** (creates a directory named `.venv`)
  ```bash
  python3 -m venv .venv    # macOS / Linux
  python -m venv .venv     # Windows
  ```

- **Activate the virtual environment**
  - **macOS / Linux** (zsh/bash):
    ```bash
    source .venv/bin/activate
    ```
    You should see `(.venv)` appear at the start of your terminal prompt.
  - **Windows** (PowerShell):
    ```powershell
    .\.venv\Scripts\Activate.ps1
    ```
    If you get an execution policy error, run PowerShell as Administrator and execute:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

- **Verify activation** (both should show paths inside the `.venv` directory)
  - **macOS / Linux**:
    ```bash
    which python
    echo "$VIRTUAL_ENV"
    ```
  - **Windows**:
    ```powershell
    where.exe python
    echo $env:VIRTUAL_ENV
    ```

- **Upgrade packaging tools** (optional but recommended)
  ```bash
  pip install --upgrade pip setuptools wheel
  ```

- **Install project requirements** (downloads all packages listed in `requirements.txt`)
  ```bash
  pip install -r requirements.txt
  ```

- **Run the Flask app** (starts the development server)
  ```bash
  python -m flask --app AHFULbackend run --debug
  ```
  The app will be accessible at `https://www.ahful.app`.

- **Deactivate when done**
  ```bash
  deactivate
  ```

### Environment Variables

Place a `.env` file in the root of `Backend/` with all required keys. Ask your team for the exact contents. Typical keys include:

- `MONGODB_URI` -- MongoDB connection string
- `MONGODB_NAME` -- Database name
- `SECRET_KEY` -- Flask secret key
- Google OAuth credentials
- Firebase credentials

### Troubleshooting

- **Python not found**: If `python3`/`python` is missing, download Python 3.13+ from https://www.python.org/downloads/
- **Python version too old**: If the version is below 3.13, install a newer version. On macOS, use Homebrew: `brew install python@3.13`. On Windows, download the latest installer.
- **Windows activation policy error**: Run PowerShell as Administrator and execute `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **pip install fails for native extensions (macOS)**: Install Xcode command line tools: `xcode-select --install`
- **Verify you're installing into the venv**: Run `pip --version` and check the path refers to the `.venv` directory

### Environment Checklist (success criteria)

- `python --version` returns Python 3.13 or higher inside the venv
- `pip list` shows installed packages from `requirements.txt`
- `python -m flask --app AHFULbackend run --debug` starts the app without import errors
- The app is accessible at `https://www.ahful.app`

### Optional: VSCode Interpreter

Press `Ctrl+Shift+P`, type `Python: Select Interpreter`, find and select your `.venv` file.

### Cleanup (non-virtual env)

If you installed packages globally by accident:

```bash
pip3 freeze > packages_to_remove.txt
cat packages_to_remove.txt
pip3 uninstall -y -r packages_to_remove.txt
```
