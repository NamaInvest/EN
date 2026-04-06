#!/bin/bash
echo "=== NEXT_PUBLIC_API_URL baked into N3 JS ==="
grep -r "n3.namainvist.com" /www/wwwroot/n3.namainvist.com/.next/static/ 2>/dev/null | head -5

echo "=== NEXT_PUBLIC_API_URL baked into N4 JS ==="
grep -r "n4.namainvist.com\|n1.namainvist.com\|n2.namainvist.com" /www/wwwroot/n4.namainvist.com/.next/static/ 2>/dev/null | head -5

echo "=== N4 .env NEXT_PUBLIC check ==="
grep NEXT_PUBLIC /www/wwwroot/n4.namainvist.com/.env
