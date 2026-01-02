import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const useNeon = databaseUrl.includes("neon.tech") || process.env.DATABASE_USE_NEON === "true";

export let pool: NeonPool | PgPool;
export let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;

if (useNeon) {
  // Configure WebSocket only in non-edge environments
  if (typeof WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws;
  }

  // Set connection timeout to prevent hanging connections
  neonConfig.wsProxy = (host) => `${host}`;
  neonConfig.useSecureWebSocket = true;

  pool = new NeonPool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
  db = drizzleNeon({ client: pool, schema });
} else {
  pool = new PgPool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
  db = drizzlePg(pool, { schema });
}
