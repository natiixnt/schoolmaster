#!/bin/bash

# Deploy SchoolMaster to VH.pl - Complete automation
# Uruchom w środowisku Replit po zmianach w kodzie

set -e

echo "🔨 Building SchoolMaster for production..."

# Build aplikacji
npm run build

# Stwórz archiwum z datą
DATE=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="schoolmaster-production-${DATE}.tar.gz"

echo "📦 Creating deployment package: $ARCHIVE_NAME"

# Stwórz archiwum deployment
tar -czf "$ARCHIVE_NAME" \
    dist/ \
    package.json \
    INSTALACJA-VH-HOSTING-2025.md \
    QUICK-DEPLOY-COMMANDS.md \
    update-schoolmaster.sh

echo "✅ Package ready: $ARCHIVE_NAME ($(du -h "$ARCHIVE_NAME" | cut -f1))"

# Instrukcje dla użytkownika
cat << EOF

📋 INSTRUKCJE DEPLOY:

1. Pobierz plik: $ARCHIVE_NAME
2. Wgraj przez cPanel File Manager do /home/vh10769/
3. SSH do serwera i uruchom:

   ssh vh10769@vh10769.vh.pl
   cd /home/vh10769
   tar -xzf $ARCHIVE_NAME
   chmod +x update-schoolmaster.sh
   ./update-schoolmaster.sh

4. Restart aplikacji w cPanel Node.js Selector (jeśli potrzebne)

🔄 KOLEJNE UPDATE:
   - Wystarczy wgrać nowe archiwum i uruchomić: ./update-schoolmaster.sh

EOF

echo "🚀 Deployment package ready!"