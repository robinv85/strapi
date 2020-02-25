module.exports = {
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT, 10) || 1337,
  },
  plugins: {
    graphql: {
      amountLimit: 5,
    },
    upload: {
      // sizeLimit: 5,
      // provider: 'local',
      // providerOptions: {
      //   uploadDir: 'uploads',
      // },
      // provider: 'aws-s3',
      // providerOptions: {
      //   accessKeyId: '',
      //   secretAccessKey: '',
      //   bucket: '',
      // },
      // provider: 'cloudinary',
      // providerOptions: {
      //   cloud_name: '',
      //   api_key: '',
      //   api_secret: '',
      // },
      // provider: 'rackspace',
      // providerOptions: {
      //   container: '',
      //   username: '',
      //   apiKey: '',
      //   region: '',
      // },
    },
  },
};
