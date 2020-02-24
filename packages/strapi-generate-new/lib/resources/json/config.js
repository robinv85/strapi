'use strict';

const _ = require('lodash');

const tmpl = `
module.exports = {
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT, 10) || 1337,
  },
  database: {
    defaultConnection: 'default',
    connections: {
      default: {
        connector: '<%= connector %>',
        settings: {
          client: process.env.DATABASE_CLIENT || '<%= settings.client %>',
          filename: process.env.DATABASE_FILENAME || '<%= settings.filename %>',
          // host: process.env.DATABASE_HOST || '<%= settings.host %>',
          // port: parseInt(process.env.DATABASE_PORT,10) || '<%= settings.port %>',
          // database: process.env.DATABASE_NAME || '<%= settings.database %>',
          // username: process.env.DATABASE_USERNAME || '<%= settings.username %>',
          // password: process.env.DATABASE_PASSWORD || '<%= settings.password %>',
        },
        options: {
          useNullAsDefault: true,
        }
      },
    },
  },
}
`;

// create one template per DB

module.exports = ({ connection }) => {
  var compiled = _.template(tmpl);

  // // Production/Staging Template
  // if (['production', 'staging'].includes(env)) {
  //   const settingsBase = {
  //     client: connection.settings.client,
  //     host: "${process.env.DATABASE_HOST || '127.0.0.1'}",
  //     port: '${process.env.DATABASE_PORT || 27017}',
  //     database: "${process.env.DATABASE_NAME || 'strapi'}",
  //     username: "${process.env.DATABASE_USERNAME || ''}",
  //     password: "${process.env.DATABASE_PASSWORD || ''}",
  //   };

  //   const optionsBase = {};

  //   return {
  //     defaultConnection: 'default',
  //     connections: {
  //       default: {
  //         connector: connection.connector,
  //         settings: settingsBase,
  //         options: optionsBase,
  //       },
  //     },
  //   };
  // }

  return compiled(connection);
};
