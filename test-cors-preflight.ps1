# Test CORS Preflight - Card Gate
Write-Host "Testing OPTIONS preflight for card-gate/refresh..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Origin" = "https://www.xn--arch-paris-e7a.com"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "content-type, authorization, x-requested-with, apikey"
}

$response = Invoke-WebRequest -Uri "https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh" `
    -Method OPTIONS `
    -Headers $headers `
    -MaximumRedirection 0 `
    -ErrorAction SilentlyContinue

Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Response Headers:" -ForegroundColor Green
$response.Headers.GetEnumerator() | Where-Object { $_.Key -like "*access-control*" -or $_.Key -like "*x-debug*" } | ForEach-Object {
    Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor White
}

Write-Host ""
Write-Host "Checking for wildcard..." -ForegroundColor Cyan
$acao = $response.Headers["Access-Control-Allow-Origin"]
if ($acao -eq "*") {
    Write-Host "  ❌ WILDCARD DETECTED: Access-Control-Allow-Origin: *" -ForegroundColor Red
} elseif ($acao -eq "https://www.xn--arch-paris-e7a.com") {
    Write-Host "  ✅ CORRECT: Access-Control-Allow-Origin: $acao" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  UNEXPECTED: Access-Control-Allow-Origin: $acao" -ForegroundColor Yellow
}
