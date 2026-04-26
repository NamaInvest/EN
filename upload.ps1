$version = (Get-Content package.json | ConvertFrom-Json).version
$exeName = "NamaInvest-Setup-$version.exe"
$exePath = "dist-electron\$exeName"
$ymlPath = "dist-electron\latest.yml"
$blockmapPath = "dist-electron\$exeName.blockmap"

if (!(Test-Path $exePath)) {
    Write-Host "Error: Cannot find file $exePath. Please build first." -ForegroundColor Red
    exit 1
}

$servers = @("namainvist.com", "n11.namainvist.com")

foreach ($server in $servers) {
    Write-Host "`n=== Uploading files to $server ===" -ForegroundColor Cyan
    Write-Host "Uploading $exeName..."
    scp $exePath root@46.4.188.170:/www/wwwroot/$server/public/updates/
    
    if (Test-Path $ymlPath) {
        Write-Host "Uploading latest.yml..."
        scp $ymlPath root@46.4.188.170:/www/wwwroot/$server/public/updates/
    }
    
    if (Test-Path $blockmapPath) {
        Write-Host "Uploading $exeName.blockmap..."
        scp $blockmapPath root@46.4.188.170:/www/wwwroot/$server/public/updates/
    }
}

Write-Host "`n=== Upload Completed Successfully! ===" -ForegroundColor Green
