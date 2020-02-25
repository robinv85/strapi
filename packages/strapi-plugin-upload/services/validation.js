'use strict';

const errors = {
  uploadDisabled: {
    id: 'Upload.status.disabled',
    message: 'File upload is disabled',
  },
  emptyFiles: {
    id: 'Upload.status.empty',
    message: 'Files are empty',
  },
  sizeLimit: filename => ({
    id: 'Upload.status.sizeLimit',
    message: `${filename} file is bigger than limit size!`,
    values: { file: filename },
  }),
};

const validators = {
  validateFileSize(file, config) {
    if (file.size > config.sizeLimit) {
      throw strapi.errors.badRequest(null, {
        errors: [errors.sizeLimit(file.name)],
      });
    }
  },
};

module.exports = {
  errors,
  validators,
};
