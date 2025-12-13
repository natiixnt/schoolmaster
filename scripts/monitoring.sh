#!/bin/bash

# SchoolMaster Monitoring Script
# Sprawdzanie stanu aplikacji i alerting

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

PORT=${PORT:-3000}
DOMAIN=${DOMAIN:-"http://localhost:$PORT"}

echo "📊 SchoolMaster Monitoring Dashboard"
echo "===================================="

# Sprawdź status PM2
echo_info "Status PM2:"
if pm2 describe schoolmaster > /dev/null 2>&1; then
    pm2 describe schoolmaster | grep -E "status|cpu|memory|restart|uptime"
    echo_success "PM2 - OK"
else
    echo_error "Aplikacja nie jest uruchomiona w PM2"
fi

echo ""

# Sprawdź czy aplikacja odpowiada
echo_info "Test odpowiedzi aplikacji:"
if curl -f -s "$DOMAIN/api/subjects" > /dev/null; then
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$DOMAIN/api/subjects")
    echo_success "API odpowiada (${RESPONSE_TIME}s)"
else
    echo_error "API nie odpowiada"
fi

# Sprawdź bazę danych
echo_info "Test bazy danych:"
if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
        USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | xargs)
        echo_success "Baza danych - OK (użytkownicy: $USER_COUNT)"
    else
        echo_error "Problem z bazą danych"
    fi
else
    echo_warning "Nie można sprawdzić bazy danych (brak psql lub DATABASE_URL)"
fi

echo ""

# Sprawdź użycie zasobów
echo_info "Użycie zasobów:"

# CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "CPU: ${CPU_USAGE}%"

# RAM
MEM_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
echo "RAM: ${MEM_USAGE}%"

# Dysk
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}')
echo "Dysk: $DISK_USAGE"

echo ""

# Sprawdź logi na błędy
echo_info "Sprawdzanie logów na błędy (ostatnie 24h):"
ERROR_COUNT=$(journalctl --since "24 hours ago" | grep -i error | wc -l 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo_warning "Znaleziono $ERROR_COUNT błędów w logach systemowych"
else
    echo_success "Brak błędów w logach systemowych"
fi

# PM2 logi
if pm2 describe schoolmaster > /dev/null 2>&1; then
    PM2_ERRORS=$(pm2 logs schoolmaster --lines 100 --nostream | grep -i error | wc -l 2>/dev/null || echo "0")
    if [ "$PM2_ERRORS" -gt 0 ]; then
        echo_warning "Znaleziono $PM2_ERRORS błędów w logach PM2"
        echo_info "Ostatnie błędy:"
        pm2 logs schoolmaster --lines 100 --nostream | grep -i error | tail -3
    else
        echo_success "Brak błędów w logach PM2"
    fi
fi

echo ""

# Sprawdź certyfikat SSL (jeśli HTTPS)
if [[ "$DOMAIN" == https://* ]]; then
    DOMAIN_NAME=$(echo "$DOMAIN" | sed 's|https://||' | sed 's|/.*||')
    echo_info "Sprawdzanie certyfikatu SSL dla $DOMAIN_NAME:"
    
    SSL_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN_NAME" -connect "$DOMAIN_NAME:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    SSL_DAYS=$(( ($(date -d "$SSL_EXPIRY" +%s) - $(date +%s)) / 86400 ))
    
    if [ "$SSL_DAYS" -gt 30 ]; then
        echo_success "Certyfikat SSL ważny przez $SSL_DAYS dni"
    elif [ "$SSL_DAYS" -gt 7 ]; then
        echo_warning "Certyfikat SSL wygasa za $SSL_DAYS dni"
    else
        echo_error "Certyfikat SSL wygasa za $SSL_DAYS dni - WYMAGANA ODNOWA!"
    fi
fi

echo ""

# Sprawdź aktualizacje
echo_info "Sprawdzanie dostępnych aktualizacji:"
if [ -d ".git" ]; then
    git fetch > /dev/null 2>&1
    BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || git rev-list HEAD..origin/master --count 2>/dev/null || echo "0")
    if [ "$BEHIND" -gt 0 ]; then
        echo_warning "Dostępne $BEHIND nowych commitów"
        echo_info "Aktualizacja: ./scripts/update.sh"
    else
        echo_success "Aplikacja jest aktualna"
    fi
else
    echo_info "Nie używasz git - sprawdź ręcznie czy są aktualizacje"
fi

echo ""

# Podsumowanie
echo_info "Podsumowanie stanu:"
echo "- PM2: $(pm2 describe schoolmaster > /dev/null 2>&1 && echo "✅ Online" || echo "❌ Offline")"
echo "- API: $(curl -f -s "$DOMAIN/api/subjects" > /dev/null && echo "✅ Działa" || echo "❌ Nie działa")"
echo "- Baza: $([ -n "$DATABASE_URL" ] && psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1 && echo "✅ Połączona" || echo "❌ Problem")"

# Generuj alerting jeśli trzeba
if ! curl -f -s "$DOMAIN/api/subjects" > /dev/null; then
    echo ""
    echo_error "ALERT: Aplikacja nie odpowiada!"
    echo_info "Możliwe działania:"
    echo "  1. Sprawdź logi: pm2 logs schoolmaster"
    echo "  2. Restart: pm2 restart schoolmaster"
    echo "  3. Rollback: ./scripts/rollback.sh"
fi

echo ""
echo_info "Monitoring ukończony - $(date)"