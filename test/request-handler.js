/* eslint import/no-unresolved:0 */
/* eslint-env mocha */
const assert = require('assert');
const { AwsV4Signer } = require('aws4fetch');

// shims browser objects
const {
  TextEncoder,
  TextDecoder,
} = require('text-encoding-shim');
const {
  URL,
} = require('url'); // Requires node 7.10.0
const {
  Headers,
} = require('node-fetch');
const webcrypto = require('isomorphic-webcrypto');

global.TextDecoder = TextDecoder;
global.URL = URL;
global.Headers = Headers;
global.crypto = webcrypto;

global.chrome = {
  runtime: {
    id: 'webextension-polyfill-shim',
  },
  storage: {
    onChanged: {
      addListener: () => { },
    },
    sync: {
      get: defaults => defaults,
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

const requestHandler = require('../src/request-handler');

beforeEach(() => {
  requestHandler.state = {
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
    reqs: {},
  };
});

describe('Request Handler', () => {
  describe('- onBeforeRequest ', () => {
    it('should do nothing when there is no request body', () => {
      requestHandler.onRequest({
        url: 'https://example.com',
      });
      assert.deepEqual(requestHandler.state.reqs, {});
    });
    it('should save the request body for later use', () => {
      const requestBody = new TextEncoder('utf-8').encode('testing');
      requestHandler.onRequest({
        requestId: 'test',
        requestBody,
        url: 'https://example.com',
      });
      assert.deepEqual(requestHandler.state.reqs.test, requestBody);
    });
  });
  describe('- onBeforeSendHeaders ', () => {
    it('should sign headers', async () => {
      const signed = await new AwsV4Signer({
        url: new URL('https://sqs.us-east-1.amazonaws.com/?Action=ListQueues'),
        accessKeyId: 'test',
        secretAccessKey: 'test',
        method: 'GET',
        headers: {},
      }).sign();

      const signedHeaders = [
        ['Host', signed.url.host],
        ...signed.headers.entries()].map(x => ({
        name: x[0].toString(),
        value: x[1].toString(),
      }));

      const output = (await requestHandler.onHeaders({
        url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
        method: 'GET',
        requestHeaders: [],
        requestId: 'test',
      })).requestHeaders;

      assert.deepEqual(output, signedHeaders);
    });
  });
});
