'use strict';

/**
 * Upload.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const uuid = require('uuid/v4');

module.exports = {
  async bufferize(files) {
    return Array.isArray(files)
      ? Promise.all(files.map(file => this.createBuffer(file)))
      : this.createBuffer(files);
  },

  async createBuffer(file) {
    const createReadStream = () => {
      return fs.createReadStream(file.path);
    };

    return {
      createReadStream,
      unlinkTmp() {
        if (fs.existsSync(file.tmpPath)) {
          fs.unlinkSync(file.tmpPath);
        }
      },
      name: file.name,
      sha256: await this.niceHash({ createReadStream }),
      hash: uuid().replace(/-/g, ''),
      ext: path.extname(file.name),
      mime: file.type,
      size: (file.size / 1000).toFixed(2),
    };
  },

  async uploadFiles(files, config) {
    return Promise.all(files.map(file => this.uploadFile(file, config)));
  },

  async uploadFile(file, config) {
    const provider = await strapi.plugins.upload.providers
      .get(config.provider)
      .init(config.providerOptions);

    await provider.upload(file);

    const res = await this.add(
      Object.assign(file, { provider: config.provider })
    );

    // Remove temp file
    file.unlinkTmp();

    strapi.eventHub.emit('media.create', { media: res });
    return res;
  },

  add(values) {
    return strapi.query('file', 'upload').create({
      name: values.name,
      hash: values.hash,
      sha256: values.sha256,
      ext: values.ext,
      mime: values.mime,
      size: values.size,
      url: values.url,
      provider: values.provider,
      provider_metadata: values.provider_metadata,
      related: values.related,
    });
  },

  fetch(params) {
    return strapi.query('file', 'upload').findOne({
      id: params.id,
    });
  },

  fetchAll(params) {
    return strapi.query('file', 'upload').find(params);
  },

  count(params) {
    return strapi.query('file', 'upload').count(params);
  },

  async remove(file) {
    const config = strapi.plugins.upload.config;

    // execute delete function of the provider
    if (file.provider === config.provider) {
      const provider = await strapi.plugins.upload.providers
        .get(config.provider)
        .init(config.providerOptions);

      await provider.delete(file);
    }

    const media = await strapi.query('file', 'upload').findOne({
      id: file.id,
    });

    strapi.eventHub.emit('media.delete', { media });

    return strapi.query('file', 'upload').delete({ id: file.id });
  },

  async uploadToEntity(params, files, source) {
    const { validators } = strapi.plugins.upload.services.validation;

    const config = strapi.plugins.upload.config;
    const model = strapi.getModel(params.model, source);

    const doUpload = async attribute => {
      const buffers = await this.bufferize(files[attribute]);
      const enhancedFiles = buffers.map(file => {
        validators.validateFileSize(file, config);

        const details = model.attributes[attribute];

        file[details.via] = [
          {
            refId: params.id,
            ref: params.model,
            source,
            field: attribute,
          },
        ];

        return file;
      });

      // Make upload async.
      return this.uploadFiles(enhancedFiles, config);
    };

    return Promise.all(
      Object.keys(files).map(attribute => doUpload(attribute))
    );
  },

  niceHash({ createReadStream }) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');

      try {
        const stream = createReadStream();

        stream.on('data', function(data) {
          hash.update(data);
        });

        stream.on('end', function() {
          const sha = hash
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\//g, '-')
            .replace(/\+/, '_');

          resolve(sha);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
};
