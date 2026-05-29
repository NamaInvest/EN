const { Client } = require('ssh2');

const code = `import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">الصفحة غير موجودة</h2>
      <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">العودة للرئيسية</Link>
    </div>
  );
}`;

const bashCommand = `cat << 'EOF' > /www/wwwroot/namainvist.com/src/app/not-found.tsx
${code}
EOF
cat << 'EOF' > /www/wwwroot/n1.namainvist.com/src/app/not-found.tsx
${code}
EOF
cd /www/wwwroot/namainvist.com && npm run build > build.log 2> build_err.log && pm2 restart nama-landing && cd /www/wwwroot/n1.namainvist.com && npm run build > build.log 2> build_err.log && pm2 restart nama-main
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d))
              .on('error', (d) => process.stderr.write(d))
              .on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
