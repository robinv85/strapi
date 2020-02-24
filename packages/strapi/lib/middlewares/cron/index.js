'use strict';

/**
 * Module dependencies
 */

const _ = require('lodash');
const cron = require('node-schedule');

/**
 * CRON hook
 */

module.exports = strapi => {
  return {
    /**
     * Initialize the hook
     */

    async initialize() {
      const tasks = strapi.config.get('functions.cron');

      if (_.isObject(tasks)) {
        Object.keys(tasks).forEach(task => {
          cron.scheduleJob(task, tasks[task]);
        });
      }
    },
  };
};
