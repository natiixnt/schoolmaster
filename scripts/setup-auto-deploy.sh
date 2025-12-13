#!/bin/bash

# Setup script dla automatycznego wdrażania
# Konfiguruje SSH keys i połączenie z serwerem produkcyjnym

echo "🔧 Konfiguracja automatycznego wdrażania"
echo "========================================"

echo "Ten skrypt pomoże skonfigurować automatyczne wdrażanie z Replit na Twój serwer."
echo ""

# Zbierz informacje o serwerze
read -p "Adres IP lub domena serwera: " SERVER_IP
read -p "Nazwa użytkownika SSH: " SSH_USER
read -p "Port SSH (domyślnie 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

PRODUCTION_SERVER="$SSH_USER@$SERVER_IP"

echo ""
echo "📋 Konfiguracja:"
echo "Serwer: $PRODUCTION_SERVER"
echo "Port: $SSH_PORT"
echo ""

# Sprawdź czy klucz SSH istnieje
SSH_KEY_PATH="$HOME/.ssh/id_rsa"
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "🔑 Generowanie klucza SSH..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N ""
    echo "✅ Klucz SSH wygenerowany"
fi

echo ""
echo "📤 Kopiowanie klucza publicznego na serwer..."
echo "Zostaniesz poproszony o hasło do serwera:"

if ssh-copy-id -i "$SSH_KEY_PATH.pub" -p "$SSH_PORT" "$PRODUCTION_SERVER"; then
    echo "✅ Klucz publiczny skopiowany"
else
    echo "❌ Błąd kopiowania klucza"
    echo ""
    echo "Skopiuj ręcznie zawartość tego pliku:"
    echo "cat $SSH_KEY_PATH.pub"
    echo ""
    echo "I dodaj do pliku na serwerze:"
    echo "~/.ssh/authorized_keys"
    exit 1
fi

# Aktualizuj konfigurację w auto-deploy.sh
echo ""
echo "⚙️ Aktualizowanie konfiguracji..."

sed -i.bak \
    -e "s|PRODUCTION_SERVER=\"user@your-server.com\"|PRODUCTION_SERVER=\"$PRODUCTION_SERVER\"|" \
    -e "s|SSH_KEY_PATH=\"~/.ssh/id_rsa\"|SSH_KEY_PATH=\"$SSH_KEY_PATH\"|" \
    scripts/auto-deploy.sh

echo "✅ Konfiguracja zaktualizowana"

# Test połączenia
echo ""
echo "🧪 Test połączenia SSH..."
if ssh -i "$SSH_KEY_PATH" -p "$SSH_PORT" -o ConnectTimeout=10 "$PRODUCTION_SERVER" "echo 'Połączenie działa!'" 2>/dev/null; then
    echo "✅ Połączenie SSH działa!"
else
    echo "❌ Problem z połączeniem SSH"
    echo "Sprawdź konfigurację serwera i spróbuj ponownie"
    exit 1
fi

echo ""
echo "🎉 Konfiguracja ukończona!"
echo ""
echo "Teraz możesz używać:"
echo "  ./scripts/auto-deploy.sh  - wdrażanie zmian na serwer"
echo ""
echo "WAŻNE: Upewnij się że na serwerze aplikacja jest już wdrożona (./scripts/deploy.sh production)"