/* eslint-env mocha */
const assert = require('assert');

global.chrome = {
  runtime: {
    id: 'shim',
  },
  storage: {
    onChanged: {
      addListener: () => { },
    },
  },
  webRequest: {
    onBeforeRequest: {
      addListener: () => { },
    },
    onBeforeSendHeaders: {
      addListener: () => { },
    },
  },
};

const Extension = require('../src/extension');

const ext = new Extension(() => {});

beforeEach(() => {
  ext.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  };
  ext.reqs = {};
});

describe('Request Handler', () => {
  describe('- onBeforeRequest ', () => {
    it('should bail when there\'s no creds', () => {
      ext.credentials = {};

      const pristine = {
        requestHeaders: [{
          test: 'hallo!',
        }],
      };

      const output = ext.onRequest({
        ...pristine,
      });

      assert.deepEqual(pristine, output);
    });

    it('should return nothing', () => {
      ext.onRequest({
        url: 'https://example.com',
      });
      assert.deepEqual(ext.reqs, {});
    });

    it('should redirect when path changes after url-encoding', () => {
      const res = ext.onRequest({
        requestId: 'test',
        url: 'https://example.com/%7E',
      });

      assert.deepEqual(res, {
        redirectUrl: 'https://example.com/~',
      }, 'URL re-encoding check failed, AWS performs re-encoding when checking the signature on their end so we must redirect to make sure we are signing the same thing they are veryifying against.');
    });

    it('should redirect deprecated S3 urls', () => {
      const res = ext.onRequest({
        requestId: 'test',
        url: 'https://test.s3-us-west-3.amazonaws.com/test',
      });

      assert.deepEqual(res, {
        redirectUrl: 'https://test.s3.us-west-3.amazonaws.com/test',
      }, 'we have to rewrite some S3 urls, per discussion here https://github.com/mhart/aws4fetch/issues/13');
    });

    it('should save the request body for later use', () => {
      const requestBody = new TextEncoder('utf-8').encode('testing');
      ext.onRequest({
        requestId: 'test',
        requestBody,
        url: 'https://example.com',
      });
      assert.deepEqual(ext.reqs.test, requestBody);
    });
  });

  describe('- onBeforeSendHeaders ', () => {
    it('should bail when there\'s no creds', () => {
      ext.credentials = {};

      const pristine = {
        requestHeaders: [{
          test: 'hallo!',
        }],
      };

      const output = ext.onHeaders({
        ...pristine,
      });

      assert.deepEqual(pristine, output);
    });

    it('should call signer', () => {
      const tracker = new assert.CallTracker();

      ext.signer = tracker.calls(req => {}, 1);

      ext.onHeaders({
        url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
        method: 'GET',
        requestHeaders: [{
          name: 'test',
          value: 'test',
        }, {
          name: 'connection',
          value: 'stripped',
        }],
        requestId: 'test',
      });

      tracker.verify();
    });

    it('should handle raw request body', () => {
      const tracker = new assert.CallTracker();

      ext.signer = tracker.calls(req => {}, 1);
      ext.reqs.test = {
        raw: [{
          bytes: new TextEncoder('utf-8').encode('testing'),
        }],
      };

      ext.onHeaders({
        url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
        method: 'GET',
        requestHeaders: [],
        requestId: 'test',
      });

      tracker.verify();
    });

    it('should handle raw request body', () => {
      const tracker = new assert.CallTracker();

      ext.signer = tracker.calls(req => {}, 1);
      ext.reqs.test = {
        formData: {
          hot: 'garbage',
        },
      };

      ext.onHeaders({
        url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
        method: 'GET',
        requestHeaders: [{
          name: 'content-type',
          value: 'multipart/form-data',
        }],
        requestId: 'test',
      });

      tracker.verify();
    });
  });
});

