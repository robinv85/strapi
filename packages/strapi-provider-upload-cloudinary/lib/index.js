'use strict';

// Public node modules.
const cloudinary = require('cloudinary').v2;

module.exports = {
  provider: 'cloudinary',
  name: 'Cloudinary',
  init(config) {
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    });

    return {
      upload(file) {
        return new Promise((resolve, reject) => {
          const upload_stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'samples' },
            (err, image) => {
              if (err) {
                return reject(new Error(err.message));
              }

              file.url = image.secure_url;
              file.provider_metadata = {
                public_id: image.public_id,
                resource_type: image.resource_type,
              };

              resolve();
            }
          );

          file.createReadStream().pipe(upload_stream);
        });
      },
      async delete(file) {
        const { resource_type, public_id } = file.provider_metadata;
        const response = await cloudinary.uploader.destroy(public_id, {
          invalidate: true,
          resource_type: resource_type || 'image',
        });

        if (response.result !== 'ok') {
          throw {
            error: new Error(response.result),
          };
        }
      },
    };
  },
};
