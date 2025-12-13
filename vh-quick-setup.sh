#!/bin/bash

# Szybka konfiguracja dla VH.pl hosting

echo "🚀 Konfiguracja SchoolMaster dla VH.pl"
echo "====================================="

# Sprawdź czy jesteś w odpowiednim katalogu
if [[ ! "$PWD" =~ "schoolmaster/public_html" ]]; then
    echo "⚠️  Przejdź do katalogu: cd /home/vh10769/schoolmaster/public_html"
    exit 1
fi

# Sprawdź czy Node.js jest dostępny
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie znaleziony"
    echo "💡 Skonfiguruj Node.js przez cPanel → Node.js Selector"
    echo "   App Root: schoolmaster/public_html"
    echo "   App URL: /"
    echo "   Startup File: dist/index.js"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# Instaluj zależności
echo "📦 Instalowanie zależności..."
npm install --production

# Utwórz przykładową konfigurację
if [ ! -f ".env.production" ]; then
    echo "⚙️ Tworzenie .env.production..."
    cat > .env.production << 'EOF'
# Baza danych - WYPEŁNIJ swoimi danymi z cPanel
DATABASE_URL="postgresql://vh10769_school:TWOJE_HASLO@localhost:5432/vh10769_schoolmaster"

# Sesje - zmień na własny klucz (minimum 32 znaki)
SESSION_SECRET="super_secure_random_string_minimum_32_characters_vh_hosting_2025"

# Domena główna
DOMAIN="https://schoolmaster.pl"

# Port - ustawi cPanel
PORT=3000

# Środowisko
NODE_ENV="production"

# Google OAuth (opcjonalnie)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe (opcjonalnie)
STRIPE_SECRET_KEY=""
VITE_STRIPE_PUBLIC_KEY=""
EOF
    echo "✅ Utworzono .env.production"
else
    echo "✅ .env.production już istnieje"
fi

# Buduj aplikację
echo "🔨 Budowanie aplikacji..."
npm run build

if [ -d "dist" ]; then
    echo "✅ Aplikacja zbudowana"
else
    echo "❌ Błąd budowania"
    exit 1
fi

# Sprawdź bazę danych
echo "🐘 Sprawdzanie bazy danych..."
if npm run db:push; then
    echo "✅ Baza danych skonfigurowana"
else
    echo "⚠️  Problem z bazą danych - sprawdź DATABASE_URL w .env.production"
fi

echo ""
echo "🎉 Konfiguracja ukończona!"
echo ""
echo "📋 Następne kroki:"
echo "1. Sprawdź .env.production - wypełnij DATABASE_URL"
echo "2. W cPanel → PostgreSQL Databases utwórz bazę"
echo "3. W cPanel → Node.js Selector uruchom aplikację"
echo "4. W cPanel → SSL/TLS włącz Let's Encrypt"
echo ""
echo "🌐 URL aplikacji: https://schoolmaster.pl"
echo "📁 Katalog: $(pwd)"