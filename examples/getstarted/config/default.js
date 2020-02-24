module.exports = {
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT, 10) || 1337,
    proxy: false,
    admin: {
      autoOpen: false,
    },
  },
  database: require('./database'),
  plugins: {
    graphql: {
      amountLimit: 100,
    },
    upload: {
      provider: {
        client: 'local',
        options: {
          cloud_name: '',
          api_key: '',
          api_secret: '',
        },
      },
    },
  },
  middleware: {
    timeout: 3000,
    load: {
      before: ['responseTime', 'logger', 'cors', 'responses', 'gzip'],
      order: ['session', 'xframe', 'public'],
      after: ['parser', 'router'],
    },
    settings: {
      // disable a middleware
      session: {
        enabled: true,
      },
      parser: {
        multipart: false,
      },
    },
  },
};
