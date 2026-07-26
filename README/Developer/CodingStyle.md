## Naming Conventions

| Element        | Convention  | Example                        |
|----------------|-------------|--------------------------------|
| Folders/files  | PascalCase  | `UserProfile.jsx`, `DataModels/`  |
| Variables      | camelCase   | `myCoolVariable = "foo"`       |
| Functions      | snake_case  | `def get_user_by_id():`        |
| Classes        | PascalCase  | `class ClassNamesUsePascalCase` |

These conventions are enforced by automated linting tools (see below).

## Linting

The project provides automated linting to enforce code quality and naming standards. You can run all checks at once, or run them individually per area.

### Run All Checks at Once

From the repository root:

```bash
bash LintAll.sh
```

This runs:
1. PascalCase naming check on the Backend
2. pylint on the Backend (using `.pylintrc`)
3. ESLint on the Frontend (using `eslint.config.cjs`)

### Run Backend Checks Separately

**PascalCase check** (files and folders must use PascalCase):

```bash
python3 Backend/LintingScripts/CheckPascalCase.py Backend/
```

**pylint** (code quality and naming enforcement):

```bash
pylint --rcfile=Backend/LintingScripts/.pylintrc Backend/
```

The `.pylintrc` configuration enforces:
- `camelCase` for variable and argument names
- `snake_case` for function and method names
- `PascalCase` for class and module names
- `UPPER_CASE` for constants
- Max 100 characters per line
- Other quality gates (max args, max locals, etc.)

### Run Frontend Checks Separately

**ESLint** (import resolution and naming conventions):

```bash
cd Frontend
npx eslint "src/**/*.{js,jsx,ts,tsx}"
```

The `eslint.config.cjs` configuration enforces:
- `pascalCase` filenames (with exceptions for config files, hooks, etc.)
- `camelCase` for JavaScript variables
- Resolved imports with case sensitivity
