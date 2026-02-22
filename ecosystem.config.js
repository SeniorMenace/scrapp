module.exports = {
    apps: [
        {
            name: 'scraper-backend',
            cwd: './backend',
            script: 'dist/main.js',
            instances: 'max',
            exec_mode: 'cluster',
            env_production: {
                NODE_ENV: 'production',
                PORT: 4000,
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            max_memory_restart: '500M',
        },
        {
            name: 'scraper-frontend',
            cwd: './frontend',
            script: 'node_modules/.bin/next',
            args: 'start',
            instances: 2,
            exec_mode: 'cluster',
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            max_memory_restart: '300M',
        },
    ],
};
