# Search for .pem key files on Windows
# Run this in PowerShell: .\search-key-file.ps1

Write-Host "🔍 Searching for .pem key files..." -ForegroundColor Cyan
Write-Host ""

# Search common locations
$commonFolders = @(
    "$env:USERPROFILE\Downloads",
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE"
)

Write-Host "Checking common folders..." -ForegroundColor Yellow
foreach ($folder in $commonFolders) {
    if (Test-Path $folder) {
        $pemFiles = Get-ChildItem -Path $folder -Filter *.pem -ErrorAction SilentlyContinue
        if ($pemFiles) {
            Write-Host "✅ Found in: $folder" -ForegroundColor Green
            foreach ($file in $pemFiles) {
                Write-Host "   - $($file.FullName)" -ForegroundColor White
            }
        }
    }
}

Write-Host ""
Write-Host "🔍 Deep searching user folder (this may take a minute)..." -ForegroundColor Yellow

# Deep search
$found = Get-ChildItem -Path $env:USERPROFILE -Filter *.pem -Recurse -ErrorAction SilentlyContinue

if ($found) {
    Write-Host ""
    Write-Host "✅ Found .pem files:" -ForegroundColor Green
    foreach ($file in $found) {
        Write-Host "   $($file.FullName)" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "❌ No .pem files found in user folder" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Yellow
    Write-Host "   1. Check your Downloads folder manually"
    Write-Host "   2. Check AWS Console → EC2 → Key Pairs"
    Write-Host "   3. Ask your team/colleagues"
    Write-Host "   4. Use AWS Session Manager if key is lost"
}

Write-Host ""
Write-Host "📄 For more help, see: FIND_YOUR_KEY_FILE.md" -ForegroundColor Cyan

