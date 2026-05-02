#!/bin/bash
set -e

echo "🚀 Starting Deployment Process for Nama ERP..."

# 1. Pull latest code (if using git)
# git pull origin main

# 2. Build and start containers in detached mode
echo "📦 Building Docker containers..."
docker-compose build

echo "🛠️ Running database migrations..."
# Run prisma db push or migrate deploy inside a temporary container
docker-compose run --rm web npx prisma db push

echo "🚀 Starting application..."
docker-compose up -d

echo "✅ Deployment complete! Nama ERP is running on port 3000."
