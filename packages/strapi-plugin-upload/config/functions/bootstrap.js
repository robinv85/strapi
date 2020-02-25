'use strict';

const _ = require('lodash');

module.exports = async () => {
  const _providers = new Map();
  strapi.plugins.upload.providers = {
    get(key) {
      if (!_providers.has(key)) {
        throw new Error(
          `The provider package isn't installed. Please run \`npm install strapi-provider-upload-${key}\``
        );
      }

      return _providers.get(key);
    },
  };

  const installedProviders = Object.keys(strapi.config.info.dependencies)
    .filter(d => d.includes('strapi-provider-upload-'))
    .concat('strapi-provider-upload-local');

  for (let installedProvider of _.uniq(installedProviders)) {
    const key = installedProvider.replace('strapi-provider-upload-', '');
    _providers.set(key, require(installedProvider));
  }
};
