# SchoolMaster

Express API + React (Vite) frontend served from the same Node process.

## Requirements
- Node.js 20+
- npm
- PostgreSQL

## Configure environment
Create a `.env` file (or export the vars) before running:

```env
DATABASE_URL=postgres://user:password@host:port/dbname
SESSION_SECRET=your-session-secret
PORT=5000

# Payments (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP, optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=change-me

# Google integrations (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Optional AI integration
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
```

Set only what you need; Stripe/SMTP/Google/OpenAI features are optional.

## Install dependencies
```sh
npm install
```

## Database (Drizzle)
Apply the schema to your PostgreSQL instance:
```sh
npm run db:push
```

## Run in development
Runs the API and Vite dev server through Express middleware.
```sh
npm run dev
# http://localhost:5000
```

## Build and run in production
```sh
npm run build   # builds client into dist/public and bundles the server to dist/index.js
npm start       # NODE_ENV=production node dist/index.js
```

## Checks
```sh
npm run check   # TypeScript
```
