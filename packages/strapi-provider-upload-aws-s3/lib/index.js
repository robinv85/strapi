'use strict';

const util = require('util');
const AWS = require('aws-sdk');

module.exports = {
  provider: 'aws-s3',
  name: 'Amazon Web Service S3',
  init(config) {
    // configure AWS S3 bucket connection
    AWS.config.update({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    });

    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {
        Bucket: config.bucket,
      },
    });

    const uploadFile = util.promisify(S3.upload).bind(S3);
    const deleteObject = util.promisify(S3.deleteObject).bind(S3);

    return {
      async upload(file) {
        const path = file.path ? `${file.path}/` : '';

        const { Location } = await uploadFile({
          Key: `${path}${file.hash}${file.ext}`,
          Body: file.createReadStream(),
          ACL: 'public-read',
          ContentType: file.mime,
        });

        file.url = Location;
      },

      delete(file) {
        const path = file.path ? `${file.path}/` : '';

        return deleteObject({
          Key: `${path}${file.hash}${file.ext}`,
        });
      },
    };
  },
};
