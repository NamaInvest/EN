/**
 * PM2 Ecosystem Config — SaaS Multi-Tenant App
 * يضمن أن PM2 يشغّل التطبيق من المجلد الصحيح
 */
module.exports = {
  apps: [
    {
      name: 'saas-app',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3500',
      cwd: '/www/wwwroot/n11.namainvist.com',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3500',
      },
      max_restarts: 5,
      restart_delay: 3000,
      error_file: '/root/.pm2/logs/saas-app-error.log',
      out_file: '/root/.pm2/logs/saas-app-out.log',
    },
  ],
};
