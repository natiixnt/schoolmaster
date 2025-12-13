#!/bin/bash

# Script do pakowania aplikacji SchoolMaster do wdrożenia na własnym hostingu
# Tworzy archiwum z wszystkimi potrzebnymi plikami

set -e

echo "📦 Pakowanie aplikacji SchoolMaster do wdrożenia..."

# Utworz katalog tymczasowy
TEMP_DIR="schoolmaster-deployment-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"

echo "✅ Tworzę katalog: $TEMP_DIR"

# Kopiuj pliki aplikacji
echo "📋 Kopiowanie plików aplikacji..."

# Katalogi główne
cp -r client "$TEMP_DIR/"
cp -r server "$TEMP_DIR/"
cp -r shared "$TEMP_DIR/"
cp -r scripts "$TEMP_DIR/"

# Pliki konfiguracyjne
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp vite.config.ts "$TEMP_DIR/"
cp tailwind.config.ts "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp components.json "$TEMP_DIR/"
cp drizzle.config.ts "$TEMP_DIR/"
cp .replit "$TEMP_DIR/" 2>/dev/null || true

# Dokumentacja
cp DEPLOYMENT.md "$TEMP_DIR/"
cp replit.md "$TEMP_DIR/"
cp README.md "$TEMP_DIR/" 2>/dev/null || true

# Utwórz przykładowe pliki środowiskowe
echo "⚙️ Tworzenie przykładowych plików konfiguracyjnych..."

cat > "$TEMP_DIR/.env.production.example" << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/schoolmaster"

# Session Secret (minimum 32 characters)
SESSION_SECRET="your_super_secure_session_secret_at_least_32_characters_long"

# Google OAuth (wypełnij po skonfigurowaniu w Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Stripe Configuration (opcjonalne)
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
VITE_STRIPE_PUBLIC_KEY="pk_live_your_stripe_publishable_key"

# Environment
NODE_ENV="production"
PORT="3000"

# Your Domain
DOMAIN="https://your-domain.com"

# PostgreSQL Database Details (for manual setup)
PGHOST="localhost"
PGPORT="5432"
PGUSER="schoolmaster_user"
PGPASSWORD="your_secure_password"
PGDATABASE="schoolmaster"
EOF

# Utwórz plik ecosystem.config.js
cat > "$TEMP_DIR/ecosystem.config.js" << 'EOF'
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
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Utwórz przykładową konfigurację Nginx
mkdir -p "$TEMP_DIR/nginx"
cat > "$TEMP_DIR/nginx/schoolmaster.conf" << 'EOF'
# Zastąp 'your-domain.com' swoją domeną
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (po zainstalowaniu certyfikatu)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; connect-src 'self' https://api.stripe.com;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Static files
    location /assets/ {
        alias /var/www/schoolmaster/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend routes (SPA routing)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Utwórz skrypt szybkiej instalacji
cat > "$TEMP_DIR/quick-install.sh" << 'EOF'
#!/bin/bash

echo "🚀 Szybka instalacja SchoolMaster"
echo "================================="

# Sprawdź system operacyjny
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ System: Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ System: macOS"
else
    echo "❌ Nieobsługiwany system operacyjny"
    exit 1
fi

# Instalacja Node.js (Ubuntu/Debian)
if ! command -v node &> /dev/null; then
    echo "📦 Instalowanie Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalacja PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "🐘 Instalowanie PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Instalacja PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ Instalowanie PM2..."
    sudo npm install -g pm2
fi

# Instalacja zależności aplikacji
echo "📋 Instalowanie zależności..."
npm install

# Konfiguracja environment
if [ ! -f ".env.production" ]; then
    echo "⚙️ Kopiowanie przykładowej konfiguracji..."
    cp .env.production.example .env.production
    echo "❗ WAŻNE: Wypełnij plik .env.production przed kontynuowaniem!"
    echo "❗ Szczególnie: DATABASE_URL i SESSION_SECRET"
    exit 1
fi

echo "✅ Podstawowa instalacja ukończona!"
echo ""
echo "Następne kroki:"
echo "1. Skonfiguruj bazę danych PostgreSQL"
echo "2. Wypełnij plik .env.production"
echo "3. Uruchom: ./scripts/deploy.sh production"
echo "4. Skonfiguruj Nginx (nginx/schoolmaster.conf)"
echo "5. Zainstaluj SSL certificate"
EOF

chmod +x "$TEMP_DIR/quick-install.sh"

# Utwórz plik README dla wdrożenia
cat > "$TEMP_DIR/README-DEPLOYMENT.md" << 'EOF'
# Wdrożenie SchoolMaster na własnym hostingu

## Szybki start

1. **Rozpakuj archiwum** na swoim serwerze:
   ```bash
   tar -xzf schoolmaster-deployment-*.tar.gz
   cd schoolmaster-deployment-*
   ```

2. **Uruchom instalację**:
   ```bash
   chmod +x quick-install.sh
   ./quick-install.sh
   ```

3. **Skonfiguruj environment**:
   ```bash
   cp .env.production.example .env.production
   nano .env.production  # wypełnij wszystkie potrzebne dane
   ```

4. **Wdróż aplikację**:
   ```bash
   ./scripts/deploy.sh production
   ```

## Pliki w archiwum

- `DEPLOYMENT.md` - Kompletna instrukcja wdrożenia
- `.env.production.example` - Przykładowa konfiguracja
- `ecosystem.config.js` - Konfiguracja PM2
- `nginx/schoolmaster.conf` - Konfiguracja Nginx
- `quick-install.sh` - Skrypt szybkiej instalacji
- `scripts/deploy.sh` - Skrypt wdrożenia

## Wymagania

- Ubuntu 20.04+ lub Debian 11+
- Node.js 18+
- PostgreSQL 12+
- Nginx (zalecane)
- Własna domena z SSL

## Wsparcie

W razie problemów sprawdź:
1. `DEPLOYMENT.md` - kompletna instrukcja
2. Logi PM2: `pm2 logs schoolmaster`
3. Logi Nginx: `sudo tail -f /var/log/nginx/error.log`

## Po wdrożeniu

Po pomyślnym wdrożeniu Google OAuth będzie działać z Twoją domeną!
EOF

# Usuń node_modules jeśli istnieje (będzie reinstallowane na serwerze)
rm -rf "$TEMP_DIR/node_modules" 2>/dev/null || true

# Usuń pliki development
rm -rf "$TEMP_DIR/.env" 2>/dev/null || true
rm -rf "$TEMP_DIR/dist" 2>/dev/null || true
rm -rf "$TEMP_DIR/logs" 2>/dev/null || true

echo "📁 Archiwizowanie..."

# Utwórz archiwum
tar -czf "${TEMP_DIR}.tar.gz" "$TEMP_DIR"

# Usuń katalog tymczasowy
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Pakowanie ukończone!"
echo "📦 Archiwum: ${TEMP_DIR}.tar.gz"
echo ""
echo "🚀 Przenieś archiwum na swój serwer i:"
echo "   1. Rozpakuj: tar -xzf ${TEMP_DIR}.tar.gz"
echo "   2. Uruchom: cd ${TEMP_DIR} && ./quick-install.sh"
echo "   3. Skonfiguruj: .env.production"
echo "   4. Wdróż: ./scripts/deploy.sh production"
echo ""
echo "📖 Kompletna instrukcja w pliku DEPLOYMENT.md"