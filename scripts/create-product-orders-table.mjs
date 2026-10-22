import { readFile } from 'fs/promises'
import path from 'path'
import { Client } from 'pg'

function parseEnvValue(raw) {
  const trimmed = raw.trim()

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

async function loadLocalEnv(envPath) {
  try {
    const content = await readFile(envPath, 'utf-8')
    const map = {}

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const idx = trimmed.indexOf('=')
      if (idx <= 0) continue

      const key = trimmed.slice(0, idx).trim()
      const value = parseEnvValue(trimmed.slice(idx + 1))
      map[key] = value
    }

    return map
  } catch {
    return {}
  }
}

async function main() {
  const root = process.cwd()
  const env = await loadLocalEnv(path.join(root, '.env.local'))

  // Accept several env var names for flexibility
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || env.DATABASE_URL || env.SUPABASE_DATABASE_URL

  if (!dbUrl) {
    console.error('Please set DATABASE_URL or SUPABASE_DATABASE_URL in your environment or .env.local')
    process.exit(1)
  }

  const sqlPath = path.join(root, 'supabase', 'schema.sql')
  const sql = await readFile(sqlPath, 'utf-8')

  const client = new Client({ connectionString: dbUrl })

  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log(`Running SQL from ${sqlPath}...`)
    await client.query(sql)
    console.log('Schema applied successfully.')
  } catch (error) {
    console.error('Failed to apply schema:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
