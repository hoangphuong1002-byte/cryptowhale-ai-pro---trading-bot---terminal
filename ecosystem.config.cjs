/**
 * CryptoWhale AI Pro - PM2 24/7 Process Manager Configuration
 * Quản lý tiến trình chạy nền liên tục, tự động hồi phục khi có sự cố mạng/máy chủ
 */

module.exports = {
  apps: [
    {
      name: 'cryptowhale-quant-bot',
      script: 'server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1024M',
      exp_backoff_restart_delay: 1000,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DISABLE_HMR: 'true',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DISABLE_HMR: 'true',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
