'use strict';

// Public node modules.
const pkgcloud = require('pkgcloud');

module.exports = {
  provider: 'rackspace',
  name: 'Rackspace Cloud',
  init(config) {
    const options = { container: config.container };
    const client = pkgcloud.storage.createClient({
      provider: 'rackspace',
      username: config.username,
      apiKey: config.apiKey,
      region: config.region,
    });

    const remoteURL = () =>
      new Promise((resolve, reject) => {
        return client.getContainer(config.container, (err, res) => {
          if (err && !res) return reject(err);
          return resolve(res);
        });
      });

    return {
      upload(file) {
        const readStream = file.createReadStream();
        const writeStream = client.upload(
          Object.assign({}, options, {
            remote: file.name,
            contentType: file.mime,
          })
        );

        return new Promise((resolve, reject) => {
          readStream.pipe(writeStream);
          writeStream.on('error', error => error && reject(error));
          writeStream.on('success', result => {
            remoteURL()
              .then(data =>
                resolve(
                  Object.assign(file, {
                    name: result.name,
                    mime: result.contentType,
                    url: `${data.cdnSslUri}/${result.name}`,
                  })
                )
              )
              .catch(err => reject(err));
          });
        });
      },

      delete(file) {
        return new Promise((resolve, reject) => {
          client.removeFile(config.container, file.name, error => {
            if (error) return reject(error);
            return resolve();
          });
        });
      },
    };
  },
};
