'use strict';

const _ = require('lodash');

const { createController, createService } = require('../core-api');
const getURLFromSegments = require('../utils/url-from-segments');

const pickSchema = obj =>
  _.cloneDeep(
    _.pick(obj, [
      'connection',
      'collectionName',
      'info',
      'options',
      'attributes',
    ])
  );

module.exports = function(strapi) {
  // Retrieve Strapi version.
  strapi.config.uuid = _.get(strapi.config.info, 'strapi.uuid', '');
  strapi.config.info.customs = _.get(strapi.config.info, 'strapi', {});
  strapi.config.info.strapi = (
    _.get(strapi.config, 'info.dependencies.strapi') || ''
  ).replace(/(\^|~)/g, '');
  strapi.config.info.node = process.versions.node;

  // Set connections.
  strapi.connections = {};
  strapi.contentTypes = {};

  Object.keys(strapi.components).forEach(key => {
    const component = strapi.components[key];

    if (!component.connection)
      throw new Error(`Component ${key} is missing a connection attribute`);

    if (!component.collectionName)
      throw new Error(`Component ${key} is missing a collectionName attribute`);

    Object.assign(component, {
      __schema__: pickSchema(component),
      uid: key,
      modelType: 'component',
      globalId:
        component.globalId || _.upperFirst(_.camelCase(`component_${key}`)),
    });
  });

  // Set models.
  strapi.models = Object.keys(strapi.api || []).reduce((acc, apiName) => {
    for (let modelName in strapi.api[apiName].models) {
      let model = strapi.api[apiName].models[modelName];

      Object.assign(model, {
        __schema__: pickSchema(model),
        modelType: 'contentType',
        uid: `application::${apiName}.${modelName}`,
        apiName,
        modelName,
        globalId: model.globalId || _.upperFirst(_.camelCase(modelName)),
        collectionName:
          model.collectionName || `${modelName}`.toLocaleLowerCase(),
        connection:
          model.connection || strapi.config.get('database.defaultConnection'),
      });

      strapi.contentTypes[model.uid] = model;

      // find corresponding service and controller
      const userService = _.get(
        strapi.api[apiName],
        ['services', modelName],
        {}
      );
      const userController = _.get(
        strapi.api[apiName],
        ['controllers', modelName],
        {}
      );

      const service = Object.assign(
        createService({ model: modelName, strapi }),
        userService
      );

      const controller = Object.assign(
        createController({ service, model }),
        userController,
        { identity: userController.identity || _.upperFirst(modelName) }
      );

      _.set(strapi.api[apiName], ['services', modelName], service);
      _.set(strapi.api[apiName], ['controllers', modelName], controller);

      acc[modelName] = model;
    }
    return acc;
  }, {});

  // Set controllers.
  strapi.controllers = Object.keys(strapi.api || []).reduce((acc, key) => {
    for (let index in strapi.api[key].controllers) {
      let controller = strapi.api[key].controllers[index];
      controller.identity = controller.identity || _.upperFirst(index);
      acc[index] = controller;
    }

    return acc;
  }, {});

  // Set services.
  strapi.services = Object.keys(strapi.api || []).reduce((acc, key) => {
    for (let index in strapi.api[key].services) {
      acc[index] = strapi.api[key].services[index];
    }

    return acc;
  }, {});

  // Set routes.
  strapi.config.routes = Object.keys(strapi.api || []).reduce((acc, key) => {
    return acc.concat(_.get(strapi.api[key], 'config.routes') || {});
  }, []);

  // Init admin controllers.
  Object.keys(strapi.admin.controllers || []).forEach(key => {
    if (!strapi.admin.controllers[key].identity) {
      strapi.admin.controllers[key].identity = key;
    }
  });

  // Init admin models.
  Object.keys(strapi.admin.models || []).forEach(key => {
    let model = strapi.admin.models[key];

    Object.assign(model, {
      __schema__: pickSchema(model),
      modelType: 'contentType',
      uid: `strapi::${key}`,
      plugin: 'admin',
      modelName: key,
      identity: model.identity || _.upperFirst(key),
      globalId: model.globalId || _.upperFirst(_.camelCase(`admin-${key}`)),
      connection:
        model.connection || strapi.config.get('database.defaultConnection'),
    });

    strapi.contentTypes[model.uid] = model;
  });

  Object.keys(strapi.plugins).forEach(pluginName => {
    let plugin = strapi.plugins[pluginName];
    Object.assign(plugin, {
      controllers: plugin.controllers || [],
      services: plugin.services || [],
      models: plugin.models || [],
    });

    Object.keys(plugin.controllers).forEach(key => {
      let controller = plugin.controllers[key];

      Object.assign(controller, {
        identity: controller.identity || key,
      });
    });

    Object.keys(plugin.models || []).forEach(key => {
      let model = plugin.models[key];

      Object.assign(model, {
        __schema__: pickSchema(model),
        modelType: 'contentType',
        modelName: key,
        uid: `plugins::${pluginName}.${key}`,
        plugin: pluginName,
        collectionName:
          model.collectionName || `${pluginName}_${key}`.toLowerCase(),
        globalId:
          model.globalId || _.upperFirst(_.camelCase(`${pluginName}-${key}`)),
        connection:
          model.connection || strapi.config.get('database.defaultConnection'),
      });

      strapi.contentTypes[model.uid] = model;
    });

    // merge global configs with plugin's config
    _.merge(plugin.config, strapi.config.get(['plugins', pluginName], {}));
  });

  const REQUIRED_MIDDLEWARES = [
    'public',
    'favicon',
    'responses',
    'router',
    'logger',
    'boom',
    'cors',
    'xframe',
    'xss',
  ];

  // Preset config in alphabetical order.
  strapi.config.middleware.settings = Object.keys(strapi.middleware).reduce(
    (acc, middlewareName) => {
      const middleware = strapi.middleware[middlewareName];

      const defaultSettings = _.get(
        middleware,
        ['defaults', middlewareName],
        {}
      );

      const currentSettings = _.merge(
        {},
        _.cloneDeep(defaultSettings),
        strapi.config.get(['middleware', 'settings', middlewareName], {})
      );

      // force required middlewares
      if (REQUIRED_MIDDLEWARES.includes(middlewareName)) {
        _.set(currentSettings, 'enabled', true);
      }

      acc[middlewareName] = currentSettings;

      if (!_.has(acc[middlewareName], 'enabled')) {
        strapi.log.warn(
          `(middleware:${middlewareName}) wasn't loaded due to missing key \`enabled\` in the configuration`
        );
      }

      // Ensure that enabled key exist by forcing to false.
      _.defaults(acc[middlewareName], { enabled: false });

      return acc;
    },
    strapi.config.middleware.settings
  );

  strapi.config.hook.settings = Object.keys(strapi.hook).reduce(
    (acc, hookName) => {
      const hook = strapi.hook[hookName];

      const defaultSettings = _.get(hook, ['defaults', hookName], {});

      const currentSettings = _.merge(
        {},
        _.cloneDeep(defaultSettings),
        strapi.config.get(['hook', 'settings', hookName], {})
      );

      acc[hookName] = currentSettings;

      if (!_.has(acc[hookName], 'enabled')) {
        strapi.log.warn(
          `(hook:${hookName}) wasn't loaded due to missing key \`enabled\` in the configuration`
        );
      }

      // Ensure that enabled key exist by forcing to false.
      _.defaults(acc[hookName], { enabled: false });

      return acc;
    },
    {}
  );

  const serverConfig = strapi.config.get('server', {});

  const proxy = strapi.config.get('server.proxy', {});

  // check if proxy is enabled and construct url
  strapi.config.url = proxy.enabled
    ? getURLFromSegments({
        hostname: proxy.host,
        port: proxy.port,
        ssl: proxy.ssl,
      })
    : getURLFromSegments({
        hostname: serverConfig.host,
        port: serverConfig.port,
      });

  const adminPath = strapi.config.get('server.admin.path', 'admin');

  strapi.config.admin.url = new URL(adminPath, strapi.config.url).toString();
};
