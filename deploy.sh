#!/bin/bash
cd /var/www/namasoft

# 1. Create .env file
cat > .env << 'ENV'
DATABASE_URL="postgresql://namasoft:Nama2024secure@localhost:5432/namadb?schema=public"
JWT_SECRET="namasoft-production-secret-key-2024-x7k9m2p4"
NEXT_PUBLIC_APP_NAME="نماء سوفت"
NEXT_PUBLIC_APP_NAME_EN="NamaaSoft"
NEXT_PUBLIC_CURRENCY="ريال"
NEXT_PUBLIC_TAX_RATE="15"
TELEGRAM_BOT_TOKEN="8469277343:AAGCWUh1NNIGrB4IwaUOOu-XFkWn1Sskio0"
OPENAI_API_KEY=""
ENV
echo "✅ .env created!"

# 2. Install dependencies
npm install --production=false
echo "✅ npm install done!"

# 3. Generate Prisma client & migrate
npx prisma generate
npx prisma db push
echo "✅ Database migrated!"

# 4. Seed accounts
npx tsx prisma/seed-accounts.ts || echo "Seed skipped"

# 5. Build Next.js
npm run build
echo "✅ Build complete!"

# 6. Start with PM2
pm2 delete namasoft 2>/dev/null
pm2 start npm --name "namasoft" -- start
pm2 save
pm2 startup systemd -u root --hp /root
echo "✅ App running with PM2!"
echo "🎉 Deployment complete! Visit http://95.217.187.44"
