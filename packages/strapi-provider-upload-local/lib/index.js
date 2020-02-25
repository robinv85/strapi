'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const unlink = promisify(fs.unlink);

module.exports = {
  provider: 'local',
  name: 'Local server',
  // TODO: add folder option
  init({ uploadDir = 'uploads' }) {
    const publicDir = strapi.config.get(
      'middleware.settings.public.path',
      'public'
    );
    const baseDir = path.join(strapi.dir, publicDir, uploadDir);

    return {
      upload(file) {
        const filename = `${file.hash}${file.ext}`;

        return new Promise((resolve, reject) => {
          const reader = file.createReadStream();
          const stream = fs.createWriteStream(
            path.join(baseDir, `${filename}`)
          );

          reader.pipe(stream);

          stream.on('finish', () => {
            file.url = `/${uploadDir}/${filename}`;
            resolve();
          });

          stream.on('error', reject);
        });
      },

      async delete(file) {
        const filename = `${file.hash}${file.ext}`;
        const filePath = path.join(baseDir, `${filename}`);
        await unlink(filePath);
      },
    };
  },
};
