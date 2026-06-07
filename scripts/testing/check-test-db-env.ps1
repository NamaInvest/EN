if ($env:TEST_MODE) { Write-Output "TEST_MODE_PRESENT" } else { Write-Output "TEST_MODE_MISSING" }
if ($env:TEST_DATABASE_URL) { Write-Output "TEST_DATABASE_URL_PRESENT" } else { Write-Output "TEST_DATABASE_URL_MISSING" }
if ($env:DATABASE_URL) { Write-Output "DATABASE_URL_PRESENT_BUT_VALUE_NOT_PRINTED" } else { Write-Output "DATABASE_URL_MISSING" }
