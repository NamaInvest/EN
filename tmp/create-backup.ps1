# Backup Script for Nama Invest (Local Environment)
$DateStr = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir = "d:\namasoft-backups\$DateStr"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

Write-Host "1. Backing up Database (namasoft)..."
$env:PGPASSWORD = "root"
pg_dump -U postgres -h localhost -p 5432 -F c -d namasoft -f "$BackupDir\namasoft_db.backup"

Write-Host "2. Backing up Codebase (excluding node_modules and .next)..."
$Exclude = @('.git', 'node_modules', '.next', '.swc', 'namasoft-backups')
# Using Compress-Archive with exclusion is tricky in PS, so we'll just zip specific folders
$SourceFolders = @("src", "prisma", "public", "scripts", "locales", ".agent")
$SourceFiles = @("package.json", "next.config.ts", "ecosystem.config.js", "tsconfig.json", "tailwind.config.ts", ".env")

# Create a staging area
$StagingDir = "$BackupDir\code_staging"
New-Item -ItemType Directory -Force -Path $StagingDir | Out-Null

foreach ($folder in $SourceFolders) {
    if (Test-Path $folder) {
        Copy-Item -Path $folder -Destination $StagingDir -Recurse -Force
    }
}
foreach ($file in $SourceFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $StagingDir -Force
    }
}

Write-Host "Compressing codebase..."
Compress-Archive -Path "$StagingDir\*" -DestinationPath "$BackupDir\namasoft_code.zip" -Force

# Cleanup staging
Remove-Item -Path $StagingDir -Recurse -Force

Write-Host "Backup completed successfully at: $BackupDir"
