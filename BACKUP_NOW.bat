@echo off
echo ========================================================
echo Nama Invest ERP - FULL FLEET AUTOBACKUP (N1 to N10)
echo ========================================================
echo.
echo Please keep this window open while the backup runs.
echo This may take a few minutes as it connects to the server,
echo dumps the PostgreSQL database into SQL, and zips N1 to N10.
echo.
node DO_FULL_BACKUP.mjs
echo.
pause
