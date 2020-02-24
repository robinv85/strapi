'use strict';

const { resolve } = require('path');
const locale = require('koa-locale');
const i18n = require('koa-i18n');

module.exports = strapi => {
  return {
    initialize() {
      const { key, ...options } = strapi.config.get(
        'middleware.settings.language'
      );

      locale(strapi.app, key);

      const directory = resolve(
        strapi.dir,
        strapi.config.paths.config,
        'locales'
      );

      strapi.app.use(
        i18n(strapi.app, {
          directory,
          ...options,
        })
      );
    },
  };
};
