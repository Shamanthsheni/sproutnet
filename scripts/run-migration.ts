// Run: npx tsx scripts/run-migration.ts <sql-file>
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dirname!, '../.env.local') })

import { readFileSync } from 'fs'
import pg from 'pg'

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: npx tsx scripts/run-migration.ts <path-to-sql>')
  process.exit(1)
}

async function run() {
  const sql = readFileSync(resolve(import.meta.dirname!, '..', sqlFile), 'utf-8')

  const pool = new pg.Pool({
    connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  })

  // Supabase directs: use direct connection string if available
  // Otherwise, use the Supabase REST API via fetch
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Supabase pg connection
  const supabaseUrl = new URL(url)
  const host = supabaseUrl.hostname
  const dbName = supabaseUrl.hostname.split('.')[0]
  const directUrl = `postgresql://postgres:${key}@${host}:5432/postgres`

  const directPool = new pg.Pool({ connectionString: directUrl, ssl: { rejectUnauthorized: false } })

  try {
    await directPool.query(sql)
    console.log('✓ Migration applied successfully')
  } catch (err: any) {
    console.error('✗ Migration failed:', err.message)
  } finally {
    await directPool.end()
  }
}

run()
