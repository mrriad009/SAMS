/** PM2 process file — run from project root: pm2 start ecosystem.config.cjs --env production */
module.exports = {
  apps: [
    {
      name: 'attendance-api',
      cwd: './server',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
    },
  ],
};
