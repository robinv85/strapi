'use strict';

const { join, resolve } = require('path');
const { exists } = require('fs-extra');

const _ = require('lodash');
const dotEnv = require('dotenv');
const loadFiles = require('../load/load-files');

const defaultEnv = process.env.NODE_ENV || 'development';

const loadConfig = dir =>
  loadFiles(dir, '*.+(js|json)', {
    shouldUseFileNameAsKey: () => false,
    withFileName: false,
  });

module.exports = async (
  { env = defaultEnv, dir, configDir = 'config', envFile = '.env' } = {},
  defaults
) => {
  const config = defaults;

  // load env file
  dotEnv.config({ path: resolve(dir, envFile) });

  if (!(await exists(join(dir, 'config')))) {
    throw new Error(
      `Missing config folder. Please create one in your app root directory`
    );
  }

  _.merge(config, await loadConfig(join(dir, 'config')));

  config.functions = await loadFiles(
    join(dir, configDir, 'functions'),
    '**/*.+(js|json)',
    {
      withFileName: false,
    }
  );

  const rootConfigDir = resolve(dir, configDir);
  const envConfPath = join(rootConfigDir, env);

  if (await exists(envConfPath)) {
    _.merge(config, await loadConfig(join(dir, 'config', env)));
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
