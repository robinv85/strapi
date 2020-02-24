'use strict';

/**
 * Custom responses hook
 */

const _ = require('lodash');

module.exports = strapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      strapi.app.use(async (ctx, next) => {
        await next();

        const responseFn = strapi.config.get([
          'functions',
          'responses',
          ctx.status,
        ]);

        // Call custom responses.
        if (_.isFunction(responseFn)) {
          await responseFn.call(this, ctx);
        }

        // Set X-Powered-By header.
        if (
          strapi.config.get('middleware.settings.poweredBy.enabled') !== false
        ) {
          ctx.set(
            'X-Powered-By',
            strapi.config.get(
              'middleware.settings.poweredBy.value',
              'Strapi <strapi.io>'
            )
          );
        }
      });
    },
  };
};
