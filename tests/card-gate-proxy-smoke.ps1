param(
  [string]$BaseUrl = "https://arche-paris.vercel.app",
  [string]$CardId = "PS-0001",
  [string]$Password = "test1234"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$tmpDir = Join-Path $root "tmp"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$cookieJar = Join-Path $tmpDir "proxy_smoke_cookie.txt"

function HeaderStatus([string]$file) {
  return (Get-Content $file | Select-Object -First 1).Trim()
}

Write-Host "1) POST /pair with empty JSON (must return body error)"
curl.exe -sS -D (Join-Path $tmpDir "smoke_pair_empty_headers.txt") -o (Join-Path $tmpDir "smoke_pair_empty_body.txt") `
  -X POST "$BaseUrl/api/card-gate/pair" `
  -H "Content-Type: application/json" `
  --data-raw "{}" | Out-Null

$emptyStatus = HeaderStatus (Join-Path $tmpDir "smoke_pair_empty_headers.txt")
$emptyBody = (Get-Content (Join-Path $tmpDir "smoke_pair_empty_body.txt") -Raw).Trim()
Write-Host "  status: $emptyStatus"
Write-Host "  body:   $emptyBody"

Write-Host "2) Force-unpair then pair (must set arche_refresh cookie)"
$fuPayload = Join-Path $tmpDir "smoke_force_unpair.json"
Set-Content -Path $fuPayload -NoNewline -Encoding ascii -Value "{`"card_id`":`"$CardId`",`"password`":`"$Password`"}"
curl.exe -sS -D (Join-Path $tmpDir "smoke_fu_headers.txt") -o (Join-Path $tmpDir "smoke_fu_body.txt") `
  -X POST "$BaseUrl/api/card-gate/force-unpair" `
  -H "Content-Type: application/json" `
  --data-binary "@$fuPayload" | Out-Null

$pairPayload = Join-Path $tmpDir "smoke_pair.json"
Set-Content -Path $pairPayload -NoNewline -Encoding ascii -Value "{`"card_id`":`"$CardId`",`"device_fingerprint`":`"proxy-smoke`",`"device_label`":`"smoke`"}"
curl.exe -sS -D (Join-Path $tmpDir "smoke_pair_headers.txt") -o (Join-Path $tmpDir "smoke_pair_body.txt") -c $cookieJar -b $cookieJar `
  -X POST "$BaseUrl/api/card-gate/pair" `
  -H "Content-Type: application/json" `
  --data-binary "@$pairPayload" | Out-Null

$pairStatus = HeaderStatus (Join-Path $tmpDir "smoke_pair_headers.txt")
$pairBody = (Get-Content (Join-Path $tmpDir "smoke_pair_body.txt") -Raw).Trim()
Write-Host "  pair status: $pairStatus"
Write-Host "  pair body:   $pairBody"

$cookieContent = (Get-Content $cookieJar -Raw)
if ($cookieContent -notmatch "arche_refresh") {
  throw "Missing arche_refresh cookie in cookie jar"
}
Write-Host "  cookie: arche_refresh present"

Write-Host "3) Protected route with cookie + card code"
curl.exe -sS -D (Join-Path $tmpDir "smoke_zone_headers.txt") -o (Join-Path $tmpDir "smoke_zone_body.txt") -b $cookieJar `
  -H "X-ARCHE-CARD-CODE: $CardId" `
  "$BaseUrl/api/card-gate/zone-progress" | Out-Null

$zoneStatus = HeaderStatus (Join-Path $tmpDir "smoke_zone_headers.txt")
$zoneBody = (Get-Content (Join-Path $tmpDir "smoke_zone_body.txt") -Raw).Trim()
Write-Host "  zone-progress status: $zoneStatus"
Write-Host "  zone-progress body:   $zoneBody"

if ($zoneStatus -match "401 Unauthorized") {
  throw "Protected route still unauthorized after pairing"
}

Write-Host "Smoke test passed."
