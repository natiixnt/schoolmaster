#!/bin/bash

# Instalacja Node.js na hostingu współdzielonym (bez sudo)

echo "🔧 Instalacja Node.js lokalnie..."

cd ~

# Sprawdź architekturę
ARCH=$(uname -m)
echo "Architektura: $ARCH"

# Wybierz odpowiednią wersję Node.js
if [[ "$ARCH" == "x86_64" ]]; then
    NODE_VERSION="node-v20.11.0-linux-x64"
    NODE_URL="https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz"
elif [[ "$ARCH" == "aarch64" ]]; then
    NODE_VERSION="node-v20.11.0-linux-arm64"
    NODE_URL="https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-arm64.tar.xz"
else
    echo "❌ Nieobsługiwana architektura: $ARCH"
    exit 1
fi

# Pobierz Node.js jeśli nie istnieje
if [ ! -d "$NODE_VERSION" ]; then
    echo "📥 Pobieranie Node.js..."
    wget "$NODE_URL"
    
    echo "📦 Rozpakowywanie..."
    tar -xJf "${NODE_VERSION}.tar.xz"
    
    echo "🗑️ Usuwanie archiwum..."
    rm "${NODE_VERSION}.tar.xz"
fi

# Dodaj do PATH
NODE_PATH="$HOME/$NODE_VERSION/bin"

# Sprawdź czy już jest w .bashrc
if ! grep -q "$NODE_PATH" ~/.bashrc 2>/dev/null; then
    echo "⚙️ Dodawanie do PATH..."
    echo "" >> ~/.bashrc
    echo "# Node.js lokalny" >> ~/.bashrc
    echo "export PATH=$NODE_PATH:\$PATH" >> ~/.bashrc
fi

# Zastosuj zmiany
export PATH="$NODE_PATH:$PATH"

# Sprawdź instalację
echo "✅ Sprawdzanie instalacji..."
echo "Node.js: $(node --version 2>/dev/null || echo 'BŁĄD')"
echo "npm: $(npm --version 2>/dev/null || echo 'BŁĄD')"

if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "✅ Node.js zainstalowany pomyślnie!"
    echo ""
    echo "🔄 Uruchom: source ~/.bashrc"
    echo "📁 Następnie: cd /home/vh10769/schoolmaster/schoolmaster"
    echo "📦 I: npm install"
else
    echo "❌ Problem z instalacją Node.js"
    echo "💡 Sprawdź czy wget działa: wget --version"
fi