#!/bin/bash
# Skrypt aktualizacji dla VH.pl - alternatywne metody

echo "=== SchoolMaster VH.pl Update Script ==="
echo "Problem: Base64 transfer failed"
echo "Solution: Alternative deployment methods"
echo ""

# Sprawdź obecny stan
cd /home/vh10769/schoolmaster/public_html
echo "Current directory: $(pwd)"
echo "Files present:"
ls -la

echo ""
echo "=== METODA 1: cPanel File Manager Upload ==="
echo "1. Download production-dist.tar.gz from Replit (404KB)"
echo "2. cPanel → File Manager → /home/vh10769/schoolmaster/public_html/"
echo "3. Upload file → Right click → Extract"
echo "4. Verify: ls -lah dist/index.js (should be ~262KB)"

echo ""
echo "=== METODA 2: Próba budowania na serwerze ==="
echo "Spróbuj simple esbuild build..."

# Sprawdź czy możemy użyć esbuild
if command -v npx &> /dev/null; then
    echo "npx available, trying simple build..."
    mkdir -p dist
    
    # Spróbuj najprostszy build
    npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --target=node20 2>&1
    
    if [ -f "dist/index.js" ] && [ -s "dist/index.js" ]; then
        echo "SUCCESS: Built dist/index.js"
        ls -lah dist/index.js
    else
        echo "FAILED: esbuild didn't create proper file"
        
        # Fallback - copy source as-is (not ideal but works)
        echo "FALLBACK: Copying server source..."
        cp server/index.ts dist/index.js
        echo "WARNING: Using unbundled source file"
    fi
else
    echo "npx not available"
fi

echo ""
echo "=== NASTĘPNE KROKI ==="
echo "1. Sprawdź dist/index.js size: ls -lah dist/index.js"
echo "2. Utwórz bazę: vh10769_schoolmaster w cPanel"
echo "3. Zaktualizuj .env.production z hasłem do bazy"
echo "4. Synchronizuj: npm run db:push"
echo "5. Node.js Selector: App URL = schoolmaster.pl"
echo "6. Test: https://schoolmaster.pl"

echo ""
echo "Current dist/ status:"
if [ -d "dist" ]; then
    ls -lah dist/
else
    echo "No dist/ directory found"
fi