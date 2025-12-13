#!/bin/bash

# SchoolMaster Rollback Script
# Przywraca poprzednią wersję aplikacji

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

echo "⏪ SchoolMaster Rollback Process"
echo "==============================="

# Sprawdź czy istnieją backupy
if [ ! -d "backups" ] || [ -z "$(ls -A backups 2>/dev/null)" ]; then
    echo_error "Nie znaleziono backupów w katalogu backups/"
    exit 1
fi

# Pokaż dostępne backupy
echo_info "Dostępne backupy:"
ls -la backups/ | grep ^d | awk '{print $9}' | grep -v "^\.$" | grep -v "^\.\.$" | sort -r | head -10

echo ""
read -p "Podaj nazwę backupu do przywrócenia (format: YYYYMMDD_HHMMSS): " BACKUP_NAME

BACKUP_PATH="backups/$BACKUP_NAME"

if [ ! -d "$BACKUP_PATH" ]; then
    echo_error "Backup $BACKUP_NAME nie istnieje"
    exit 1
fi

echo_warning "Przywracanie backupu: $BACKUP_NAME"
echo_warning "To działanie jest nieodwracalne!"
read -p "Czy kontynuować? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo_info "Rollback anulowany"
    exit 0
fi

# Utwórz backup obecnego stanu
CURRENT_BACKUP="backups/before_rollback_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$CURRENT_BACKUP"

echo_info "Tworzenie backup obecnego stanu..."
cp -r dist "$CURRENT_BACKUP/" 2>/dev/null || true
cp package.json "$CURRENT_BACKUP/" 2>/dev/null || true
cp ecosystem.config.js "$CURRENT_BACKUP/" 2>/dev/null || true

# Backup bazy danych przed rollback
if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" > "$CURRENT_BACKUP/database.sql"
    echo_success "Backup bazy danych utworzony"
fi

# Przywróć pliki aplikacji
echo_info "Przywracanie plików aplikacji..."

if [ -d "$BACKUP_PATH/dist" ]; then
    rm -rf dist
    cp -r "$BACKUP_PATH/dist" .
    echo_success "Pliki aplikacji przywrócone"
fi

if [ -f "$BACKUP_PATH/package.json" ]; then
    # Sprawdź czy package.json się różni
    if ! cmp -s package.json "$BACKUP_PATH/package.json" 2>/dev/null; then
        echo_info "Przywracanie package.json i reinstalacja zależności..."
        cp "$BACKUP_PATH/package.json" .
        npm install --production
        echo_success "Zależności przywrócone"
    fi
fi

if [ -f "$BACKUP_PATH/ecosystem.config.js" ]; then
    cp "$BACKUP_PATH/ecosystem.config.js" .
    echo_success "Konfiguracja PM2 przywrócona"
fi

# Przywróć bazę danych (opcjonalnie)
if [ -f "$BACKUP_PATH/database.sql" ]; then
    echo_warning "Znaleziono backup bazy danych"
    read -p "Czy przywrócić także bazę danych? (yes/no): " RESTORE_DB
    
    if [ "$RESTORE_DB" = "yes" ]; then
        echo_info "Przywracanie bazy danych..."
        
        # Utwórz backup obecnej bazy
        if [ -n "$DATABASE_URL" ]; then
            pg_dump "$DATABASE_URL" > "$CURRENT_BACKUP/current_database.sql"
            
            # Przywróć backup bazy danych
            psql "$DATABASE_URL" < "$BACKUP_PATH/database.sql"
            echo_success "Baza danych przywrócona"
        else
            echo_error "DATABASE_URL nie jest ustawione"
        fi
    fi
fi

# Restart aplikacji
echo_info "Restart aplikacji..."
pm2 restart schoolmaster

# Sprawdź czy aplikacja działa
sleep 5

if pm2 describe schoolmaster | grep -q "online"; then
    echo_success "Aplikacja uruchomiona poprawnie"
else
    echo_error "Problem z uruchomieniem aplikacji po rollback"
    exit 1
fi

# Sprawdź czy aplikacja odpowiada
PORT=${PORT:-3000}
if curl -f -s "http://localhost:$PORT/api/subjects" > /dev/null; then
    echo_success "Aplikacja odpowiada poprawnie"
else
    echo_error "Aplikacja nie odpowiada po rollback"
    exit 1
fi

echo ""
echo_success "🎉 Rollback ukończony pomyślnie!"
echo ""
echo_info "Przywrócono backup: $BACKUP_NAME"
echo_info "Backup obecnego stanu utworzony w: $CURRENT_BACKUP"
echo ""
echo_info "Sprawdź status: pm2 status"
echo_info "Sprawdź logi: pm2 logs schoolmaster"