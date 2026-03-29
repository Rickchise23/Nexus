#!/bin/bash
# Nexus Security Pre-Deploy Check
echo "🔒 Security Check"
echo "=================="
ISSUES=0

echo "Checking for exposed secrets..."
SECRETS=$(grep -rn "sk-ant-\|sk_test_\|pk_test_\|eyJhbG\|PRIVATE_KEY\|password.*=.*['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ app/ 2>/dev/null | grep -v node_modules | grep -v ".env")
if [ ! -z "$SECRETS" ]; then
  echo "❌ SECRETS FOUND IN CODE:"; echo "$SECRETS"; ISSUES=$((ISSUES + 1))
else
  echo "✅ No secrets in source"
fi

echo "Checking .gitignore..."
if grep -q ".env" .gitignore 2>/dev/null; then
  echo "✅ .env in .gitignore"
else
  echo "❌ .env NOT in .gitignore"; ISSUES=$((ISSUES + 1))
fi

echo "Checking localStorage token storage..."
LS=$(grep -rn "localStorage.*token\|localStorage.*key\|localStorage.*secret" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ app/ 2>/dev/null)
if [ ! -z "$LS" ]; then
  echo "⚠️  localStorage tokens found:"; echo "$LS"; ISSUES=$((ISSUES + 1))
else
  echo "✅ No localStorage tokens"
fi

echo "Checking dangerouslySetInnerHTML..."
DSI=$(grep -rn "dangerouslySetInnerHTML" --include="*.tsx" --include="*.jsx" src/ app/ 2>/dev/null)
if [ ! -z "$DSI" ]; then
  echo "⚠️  dangerouslySetInnerHTML found — review for XSS"; echo "$DSI"
else
  echo "✅ No dangerouslySetInnerHTML"
fi

echo "Checking wildcard CORS..."
CORS=$(grep -rn "Access-Control-Allow-Origin.*\*\|cors({.*origin.*true\|cors()" --include="*.ts" --include="*.js" src/ app/ 2>/dev/null)
if [ ! -z "$CORS" ]; then
  echo "⚠️  Wildcard CORS:"; echo "$CORS"; ISSUES=$((ISSUES + 1))
else
  echo "✅ No wildcard CORS"
fi

if command -v npm &> /dev/null; then
  echo "Running npm audit (production, critical threshold)..."
  # Next 14.x may still report high-severity advisories fixed only in Next 15+/16; LAN self-host risk is usually acceptable until upgrade.
  if npm audit --production --audit-level=critical 2>/dev/null; then
    echo "✅ No critical npm vulnerabilities"
  else
    echo "❌ Critical npm vulnerabilities — run npm audit"
    ISSUES=$((ISSUES + 1))
  fi
fi

echo ""
echo "=================="
if [ $ISSUES -gt 0 ]; then
  echo "❌ $ISSUES issue(s) found. Fix before deploying."
  exit 1
else
  echo "✅ All checks passed."
  exit 0
fi
