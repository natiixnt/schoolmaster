#!/bin/bash

# SchoolMaster Deployment Script
# Użycie: ./scripts/deploy.sh [production|staging]

set -e

ENV=${1:-production}
echo "🚀 Rozpoczynam wdrożenie dla środowiska: $ENV"

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo_error "Node.js nie jest zainstalowany!"
    exit 1
fi

# Sprawdź czy npm jest zainstalowany
if ! command -v npm &> /dev/null; then
    echo_error "npm nie jest zainstalowany!"
    exit 1
fi

# Sprawdź wersję Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 18 ]; then
    echo_error "Wymagana jest wersja Node.js 18 lub wyższa. Aktualna: $(node -v)"
    exit 1
fi

echo_success "Node.js $(node -v) - OK"

# Sprawdź czy istnieje plik .env
if [ ! -f ".env.$ENV" ]; then
    echo_warning "Brak pliku .env.$ENV"
    echo_info "Tworzę przykładowy plik..."
    cat > ".env.$ENV" << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/schoolmaster"

# Session
SESSION_SECRET="your_super_secure_session_secret_at_least_32_characters_long"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Stripe (opcjonalne)
STRIPE_SECRET_KEY="sk_live_your_stripe_secret"
VITE_STRIPE_PUBLIC_KEY="pk_live_your_stripe_public"

# Environment
NODE_ENV="$ENV"
PORT="3000"

# Domain
DOMAIN="https://your-domain.com"
EOF
    echo_warning "⚠️  Wypełnij plik .env.$ENV przed kontynuowaniem!"
    exit 1
fi

echo_success "Plik .env.$ENV znaleziony"

# Załaduj zmienne środowiskowe
export $(cat .env.$ENV | grep -v '^#' | xargs)

# Sprawdź kluczowe zmienne
if [ -z "$DATABASE_URL" ]; then
    echo_error "DATABASE_URL nie jest ustawione w .env.$ENV"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo_error "SESSION_SECRET nie jest ustawione w .env.$ENV"
    exit 1
fi

echo_success "Zmienne środowiskowe - OK"

# Instalacja zależności
echo_info "Instalowanie zależności..."
npm install --silent
echo_success "Zależności zainstalowane"

# Build aplikacji
echo_info "Budowanie aplikacji..."
npm run build
echo_success "Aplikacja zbudowana"

# Sprawdź czy PostgreSQL jest dostępny
echo_info "Sprawdzanie połączenia z bazą danych..."
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo_success "Połączenie z bazą danych - OK"
    else
        echo_error "Nie można połączyć się z bazą danych"
        echo_info "Sprawdź DATABASE_URL w .env.$ENV"
        exit 1
    fi
else
    echo_warning "psql nie jest zainstalowane - pomijam test połączenia z bazą"
fi

# Migracja bazy danych
echo_info "Wykonywanie migracji bazy danych..."
npm run db:push
echo_success "Migracje wykonane"

# Sprawdź czy PM2 jest zainstalowany
if command -v pm2 &> /dev/null; then
    echo_info "PM2 znalezione - używam PM2 do zarządzania procesem"
    
    # Zatrzymaj istniejący proces
    pm2 stop schoolmaster 2>/dev/null || true
    pm2 delete schoolmaster 2>/dev/null || true
    
    # Uruchom nowy proces
    pm2 start ecosystem.config.js --env $ENV
    pm2 save
    
    echo_success "Aplikacja uruchomiona przez PM2"
    echo_info "Sprawdź status: pm2 status"
    echo_info "Sprawdź logi: pm2 logs schoolmaster"
    
else
    echo_warning "PM2 nie jest zainstalowane"
    echo_info "Instaluję PM2..."
    npm install -g pm2
    
    # Utworz plik ecosystem.config.js jeśli nie istnieje
    if [ ! -f "ecosystem.config.js" ]; then
        echo_info "Tworzę plik ecosystem.config.js..."
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'schoolmaster',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF
    fi
    
    # Utwórz katalog logs
    mkdir -p logs
    
    # Uruchom aplikację
    pm2 start ecosystem.config.js --env $ENV
    pm2 save
    pm2 startup
    
    echo_success "PM2 skonfigurowane i aplikacja uruchomiona"
fi

# Sprawdź czy aplikacja działa
echo_info "Sprawdzanie czy aplikacja działa..."
sleep 5

PORT=${PORT:-3000}
if curl -f -s "http://localhost:$PORT/api/subjects" > /dev/null; then
    echo_success "Aplikacja działa na porcie $PORT"
else
    echo_error "Aplikacja nie odpowiada na porcie $PORT"
    echo_info "Sprawdź logi: pm2 logs schoolmaster"
    exit 1
fi

# Sprawdź czy Nginx jest skonfigurowany
if command -v nginx &> /dev/null; then
    if nginx -t &> /dev/null; then
        echo_success "Konfiguracja Nginx - OK"
        echo_info "Przeładowywanie Nginx..."
        sudo systemctl reload nginx
        echo_success "Nginx przeładowany"
    else
        echo_warning "Błąd w konfiguracji Nginx"
        echo_info "Sprawdź: sudo nginx -t"
    fi
else
    echo_warning "Nginx nie jest zainstalowany"
fi

echo ""
echo_success "🎉 Wdrożenie ukończone pomyślnie!"
echo ""
echo_info "Następne kroki:"
echo "  • Sprawdź status: pm2 status"
echo "  • Sprawdź logi: pm2 logs schoolmaster"
echo "  • Skonfiguruj SSL: sudo certbot --nginx -d your-domain.com"
echo "  • Skonfiguruj Google OAuth w Google Cloud Console"
echo ""

if [ "$ENV" = "production" ]; then
    echo_info "🔒 Produkcja - pamiętaj o:"
    echo "  • Backup bazy danych"
    echo "  • Monitorowanie aplikacji"
    echo "  • Regularne aktualizacje bezpieczeństwa"
    echo ""
fi

echo_success "Aplikacja dostępna na: http://localhost:$PORT"

if [ ! -z "$DOMAIN" ]; then
    echo_success "Domena produkcyjna: $DOMAIN"
fi