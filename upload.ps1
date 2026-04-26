$version = (Get-Content package.json | ConvertFrom-Json).version
$exeName = "NamaInvest-Setup-$version.exe"
$exePath = "dist-electron\$exeName"
$ymlPath = "dist-electron\latest.yml"
$blockmapPath = "dist-electron\$exeName.blockmap"

if (!(Test-Path $exePath)) {
    Write-Host "خطأ: لم يتم العثور على الملف $exePath. يرجى بناؤه أولاً." -ForegroundColor Red
    exit 1
}

$servers = @("namainvist.com", "n11.namainvist.com")

foreach ($server in $servers) {
    Write-Host "`n=== رفع الملفات إلى $server ===" -ForegroundColor Cyan
    Write-Host "جاري رفع $exeName..."
    scp $exePath root@46.4.188.170:/www/wwwroot/$server/public/updates/
    
    if (Test-Path $ymlPath) {
        Write-Host "جاري رفع latest.yml..."
        scp $ymlPath root@46.4.188.170:/www/wwwroot/$server/public/updates/
    }
    
    if (Test-Path $blockmapPath) {
        Write-Host "جاري رفع $exeName.blockmap..."
        scp $blockmapPath root@46.4.188.170:/www/wwwroot/$server/public/updates/
    }
}

Write-Host "`n=== اكتمل الرفع بنجاح! ===" -ForegroundColor Green
