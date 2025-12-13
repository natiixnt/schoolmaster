#!/bin/bash

# Automatyczne wdrażanie przy zmianie plików
# Monitoruje zmiany i automatycznie wdraża na serwer

echo "👀 Watching for changes and auto-deploying..."
echo "Naciśnij Ctrl+C aby zatrzymać"

# Sprawdź czy inotifywait jest dostępne
if ! command -v inotifywait &> /dev/null; then
    echo "📦 Instalowanie inotify-tools..."
    sudo apt-get update
    sudo apt-get install -y inotify-tools
fi

# Katalogi do monitorowania
WATCH_DIRS="client server shared"

# Funkcja deploymentu
deploy() {
    echo ""
    echo "🔄 Zmiana wykryta - rozpoczynam deployment..."
    echo "$(date): Deployment triggered" >> deployment.log
    
    if ./scripts/auto-deploy.sh; then
        echo "✅ Deployment ukończony - $(date)"
        echo "$(date): Deployment successful" >> deployment.log
    else
        echo "❌ Błąd deploymentu - $(date)"
        echo "$(date): Deployment failed" >> deployment.log
    fi
    echo ""
    echo "👀 Kontynuuję monitorowanie..."
}

# Debouncing - czeka 5 sekund po ostatniej zmianie
LAST_CHANGE=0
DEBOUNCE_TIME=5

while true; do
    # Monitoruj zmiany w plikach
    inotifywait -r -e modify,create,delete,move \
        --include '\.(ts|tsx|js|jsx|json|css|md)$' \
        $WATCH_DIRS 2>/dev/null
    
    CURRENT_TIME=$(date +%s)
    LAST_CHANGE=$CURRENT_TIME
    
    # Czekaj na koniec serii zmian (debouncing)
    while [ $(($(date +%s) - LAST_CHANGE)) -lt $DEBOUNCE_TIME ]; do
        if inotifywait -r -e modify,create,delete,move \
            --include '\.(ts|tsx|js|jsx|json|css|md)$' \
            --timeout $DEBOUNCE_TIME \
            $WATCH_DIRS 2>/dev/null; then
            LAST_CHANGE=$(date +%s)
        fi
    done
    
    # Wykonaj deployment
    deploy
done