# Manual Payout API Test Script
# Tests the manual payout endpoints with USD currency default

$baseUrl = "http://localhost:8081/api/v1"

Write-Host ""
Write-Host "=== Manual Payout API Tests ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Get Pending Payouts
Write-Host "[Test 1] GET /admin/payouts/pending" -ForegroundColor Yellow
try {
    $headers = @{"Content-Type" = "application/json"}
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/payouts/pending?page=0&size=20" `
        -Method GET -Headers $headers -ErrorAction Stop
    
    Write-Host "Status: 200 OK" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 2
    Write-Host ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode FAILED" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error: $responseBody" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 2: Create Manual Payout with USD default
Write-Host "[Test 2] POST /admin/payouts/manual (USD default)" -ForegroundColor Yellow
try {
    $headers = @{"Content-Type" = "application/json"}
    
    $payload = @{
        organizerId = 2
        amount = 500.00
        description = "API Test - USD default"
        bankDetails = "Test Bank Account"
    } | ConvertTo-Json
    
    Write-Host "Request:" -ForegroundColor Gray
    Write-Host $payload -ForegroundColor DarkGray
    
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/payouts/manual" `
        -Method POST -Headers $headers -Body $payload -ErrorAction Stop
    
    Write-Host "Status: 200 OK" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    if ($response.data) {
        Write-Host "  ID: $($response.data.id)" -ForegroundColor Gray
        Write-Host "  Amount: $($response.data.amount)" -ForegroundColor Gray
        Write-Host "  Currency: $($response.data.currency)" -ForegroundColor Gray
        if ($response.data.currency -eq "USD") {
            Write-Host "  OK: Default currency is USD" -ForegroundColor Green
        }
    }
    Write-Host ""
} catch {
    Write-Host "Status: FAILED" -ForegroundColor Red
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error: $responseBody" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 3: Create Manual Payout with explicit EUR currency
Write-Host "[Test 3] POST /admin/payouts/manual (EUR explicit)" -ForegroundColor Yellow
try {
    $headers = @{"Content-Type" = "application/json"}
    
    $payload = @{
        organizerId = 2
        amount = 750.00
        currency = "EUR"
        description = "API Test - EUR"
        bankDetails = "Test Bank Account"
    } | ConvertTo-Json
    
    Write-Host "Request:" -ForegroundColor Gray
    Write-Host $payload -ForegroundColor DarkGray
    
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/payouts/manual" `
        -Method POST -Headers $headers -Body $payload -ErrorAction Stop
    
    Write-Host "Status: 200 OK" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    if ($response.data) {
        Write-Host "  ID: $($response.data.id)" -ForegroundColor Gray
        Write-Host "  Amount: $($response.data.amount)" -ForegroundColor Gray
        Write-Host "  Currency: $($response.data.currency)" -ForegroundColor Gray
        if ($response.data.currency -eq "EUR") {
            Write-Host "  OK: Currency is EUR" -ForegroundColor Green
        }
    }
    Write-Host ""
} catch {
    Write-Host "Status: FAILED" -ForegroundColor Red
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error: $responseBody" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
