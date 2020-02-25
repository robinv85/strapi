'use strict';

/**
 * Upload.js controller
 *
 * @description: A set of functions called "actions" of the `upload` plugin.
 */

const _ = require('lodash');

module.exports = {
  async upload(ctx) {
    const uploadService = strapi.plugins.upload.services.upload;
    const { errors, validators } = strapi.plugins.upload.services.validation;

    const config = strapi.plugins.upload.config;

    if (config.enabled === false) {
      throw strapi.errors.badRequest(null, { errors: [errors.uploadDisabled] });
    }

    const { refId, ref, source, field, path } = ctx.request.body || {};

    const requestFiles = _.get(ctx.request.files, 'files', []);
    const files = Array.isArray(requestFiles) ? requestFiles : [requestFiles];

    if (_.isEmpty(files)) {
      throw strapi.errors.badRequest(null, { errors: [errors.emptyFiles] });
    }

    const enhanceFile = async file => {
      validators.validateFileSize(file, config);

      const enhancedFile = await uploadService.bufferize(file);

      // Add details to the file to be able to create the relationships.
      if (refId && ref && field) {
        enhancedFile.related = [{ refId, ref, source, field }];
      }

      // TODO: check if documented
      if (path) {
        enhancedFile.path = path;
      }

      return enhancedFile;
    };

    const enhancedFiles = await Promise.all(
      files.map(file => enhanceFile(file))
    );

    const uploadedFiles = await uploadService.uploadFiles(
      enhancedFiles,
      config
    );

    // Send 200 `ok`
    ctx.send(uploadedFiles);
  },

  async getSettings(ctx) {
    const config = await strapi
      .store({
        environment: ctx.params.environment,
        type: 'plugin',
        name: 'upload',
      })
      .get({ key: 'provider' });

    ctx.send({
      providers: strapi.plugins.upload.config.providers,
      config,
    });
  },

  async updateSettings(ctx) {
    await strapi
      .store({
        environment: ctx.params.environment,
        type: 'plugin',
        name: 'upload',
      })
      .set({ key: 'provider', value: ctx.request.body });

    ctx.send({ ok: true });
  },

  async find(ctx) {
    ctx.body = await strapi.plugins['upload'].services.upload.fetchAll(
      ctx.query
    );
  },

  async findOne(ctx) {
    const data = await strapi.plugins['upload'].services.upload.fetch(
      ctx.params
    );

    if (!data) {
      return ctx.notFound('file.notFound');
    }

    ctx.body = data;
  },

  async count(ctx) {
    const data = await strapi.plugins['upload'].services.upload.count(
      ctx.query
    );

    ctx.body = { count: data };
  },

  async destroy(ctx) {
    const { id } = ctx.params;

    const file = await strapi.plugins['upload'].services.upload.fetch({ id });

    if (!file) {
      return ctx.notFound('file.notFound');
    }

    await strapi.plugins['upload'].services.upload.remove(file);

    ctx.body = file;
  },

  async search(ctx) {
    const { id } = ctx.params;

    const data = await strapi.query('file', 'upload').custom(searchQueries)({
      id,
    });

    ctx.body = data;
  },
};

const searchQueries = {
  bookshelf({ model }) {
    return ({ id }) => {
      return model
        .query(qb => {
          qb.whereRaw('LOWER(hash) LIKE ?', [
            `%${id}%`,
          ]).orWhereRaw('LOWER(name) LIKE ?', [`%${id}%`]);
        })
        .fetchAll()
        .then(results => results.toJSON());
    };
  },
  mongoose({ model }) {
    return ({ id }) => {
      const re = new RegExp(id, 'i');

      return model
        .find({
          $or: [{ hash: re }, { name: re }],
        })
        .lean();
    };
  },
};
