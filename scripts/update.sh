#!/bin/bash

# SchoolMaster Update Script
# Aktualizacja aplikacji bez przerywania działania (zero-downtime deployment)

set -e

# Kolory dla output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔄 SchoolMaster Update Process"
echo "============================="

# Sprawdź czy aplikacja jest uruchomiona
if ! pm2 describe schoolmaster > /dev/null 2>&1; then
    echo_error "Aplikacja nie jest uruchomiona przez PM2"
    echo_info "Uruchom najpierw: pm2 start ecosystem.config.js --env production"
    exit 1
fi

# Sprawdź czy jest backup przed aktualizacją
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo_info "Tworzenie backup przed aktualizacją..."

# Backup bazy danych
if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"
    echo_success "Backup bazy danych utworzony"
else
    echo_warning "Nie można utworzyć backup bazy danych - upewnij się że pg_dump jest zainstalowane"
fi

# Backup plików aplikacji
cp -r dist "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/"
cp ecosystem.config.js "$BACKUP_DIR/"
echo_success "Backup plików aplikacji utworzony w $BACKUP_DIR"

# Git pull (jeśli używasz git)
if [ -d ".git" ]; then
    echo_info "Aktualizowanie kodu z repozytorium..."
    git stash push -m "Auto-stash before update $(date)"
    git pull origin main || git pull origin master
    echo_success "Kod zaktualizowany z repozytorium"
fi

# Sprawdź czy package.json się zmienił
PACKAGE_CHANGED=false
if ! cmp -s package.json "$BACKUP_DIR/package.json" 2>/dev/null; then
    PACKAGE_CHANGED=true
    echo_info "Wykryto zmiany w package.json - aktualizowanie zależności..."
    npm install --production
    echo_success "Zależności zaktualizowane"
fi

# Build nowej wersji
echo_info "Budowanie nowej wersji aplikacji..."
npm run build
echo_success "Aplikacja zbudowana"

# Sprawdź czy są migracje bazy danych
echo_info "Sprawdzanie migracji bazy danych..."
npm run db:push
echo_success "Baza danych zaktualizowana"

# Restart aplikacji z graceful reload
echo_info "Restart aplikacji (zero-downtime)..."

# PM2 graceful reload - aplikacja nie przestaje działać
pm2 gracefulReload schoolmaster

# Sprawdź czy aplikacja się uruchomiła poprawnie
sleep 5

if pm2 describe schoolmaster | grep -q "online"; then
    echo_success "Aplikacja uruchomiona poprawnie"
else
    echo_error "Problem z uruchomieniem aplikacji"
    
    # Rollback w przypadku problemu
    echo_warning "Przywracanie poprzedniej wersji..."
    
    if [ -d "$BACKUP_DIR/dist" ]; then
        rm -rf dist
        cp -r "$BACKUP_DIR/dist" .
        pm2 restart schoolmaster
        echo_success "Rollback wykonany"
    fi
    
    exit 1
fi

# Sprawdź czy aplikacja odpowiada
PORT=${PORT:-3000}
if curl -f -s "http://localhost:$PORT/api/subjects" > /dev/null; then
    echo_success "Aplikacja odpowiada poprawnie na porcie $PORT"
else
    echo_error "Aplikacja nie odpowiada"
    exit 1
fi

# Restart Nginx jeśli jest zainstalowany
if command -v nginx &> /dev/null; then
    if nginx -t > /dev/null 2>&1; then
        sudo systemctl reload nginx
        echo_success "Nginx przeładowany"
    fi
fi

# Wyczyść stare logi (zostaw ostatnie 7 dni)
find logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

echo ""
echo_success "🎉 Aktualizacja ukończona pomyślnie!"
echo ""
echo_info "Sprawdź status: pm2 status"
echo_info "Sprawdź logi: pm2 logs schoolmaster --lines 50"
echo ""
echo_info "Backup utworzony w: $BACKUP_DIR"
echo_warning "Usuń stare backupy gdy będziesz pewien że aktualizacja działa poprawnie"