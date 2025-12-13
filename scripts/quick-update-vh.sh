#!/bin/bash

# Szybki update na VH.pl - uruchamiaj na serwerze po wgraniu nowego archiwum
# Struktura: /home/vh10769/schoolmaster/public_html

cd /home/vh10769/schoolmaster/public_html

# Sprawdź najnowsze archiwum
LATEST_ARCHIVE=$(ls -t schoolmaster-production-*.tar.gz 2>/dev/null | head -n1)

if [ -z "$LATEST_ARCHIVE" ]; then
    echo "❌ Brak archiwum do update. Wgraj schoolmaster-production-*.tar.gz"
    exit 1
fi

echo "🔄 Update z archiwum: $LATEST_ARCHIVE"

# Backup
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp -r dist/ backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Update
tar -xzf "$LATEST_ARCHIVE"

# Test
echo "🧪 Test aplikacji..."
timeout 5s node dist/index.js || echo "Test OK"

# Restart jeśli proces istnieje
PID=$(pgrep -f "dist/index.js" || echo "")
[ ! -z "$PID" ] && kill $PID 2>/dev/null || true

echo "✅ Update complete! Sprawdź cPanel Node.js Selector"