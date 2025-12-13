#!/bin/bash

# Auto-deployment script for SchoolMaster
# Synchronizuje zmiany z Replit na produkcyjny serwer

set -e

# Konfiguracja (ustaw te zmienne)
PRODUCTION_SERVER="user@your-server.com"
PRODUCTION_PATH="/var/www/schoolmaster"
SSH_KEY_PATH="~/.ssh/id_rsa"

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚀 Auto-deployment do serwera produkcyjnego"
echo "==========================================="

# Sprawdź czy konfiguracja jest ustawiona
if [ "$PRODUCTION_SERVER" = "user@your-server.com" ]; then
    echo_error "Skonfiguruj najpierw zmienne PRODUCTION_SERVER, PRODUCTION_PATH w scripts/auto-deploy.sh"
    exit 1
fi

# Sprawdź połączenie SSH
echo_info "Sprawdzanie połączenia SSH..."
if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 "$PRODUCTION_SERVER" "echo 'Połączenie OK'" > /dev/null 2>&1; then
    echo_success "Połączenie SSH - OK"
else
    echo_error "Nie można połączyć się z serwerem przez SSH"
    echo_info "Sprawdź: $PRODUCTION_SERVER i klucz SSH: $SSH_KEY_PATH"
    exit 1
fi

# Build lokalny
echo_info "Budowanie aplikacji lokalnie..."
npm run build
echo_success "Aplikacja zbudowana"

# Synchronizacja plików (bez node_modules, .env, logs)
echo_info "Synchronizacja plików na serwer..."

rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.env*' \
    --exclude 'logs/' \
    --exclude '.git/' \
    --exclude 'backups/' \
    --exclude '*.log' \
    -e "ssh -i $SSH_KEY_PATH" \
    ./ "$PRODUCTION_SERVER:$PRODUCTION_PATH/"

echo_success "Pliki zsynchronizowane"

# Wykonaj update na serwerze produkcyjnym
echo_info "Wykonywanie update na serwerze produkcyjnym..."

ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" << EOF
cd $PRODUCTION_PATH

# Sprawdź czy aplikacja działa
if pm2 describe schoolmaster > /dev/null 2>&1; then
    echo "✅ Aplikacja działa - wykonuję graceful update"
    
    # Załaduj zmienne środowiskowe
    export \$(cat .env.production | grep -v '^#' | xargs) 2>/dev/null || true
    
    # Instaluj zależności jeśli package.json się zmienił
    npm install --production --silent
    
    # Migracje bazy danych
    npm run db:push
    
    # Graceful reload (zero-downtime)
    pm2 gracefulReload schoolmaster
    
    # Sprawdź czy wszystko działa
    sleep 5
    if pm2 describe schoolmaster | grep -q "online"; then
        echo "✅ Update zakończony pomyślnie"
        
        # Test czy API odpowiada
        PORT=\${PORT:-3000}
        if curl -f -s "http://localhost:\$PORT/api/subjects" > /dev/null; then
            echo "✅ API działa poprawnie"
        else
            echo "❌ API nie odpowiada - sprawdź logi"
            pm2 logs schoolmaster --lines 10
        fi
    else
        echo "❌ Problem z aplikacją po update"
        pm2 logs schoolmaster --lines 20
    fi
else
    echo "❌ Aplikacja nie jest uruchomiona - uruchom najpierw: ./scripts/deploy.sh production"
fi
EOF

echo_success "Auto-deployment ukończony!"
echo_info "Sprawdź status: ssh $PRODUCTION_SERVER 'cd $PRODUCTION_PATH && pm2 status'"