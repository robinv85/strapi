module.exports = {
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT, 10) || 1337,
  },
  plugins: {
    graphql: {
      amountLimit: 5,
    },
  },
};
