// Run: npx tsx scripts/apply-migration.ts
// Applies pending migrations via Supabase Management API
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dirname!, '../.env') })

import { readFileSync, readdirSync } from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runSql(sql: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })
  return res
}

async function main() {
  // First, create the exec_sql function if it doesn't exist
  const createFn = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `

  // Try creating function via direct SQL execution trick
  // We'll use the pg connection string approach
  const { default: pg } = await import('pg')

  // Supabase pg connection
  const supabaseUrl = new URL(SUPABASE_URL)
  const host = supabaseUrl.hostname
  const directUrl = `postgresql://postgres:${SERVICE_KEY}@${host}:5432/postgres`

  const pool = new pg.Pool({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  })

  const migrationsDir = resolve(import.meta.dirname!, '../supabase/migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (!file.includes('individual_mentor')) continue // only run this one for now

    const sql = readFileSync(resolve(migrationsDir, file), 'utf-8')
    console.log(`Applying ${file}...`)

    try {
      await pool.query(sql)
      console.log(`  ✓ ${file}`)
    } catch (err: any) {
      console.error(`  ✗ ${file}: ${err.message}`)
    }
  }

  await pool.end()
}

main()
