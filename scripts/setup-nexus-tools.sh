#!/bin/bash
# ================================================================
# NEXUS TOOLCHAIN SETUP
# ================================================================
# Run this ONCE from your project root in Cursor's terminal.
# It installs Ralph, Vercel Skills, and the security checker.
#
# Usage: 
#   1. Open Cursor
#   2. Open your project (e.g., launchpad/)
#   3. Open the terminal (Ctrl + `)
#   4. Run: bash scripts/setup-nexus-tools.sh
#
# Or just tell Cursor: "run the setup script at scripts/setup-nexus-tools.sh"
# ================================================================

set -e
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       NEXUS TOOLCHAIN INSTALLER          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

PROJECT_ROOT=$(pwd)

# ── 1. Install Ralph ─────────────────────────────────────────────
echo "📦 [1/4] Installing Ralph (autonomous agent loop)..."
mkdir -p scripts/ralph

# Clone to temp, copy essentials, clean up
if [ -d "/tmp/ralph-source" ]; then rm -rf /tmp/ralph-source; fi
git clone --depth 1 https://github.com/snarktank/ralph.git /tmp/ralph-source 2>/dev/null

cp /tmp/ralph-source/ralph.sh scripts/ralph/
cp /tmp/ralph-source/CLAUDE.md scripts/ralph/
cp /tmp/ralph-source/prd.json.example scripts/ralph/
cp /tmp/ralph-source/prompt.md scripts/ralph/
chmod +x scripts/ralph/ralph.sh

# Install skills globally for Claude Code
mkdir -p ~/.claude/skills
cp -r /tmp/ralph-source/skills/prd ~/.claude/skills/ 2>/dev/null || true
cp -r /tmp/ralph-source/skills/ralph ~/.claude/skills/ 2>/dev/null || true

rm -rf /tmp/ralph-source
echo "   ✅ Ralph installed at scripts/ralph/"
echo "   ✅ PRD + Ralph skills installed globally"
echo ""

# ── 2. Install Vercel Agent Skills ───────────────────────────────
echo "📦 [2/4] Installing Vercel Agent Skills..."

# Check if npx is available
if command -v npx &> /dev/null; then
  # Install all Vercel skills globally for Claude Code
  npx -y skills add vercel-labs/agent-skills --all -g -a claude-code -y 2>/dev/null || {
    echo "   ⚠️  npx skills had an issue — trying individual installs..."
    npx -y skills add vercel-labs/agent-skills --skill frontend-design -g -a claude-code -y 2>/dev/null || true
    npx -y skills add vercel-labs/agent-skills --skill web-design-guidelines -g -a claude-code -y 2>/dev/null || true
    npx -y skills add vercel-labs/agent-skills --skill react-best-practices -g -a claude-code -y 2>/dev/null || true
    npx -y skills add vercel-labs/agent-skills --skill composition-patterns -g -a claude-code -y 2>/dev/null || true
  }
  echo "   ✅ Vercel skills installed (frontend-design, web-guidelines, react-best-practices, composition-patterns)"
else
  echo "   ⚠️  npx not found — install Node.js first, then re-run"
fi
echo ""

# ── 3. Install Security Checker ──────────────────────────────────
echo "📦 [3/4] Installing security pre-deploy checker..."

cat > scripts/security-check.sh << 'SECEOF'
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
  echo "Running npm audit..."
  AUDIT=$(npm audit --production 2>/dev/null | grep -c "high\|critical" || echo "0")
  if [ "$AUDIT" -gt 0 ]; then
    echo "⚠️  $AUDIT high/critical npm vulnerabilities"
    ISSUES=$((ISSUES + 1))
  else
    echo "✅ No critical npm vulnerabilities"
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
SECEOF

chmod +x scripts/security-check.sh
echo "   ✅ Security checker at scripts/security-check.sh"
echo ""

# ── 4. Update .cursorrules ───────────────────────────────────────
echo "📦 [4/4] Adding security rules to .cursorrules..."

# Only append if the security section doesn't already exist
if ! grep -q "SECURITY: Pre-Deploy Checklist" .cursorrules 2>/dev/null; then
  cat >> .cursorrules << 'RULESEOF'

## SECURITY: Pre-Deploy Checklist
Before shipping code, verify:
1. No secrets in client code (API keys, tokens, passwords)
2. No auth tokens in localStorage (use httpOnly cookies)
3. All API routes have auth middleware
4. Rate limiting on public endpoints
5. CORS configured with explicit domains (no wildcard *)
6. All user input validated on backend
7. No dangerouslySetInnerHTML without sanitization
8. Environment variables for all config
9. npm audit shows no critical vulnerabilities
10. Supabase RLS enabled on every table
Run `./scripts/security-check.sh` before every deploy.

## Ralph (Autonomous Agent Loop)
This project has Ralph installed at scripts/ralph/.
To run autonomous builds:
1. Create a PRD: describe features as user stories in prd.json
2. Run: ./scripts/ralph/ralph.sh --tool claude 15
3. Ralph loops: pick task → implement → test → commit → next task
4. Review the feature branch when done
Each story should be small enough for one context window.

## Quality Checks (used by Ralph and manual deploys)
- `npx tsc --noEmit` (TypeScript)
- `npx next lint` (ESLint)
- `./scripts/security-check.sh` (Security)
- `npm test` (Tests, if they exist)
RULESEOF
  echo "   ✅ Security + Ralph rules added to .cursorrules"
else
  echo "   ✅ .cursorrules already has security rules (skipped)"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║            SETUP COMPLETE ✅              ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  Ralph:     scripts/ralph/ralph.sh       ║"
echo "║  Security:  scripts/security-check.sh    ║"
echo "║  Skills:    ~/.claude/skills/            ║"
echo "║                                          ║"
echo "║  NEXT STEPS:                             ║"
echo "║  1. Try: ./scripts/security-check.sh     ║"
echo "║  2. Try Ralph on a small feature:        ║"
echo "║     - Create prd.json with 3 stories     ║"
echo "║     - ./scripts/ralph/ralph.sh            ║"
echo "║        --tool claude 5                   ║"
echo "║  3. Install jq if you don't have it:     ║"
echo "║     brew install jq                      ║"
echo "║                                          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
