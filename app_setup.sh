cd /var/www/namasoft

cat > .env << 'ENV'
DATABASE_URL="postgresql://namasoft:Nama2024secure@localhost:5432/namadb?schema=public"
JWT_SECRET="namasoft-production-secret-key-2024-x7k9m2p4"
NEXT_PUBLIC_APP_NAME="äãÇÁ ÓæÝÊ"
NEXT_PUBLIC_APP_NAME_EN="NamaaSoft"
NEXT_PUBLIC_CURRENCY="ÑíÇá"
NEXT_PUBLIC_TAX_RATE="15"
TELEGRAM_BOT_TOKEN="8469277343:AAGCWUh1NNIGrB4IwaUOOu-XFkWn1Sskio0"
OPENAI_API_KEY=""
ENV

npm install --production=false
npx prisma generate
npx prisma db push
npx tsx prisma/seed-accounts.ts || echo "Seed skipped"
npm run build
pm2 delete namasoft 2>/dev/null
pm2 start npm --name "namasoft" -- start
pm2 save
pm2 startup systemd -u root --hp /root
