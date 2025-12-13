#!/bin/bash

# Test Node.js setup na VH.pl
echo "🔍 Testing Node.js setup on VH.pl hosting..."

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

test_fail() {
    echo -e "${RED}✗ $1${NC}"
}

test_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo "=========================================="

# Test 1: Node.js version
echo "1. Sprawdzanie Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    test_success "Node.js zainstalowany: $NODE_VERSION"
    
    # Check version compatibility
    NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        test_success "Wersja Node.js kompatybilna (>= 18)"
    else
        test_warning "Wersja Node.js może być za stara ($NODE_VERSION)"
    fi
else
    test_fail "Node.js nie znaleziony"
    echo "Sprawdź czy Node.js jest dostępny na hostingu"
fi

# Test 2: NPM
echo ""
echo "2. Sprawdzanie NPM..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    test_success "NPM zainstalowany: $NPM_VERSION"
else
    test_fail "NPM nie znaleziony"
fi

# Test 3: Directory structure
echo ""
echo "3. Sprawdzanie struktury katalogów..."
if [ -d "/home/vh10769/schoolmaster/public_html" ]; then
    test_success "Katalog aplikacji istnieje"
    cd /home/vh10769/schoolmaster/public_html
    echo "   Katalog roboczy: $(pwd)"
else
    test_warning "Katalog aplikacji nie istnieje"
    echo "   Tworząc strukturę..."
    mkdir -p /home/vh10769/schoolmaster/public_html
    test_success "Struktura katalogów utworzona"
fi

# Test 4: Check if app files exist
echo ""
echo "4. Sprawdzanie plików aplikacji..."
if [ -f "dist/index.js" ]; then
    test_success "Plik serwera znaleziony (dist/index.js)"
    FILE_SIZE=$(du -h dist/index.js | cut -f1)
    echo "   Rozmiar: $FILE_SIZE"
else
    test_warning "Plik serwera nie znaleziony (dist/index.js)"
    echo "   Wgraj aplikację SchoolMaster"
fi

if [ -f "package.json" ]; then
    test_success "Package.json znaleziony"
else
    test_warning "Package.json nie znaleziony"
fi

# Test 5: Dependencies
echo ""
echo "5. Sprawdzanie dependencies..."
if [ -d "node_modules" ]; then
    test_success "Node_modules istnieje"
    MODULE_COUNT=$(ls node_modules | wc -l)
    echo "   Zainstalowanych modułów: $MODULE_COUNT"
else
    test_warning "Node_modules nie istnieje"
    echo "   Uruchom: npm install"
fi

# Test 6: Port availability
echo ""
echo "6. Sprawdzanie dostępności portu 3000..."
if netstat -tulpn 2>/dev/null | grep -q :3000; then
    test_warning "Port 3000 jest używany"
    echo "   Proces: $(netstat -tulpn 2>/dev/null | grep :3000)"
else
    test_success "Port 3000 dostępny"
fi

# Test 7: Database connection (if credentials available)
echo ""
echo "7. Test połączenia z bazą danych..."
if command -v psql &> /dev/null; then
    if psql -h localhost -U vh10769_school -d vh10769_schoolmaster -c "SELECT 1;" &>/dev/null; then
        test_success "Połączenie z bazą PostgreSQL działa"
    else
        test_warning "Nie można połączyć z bazą danych"
        echo "   Sprawdź credentials: vh10769_school / vh10769_schoolmaster"
    fi
else
    test_warning "PostgreSQL client nie znaleziony"
fi

# Test 8: Quick app test
echo ""
echo "8. Test uruchomienia aplikacji..."
if [ -f "dist/index.js" ]; then
    echo "   Testowanie aplikacji (5 sekund)..."
    timeout 5s node dist/index.js &>/dev/null && {
        test_success "Aplikacja uruchamia się bez błędów"
    } || {
        test_warning "Aplikacja może mieć problemy - sprawdź logi"
    }
else
    test_fail "Brak pliku aplikacji do testowania"
fi

echo ""
echo "=========================================="
echo "🎯 Test zakończony!"
echo ""
echo "Następne kroki:"
echo "1. Jeśli czerwone błędy - rozwiąż problemy"
echo "2. Wgraj aplikację SchoolMaster (jeśli brak)"
echo "3. Uruchom: npm install (jeśli brak node_modules)"
echo "4. Konfiguruj cPanel Node.js Selector"
echo "5. Test: curl https://schoolmaster.pl"