#!/bin/bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  bid=$(cat /www/wwwroot/n$i.namainvist.com/.next/BUILD_ID 2>/dev/null || echo "MISSING")
  env_url=$(grep NEXT_PUBLIC_API_URL /www/wwwroot/n$i.namainvist.com/.env 2>/dev/null || echo "NO_ENV")
  echo "n$i: BUILD_ID=$bid | ENV_URL=$env_url"
done
