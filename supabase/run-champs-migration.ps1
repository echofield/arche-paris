# Run champs migration (20260226000001_champs.sql)
# For project sbp_21f7b0c6672adaf32593fe766e2b41921bc400a5 (or your linked project)
#
# Option A: With database URL (Settings > Database > Connection string, use "URI" and replace [YOUR-PASSWORD])
#   $env:SUPABASE_DB_URL = "postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
#   .\supabase\run-champs-migration.ps1
#
# Option B: Run in Supabase Dashboard > SQL Editor > New query > paste contents of supabase/migrations/20260226000001_champs.sql > Run

$migrationPath = Join-Path $PSScriptRoot "migrations\20260226000001_champs.sql"
if (-not (Test-Path $migrationPath)) {
  Write-Error "Migration file not found: $migrationPath"
  exit 1
}

$dbUrl = if ($env:SUPABASE_DB_URL) { $env:SUPABASE_DB_URL } else { $env:DATABASE_URL }
if ($dbUrl) {
  try {
    & psql $dbUrl -f $migrationPath 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "If psql is not installed, run the SQL manually in Supabase Dashboard > SQL Editor. File: $migrationPath"
      exit $LASTEXITCODE
    }
    Write-Host "Champs migration applied."
  } catch {
    Write-Host "Run the SQL manually: open $migrationPath and paste into Supabase Dashboard > SQL Editor."
  }
} else {
  Write-Host "Set SUPABASE_DB_URL (or DATABASE_URL) to run via psql, or run the SQL manually:"
  Write-Host "  1. Open https://supabase.com/dashboard (project sbp_21f7b0c6672adaf32593fe766e2b41921bc400a5 or your ref)"
  Write-Host "  2. SQL Editor > New query"
  Write-Host "  3. Paste contents of: $migrationPath"
  Write-Host "  4. Run"
  Get-Content $migrationPath -Raw
}
