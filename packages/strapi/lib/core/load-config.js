'use strict';

const { join } = require('path');
const { existsSync } = require('fs-extra');

const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const dotEnv = require('dotenv');

const defaultFile = 'default.js';
const defaultEnv = (process.env.NODE_ENV = 'development');

module.exports = (
  { env = defaultEnv, dir, configDir = 'config', envFile = '.env' } = {},
  defaults
) => {
  const config = defaults;

  if (!existsSync(join(dir, 'config'))) {
    throw new Error(
      `Missing config folder. Please create one in your app root directory`
    );
  }

  dotEnv.config({ path: path.resolve(dir, envFile) });

  const rootConfigDir = path.resolve(dir, configDir);

  const defaultConfigPath = path.join(rootConfigDir, defaultFile);
  if (fs.existsSync(defaultConfigPath)) {
    _.merge(config, require(defaultConfigPath));
  }

  const envConfPath = path.join(rootConfigDir, `${env}.js`);
  if (fs.existsSync(envConfPath)) {
    _.merge(config, require(envConfPath));
  }

  const configurator = Object.assign(config, {
    all() {
      return config;
    },
    get(path, defaultValue) {
      return _.get(config, path, defaultValue);
    },
    env(key, defaultValue) {
      return _.get(process.env, key, defaultValue);
    },
  });

  return configurator;
};
