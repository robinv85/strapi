'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */
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

  strapi.config.plugins.upload = _.merge(
    {
      enabled: true,
      provider: 'local',
      providerOptions: {
        sizeLimit: 1000000,
      },
    },
    strapi.config.plugins.upload
  );
};
