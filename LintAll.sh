set -uo pipefail

# ── Paths ────────────────────────────────────────────────────────────────
scriptDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

backendDir="$scriptDir/Backend"
frontendDir="$scriptDir/Frontend"

pylintrc="$backendDir/LintingScripts/.pylintrc"
pascalScript="$backendDir/LintingScripts/CheckPascalCase.py"
eslintConfig="$frontendDir/eslint.config.cjs"

backendStatus=0
frontendStatus=0

# ── Backend: PascalCase check ───────────────────────────────────────────
echo "── Checking Backend PascalCase naming ───────────────────────────────"
python3 "$pascalScript" "$backendDir"
pascalStatus=$?

# ── Backend: pylint ──────────────────────────────────────────────────────
echo ""
echo "── Running pylint on Backend ────────────────────────────────────────"
pylint --rcfile="$pylintrc" "$backendDir"
pylintStatus=$?

if [ $pascalStatus -ne 0 ] || [ $pylintStatus -ne 0 ]; then
    backendStatus=1
fi

# ── Frontend: eslint ─────────────────────────────────────────────────────
echo ""
echo "── Running eslint on Frontend ───────────────────────────────────────"
( cd "$frontendDir" && npx eslint --config "$eslintConfig" . )
frontendStatus=$?

# ── Summary ──────────────────────────────────────────────────────────────
echo ""
echo "── Summary ───────────────────────────────────────────────────────────"
if [ $backendStatus -ne 0 ]; then
    echo "❌ Backend checks failed (PascalCase exit: $pascalStatus, pylint exit: $pylintStatus)"
else
    echo "✅ Backend checks passed"
fi

if [ $frontendStatus -ne 0 ]; then
    echo "❌ Frontend checks failed (eslint exit: $frontendStatus)"
else
    echo "✅ Frontend checks passed"
fi

if [ $backendStatus -ne 0 ] || [ $frontendStatus -ne 0 ]; then
    exit 1
fi

exit 0