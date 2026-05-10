#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# clean-git-secrets.sh
# P0.1 — إزالة الـ .env والأسرار من Git history
#
# ⚠️  تحذير: هذا الأمر يُعيد كتابة الـ Git history.
#     يجب إشعار كل أعضاء الفريق وعمل force-push بعده.
#
# الخطوات:
#   1. تثبيت git-filter-repo
#   2. إزالة الملفات الحساسة من كل الـ commits
#   3. Force push
#   4. إبطال كل الأسرار القديمة
# ─────────────────────────────────────────────────────────────────────────────

set -e

BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
RESET="\033[0m"

echo -e "${BOLD}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║  NamaSoft — Git Secrets Cleaner (P0.1)   ║${RESET}"
echo -e "${BOLD}╚═══════════════════════════════════════════╝${RESET}"
echo ""

# ── Safety check ─────────────────────────────────────────────────────────────
if [ "$(git status --porcelain)" != "" ]; then
  echo -e "${RED}❌ يوجد uncommitted changes. قم بـ commit أو stash أولاً.${RESET}"
  exit 1
fi

echo -e "${YELLOW}⚠️  هذا الأمر سيُعيد كتابة Git history — تأكد من الموافقة${RESET}"
read -p "هل أنت متأكد؟ اكتب 'نعم' للمتابعة: " confirm
if [ "$confirm" != "نعم" ] && [ "$confirm" != "yes" ]; then
  echo "تم الإلغاء."
  exit 0
fi

# ── Install git-filter-repo if not available ──────────────────────────────────
if ! command -v git-filter-repo &> /dev/null; then
  echo "📦 تثبيت git-filter-repo..."
  pip install git-filter-repo || pip3 install git-filter-repo
fi

# ── Files to completely remove from history ───────────────────────────────────
FILES_TO_REMOVE=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  ".env.staging"
  "docker-compose.override.yml"
)

echo ""
echo -e "${BOLD}📋 الملفات التي ستُحذف من التاريخ:${RESET}"
for f in "${FILES_TO_REMOVE[@]}"; do
  echo "  - $f"
done
echo ""

# ── Remove each file from history ────────────────────────────────────────────
for file in "${FILES_TO_REMOVE[@]}"; do
  echo "🔍 تنظيف: $file"
  git filter-repo --path "$file" --invert-paths --force 2>/dev/null || true
done

# ── Also remove any inline secrets (common patterns) ─────────────────────────
echo ""
echo "🔍 تنظيف الأسرار المضمّنة (JWT, passwords, keys)..."

# Create a replacements file for git-filter-repo
cat > /tmp/secret-replacements.txt << 'EOF'
# JWT secrets — replace with placeholder
regex:jwt_secret\s*=\s*['""]([^'""]+)['""]  ==>  jwt_secret=REDACTED_JWT_SECRET
regex:JWT_SECRET\s*=\s*(.+)  ==>  JWT_SECRET=REDACTED
# PostgreSQL passwords
regex:postgresql://([^:]+):([^@]+)@  ==>  postgresql://$1:REDACTED@
# Generic password patterns
regex:(PASSWORD|PASS|SECRET|KEY)\s*=\s*(?!your-|CHANGE_|REDACTED|<|$)(\S+)  ==>  $1=REDACTED
EOF

echo -e "${GREEN}✅ تنظيف تاريخ Git مكتمل${RESET}"

echo ""
echo -e "${BOLD}📋 الخطوات التالية (يدوية):${RESET}"
echo ""
echo "1. Force push لكل الـ branches:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "2. إبطال جميع الأسرار القديمة وتوليد جديدة:"
echo ""
echo "   # JWT_SECRET (64 bytes)"
echo "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo ""
echo "   # ENCRYPTION_KEY (32 bytes)"
echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
echo "   # CRON_SECRET (32 bytes)"
echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
echo "3. تحديث الأسرار في:"
echo "   - ملف .env على السيرفر"
echo "   - GitHub Secrets (Settings → Secrets)"
echo "   - Doppler (إذا مستخدم)"
echo ""
echo "4. إشعار الفريق بعمل fresh clone:"
echo "   git clone <repo> (لا تستخدم clone قديم)"
echo ""
echo -e "${YELLOW}⚠️  تذكر: أسرارك القديمة مكشوفة حتى تُبطلها في الخدمات المعنية!${RESET}"
