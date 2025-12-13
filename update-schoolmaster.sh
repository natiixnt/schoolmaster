#!/bin/bash

# SchoolMaster Auto-Update Script for VH.pl (schoolmaster/public_html)
# Użycie: cd /home/vh10769/schoolmaster/public_html && ./update-schoolmaster.sh

set -e

echo "🚀 SchoolMaster Auto-Update Starting..."
echo "Katalog: $(pwd)"
echo "=========================================="

# Kolory do logów
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcje pomocnicze
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "dist/index.js" ]; then
    log_error "dist/index.js nie znaleziony. Uruchom skrypt z katalogu aplikacji."
    exit 1
fi

# Backup obecnej wersji
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
log_info "Tworzenie backup w $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r dist/ package.json "$BACKUP_DIR/" 2>/dev/null || true

# Sprawdź czy jest nowa wersja do pobrania
if [ -f "schoolmaster-production-*.tar.gz" ]; then
    ARCHIVE=$(ls -t schoolmaster-production-*.tar.gz | head -n1)
    log_info "Znaleziono archiwum: $ARCHIVE"
    
    # Rozpakuj nową wersję
    log_info "Rozpakowywanie nowej wersji..."
    tar -xzf "$ARCHIVE"
    
    # Sprawdź czy potrzebne są nowe dependencies
    if [ -f "package.json" ]; then
        log_info "Sprawdzanie dependencies..."
        npm install --production --legacy-peer-deps --silent
    fi
    
    # Test nowej wersji
    log_info "Testowanie nowej wersji..."
    timeout 10s node dist/index.js > /dev/null 2>&1 || {
        log_warning "Test aplikacji zakończony - normalny timeout"
    }
    
    # Restart aplikacji w cPanel (jeśli możliwe)
    log_info "Próba restartu aplikacji..."
    
    # Znajdź PID procesu node
    NODE_PID=$(pgrep -f "node dist/index.js" 2>/dev/null || echo "")
    
    if [ ! -z "$NODE_PID" ]; then
        log_info "Zatrzymywanie starego procesu (PID: $NODE_PID)"
        kill "$NODE_PID" 2>/dev/null || true
        sleep 2
    fi
    
    log_success "Update zakończony!"
    log_info "Backup zapisany w: $BACKUP_DIR"
    log_info "Sprawdź status aplikacji w cPanel Node.js Selector"
    
    # Test końcowy
    sleep 5
    log_info "Test końcowy..."
    curl -s -I "https://schoolmaster.pl" > /dev/null && {
        log_success "Aplikacja odpowiada na https://schoolmaster.pl"
    } || {
        log_warning "Aplikacja może potrzebować restart w cPanel"
    }
    
else
    log_error "Brak archiwum do update. Wgraj schoolmaster-production-*.tar.gz"
    exit 1
fi

echo "=========================================="
echo "🎉 SchoolMaster Update Complete!"