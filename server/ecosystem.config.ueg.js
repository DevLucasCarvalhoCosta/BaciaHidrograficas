module.exports = {
  apps: [{
    name: 'ana-backend',
    script: './dist/index.js',
    cwd: '/home/usuario/ana-backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/usuario/logs/ana-backend-error.log',
    out_file: '/home/usuario/logs/ana-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    watch: false,
    max_memory_restart: '500M'
  }]
};
