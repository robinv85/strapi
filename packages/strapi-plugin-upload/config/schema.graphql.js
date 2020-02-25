'use strict';

const path = require('path');
const _ = require('lodash');
const uuid = require('uuid/v4');

module.exports = {
  mutation: `
    upload(refId: ID, ref: String, field: String, source: String, file: Upload!): UploadFile!
    multipleUpload(refId: ID, ref: String, field: String, source: String, files: [Upload]!): [UploadFile]!
  `,
  resolver: {
    Query: {
      file: false,
      files: {
        resolver: {
          plugin: 'upload',
          handler: 'Upload.find',
        },
      },
    },
    Mutation: {
      createFile: false,
      updateFile: false,
      deleteFile: false,
      upload: {
        description: 'Upload one file',
        plugin: 'upload',
        resolverOf: 'Upload.upload',
        resolver: async (obj, { file: upload, ...fields }) => {
          const file = await formatFile(upload, fields);

          const config = strapi.plugins.upload.config;
          const uploadedFiles = await strapi.plugins.upload.services.upload.uploadFile(
            file,
            config
          );

          // Return response.
          return uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles;
        },
      },
      multipleUpload: {
        description: 'Upload one file',
        plugin: 'upload',
        resolverOf: 'Upload.upload',
        resolver: async (obj, { files: uploads, ...fields }) => {
          const files = await Promise.all(
            uploads.map(upload => formatFile(upload, fields))
          );

          const config = strapi.plugins.upload.config;
          const uploadedFiles = await strapi.plugins.upload.services.upload.uploadFiles(
            files,
            config
          );

          // Return response.
          return uploadedFiles;
        },
      },
    },
  },
};

const streamToSize = stream => {
  // / 1000).toFixed(2)
  let size = 0;
  return new Promise((resolve, reject) => {
    stream.on('readable', () => {
      var chunk;
      while ((chunk = stream.read())) {
        size += chunk.length;
      }
    });

    stream.on('end', () => resolve((size / 1000).toFixed(2)));
    stream.on('error', err => reject(err));
  });
};

const formatFile = async (upload, fields) => {
  const uploadService = strapi.plugins.upload.services.upload;
  const { filename, mimetype, createReadStream } = await upload;

  const fileData = {
    createReadStream,
    unlinkTmp() {},
    name: filename,
    sha256: await uploadService.niceHash({ createReadStream }),
    hash: uuid().replace(/-/g, ''),
    ext: path.extname(filename),
    mime: mimetype,
    size: await streamToSize(createReadStream()),
  };

  const { refId, ref, source, field } = fields;

  // Add details to the file to be able to create the relationships.
  if (refId && ref && field) {
    fileData.related = [
      {
        refId,
        ref,
        source,
        field,
      },
    ];
  }

  if (fields.path) {
    fileData.path = fields.path;
  }

  return fileData;
};
