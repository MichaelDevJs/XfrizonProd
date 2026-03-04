$baseUrl = "http://localhost:8081/api/v1"
$token = "demo-token-1772530900220"

Write-Host ""
Write-Host "=== Manual Payout API Test ===" -ForegroundColor Cyan
Write-Host "Token: $token" -ForegroundColor Gray
Write-Host ""

# Test 1: GET Pending Payouts
Write-Host "[Test 1] GET /admin/payouts/pending" -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/payouts/pending?page=0&size=20" -Method GET -Headers $headers
    Write-Host "SUCCESS - Status 200" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
    Write-Host ""
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "N/A" }
    Write-Host "FAILED - Status $statusCode" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    Write-Host ""
}

# Test 2: POST Manual Payout (USD default)
Write-Host "[Test 2] POST /admin/payouts/manual (USD default)" -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    $body = @{
        organizerId = 2
        amount = 500.00
        description = "API Test - USD default currency"
        bankDetails = "Test Bank Account 123456789"
    } | ConvertTo-Json
    
    Write-Host "Request body:" -ForegroundColor Gray
    Write-Host $body -ForegroundColor DarkGray
    
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/payouts/manual" -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS - Status 200" -ForegroundColor Green
    if ($response.data) {
        Write-Host "Created Payout:" -ForegroundColor Gray
        Write-Host "  ID: $($response.data.id)"
        Write-Host "  Organizer ID: $($response.data.organizerId)" 
        Write-Host "  Amount: $($response.data.amount)"
        Write-Host "  Currency: $($response.data.currency)" -ForegroundColor $(if ($response.data.currency -eq "USD") { "Green" } else { "Red" })
        Write-Host "  Description: $($response.data.description)"
        Write-Host "  Status: $($response.data.status)"
        
        if ($response.data.currency -eq "USD") {
            Write-Host "  [PASS] Default currency is USD" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Expected USD, got $($response.data.currency)" -ForegroundColor Red
        }
    }
    Write-Host ""
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "N/A" }
    Write-Host "FAILED - Status $statusCode" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    Write-Host ""
}

# Test 3: POST Manual Payout (EUR explicit)
Write-Host "[Test 3] POST /admin/payouts/manual (EUR explicit)" -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    $body = @{
        organizerId = 2
        amount = 750.00
        currency = "EUR"
        description = "API Test - EUR currency"
        bankDetails = "Test Bank Account 987654321"
    } | ConvertTo-Json
    
    Write-Host "Request body:" -ForegroundColor Gray
    Write-Host $body -ForegroundColor DarkGray
    
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/payouts/manual" -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS - Status 200" -ForegroundColor Green
    if ($response.data) {
        Write-Host "Created Payout:" -ForegroundColor Gray
        Write-Host "  ID: $($response.data.id)"
        Write-Host "  Organizer ID: $($response.data.organizerId)"
        Write-Host "  Amount: $($response.data.amount)"
        Write-Host "  Currency: $($response.data.currency)" -ForegroundColor $(if ($response.data.currency -eq "EUR") { "Green" } else { "Red" })
        Write-Host "  Description: $($response.data.description)"
        Write-Host "  Status: $($response.data.status)"
        
        if ($response.data.currency -eq "EUR") {
            Write-Host "  [PASS] Currency is EUR" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Expected EUR, got $($response.data.currency)" -ForegroundColor Red
        }
    }
    Write-Host ""
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "N/A" }
    Write-Host "FAILED - Status $statusCode" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
