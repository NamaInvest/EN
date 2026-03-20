const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const invoiceRoute = fs.readFileSync('src/app/api/bookings/invoice/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const bookingsPage = fs.readFileSync('src/app/(dashboard)/bookings/page.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const calendarPage = fs.readFileSync('src/app/(dashboard)/bookings/calendar/page.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Phase 1 & 2 Bookings Upgrades..."
for i in {1..10}
do
  echo "Transmitting Bookings logic to n$i..."
  
  INVOICE_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/bookings/invoice"
  PAGE_DIR="/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)/bookings"
  CALENDAR_DIR="/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)/bookings/calendar"
  
  mkdir -p $INVOICE_DIR
  mkdir -p $PAGE_DIR
  mkdir -p $CALENDAR_DIR
  
  echo '${invoiceRoute}' > $INVOICE_DIR/route.ts
  echo '${bookingsPage}' > $PAGE_DIR/page.tsx
  echo '${calendarPage}' > $CALENDAR_DIR/page.tsx
  
  cd /www/wwwroot/n$i.namainvist.com
  npm run build
  pm2 reload n$i --update-env
  echo "n$i SMART BOOKINGS LIVE."
done
echo "BOOKINGS CALENDAR AND CONVERSION BRIDGE SUCCESSFULLY DEPLOYED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_bookings.sh\n' + bashScript + '\nEOF\nbash /root/deploy_bookings.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
