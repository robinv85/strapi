'use strict';

const fs = require('fs');

// Helpers.
const { registerAndLogin } = require('../../../test/helpers/auth');
const { createAuthRequest } = require('../../../test/helpers/request');

let rq;

const defaultProviderConfig = {
  provider: 'local',
  name: 'Local server',
  enabled: true,
  sizeLimit: 1000000,
};

const resetProviderConfigToDefault = () => {
  return setConfigOptions(defaultProviderConfig);
};

const setConfigOptions = assign => {
  return rq.put('/upload/settings/development', {
    body: {
      ...defaultProviderConfig,
      ...assign,
    },
  });
};

describe('Upload plugin end to end tests', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);
  }, 60000);

  afterEach(async () => {
    await resetProviderConfigToDefault();
  });

  describe('POST /upload => Upload a file', () => {
    test('Simple image upload', async () => {
      const res = await rq.post('/upload', {
        formData: {
          files: fs.createReadStream(__dirname + '/rec.jpg'),
        },
      });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toEqual(
        expect.objectContaining({
          id: expect.anything(),
          sha256: expect.any(String),
          hash: expect.any(String),
          size: expect.any(Number),
          url: expect.any(String),
          provider: 'local',
          name: 'rec.jpg',
          ext: '.jpg',
          mime: 'image/jpeg',
        })
      );
    });

    test('Rejects when no files are provided', async () => {
      const res = await rq.post('/upload', {
        formData: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  test.todo('GET /upload/files => Find files');
  test.todo('GET /upload/files/count => Count available files');
  test.todo('GET /upload/files/:id => Find one file');
  test.todo('GET /upload/search/:id => Search files');
  test.todo('DELETE /upload/files/:id => Delete a file ');
});
