'use strict';

const { uniq, difference, get, isUndefined, merge } = require('lodash');

module.exports = async function({ middlewareConfig, middlewares }) {
  /** Utils */

  // check if a middleware exists
  const middlewareExists = key => {
    return !isUndefined(middlewares[key]);
  };

  // check if a middleware is enabled
  const middlewareEnabled = key =>
    get(middlewareConfig, ['settings', key, 'enabled'], false) === true;

  // list of enabled middlewares
  const enabledMiddlewares = Object.keys(middlewares).filter(middlewareEnabled);

  // Method to initialize middlewares and emit an event.
  const initialize = middlewareKey => {
    if (middlewares[middlewareKey].loaded === true) return;

    const module = middlewares[middlewareKey].load;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(`(middleware: ${middlewareKey}) is taking too long to load.`),
        middlewareConfig.timeout || 1000
      );

      middlewares[middlewareKey] = merge(middlewares[middlewareKey], module);

      Promise.resolve()
        .then(() => module.initialize())
        .then(() => {
          clearTimeout(timeout);
          middlewares[middlewareKey].loaded = true;
          resolve();
        })
        .catch(err => {
          clearTimeout(timeout);

          if (err) {
            return reject(err);
          }
        });
    });
  };

  /**
   * Run init functions
   */

  // Run beforeInitialize of every middleware
  await Promise.all(
    enabledMiddlewares.map(key => {
      const { beforeInitialize } = middlewares[key].load;
      if (typeof beforeInitialize === 'function') {
        return beforeInitialize();
      }
    })
  );

  // run the initialization of an array of middlewares sequentially
  const initMiddlewaresSeq = async middlewareArr => {
    for (let key of uniq(middlewareArr)) {
      await initialize(key);
    }
  };

  const middlewaresBefore = get(middlewareConfig, 'load.before', [
    'responseTime',
    'logger',
    'cors',
    'responses',
    'gzip',
  ])
    .filter(middlewareExists)
    .filter(middlewareEnabled);

  const middlewaresAfter = get(middlewareConfig, 'load.after', [
    'parser',
    'router',
  ])
    .filter(middlewareExists)
    .filter(middlewareEnabled);

  const middlewaresOrder = get(middlewareConfig, 'load.order', [])
    .filter(middlewareExists)
    .filter(middlewareEnabled);

  const unspecifiedMiddlewares = difference(
    enabledMiddlewares,
    middlewaresBefore,
    middlewaresOrder,
    middlewaresAfter
  );

  // before
  await initMiddlewaresSeq(middlewaresBefore);

  // ordered // rest of middlewares
  await Promise.all([
    initMiddlewaresSeq(middlewaresOrder),
    Promise.all(unspecifiedMiddlewares.map(initialize)),
  ]);

  // after
  await initMiddlewaresSeq(middlewaresAfter);
};
