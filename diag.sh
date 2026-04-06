#!/bin/bash
echo "=== N3 .next exists? ==="
ls /www/wwwroot/n3.namainvist.com/.next/ | head -10
echo "=== N4 .next exists? ==="
ls /www/wwwroot/n4.namainvist.com/.next/ | head -10
echo "=== N3 CSS files? ==="
find /www/wwwroot/n3.namainvist.com/.next/static -name "*.css" 2>/dev/null | head -5
echo "=== N4 CSS files? ==="
find /www/wwwroot/n4.namainvist.com/.next/static -name "*.css" 2>/dev/null | head -5
echo "=== N3 postcss? ==="
ls /www/wwwroot/n3.namainvist.com/postcss.config* 2>/dev/null || echo "NONE"
echo "=== N4 postcss? ==="
ls /www/wwwroot/n4.namainvist.com/postcss.config* 2>/dev/null || echo "NONE"
