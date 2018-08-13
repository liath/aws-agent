/* eslint import/no-unresolved:0 */
/* eslint-env mocha */
const assert = require('assert');
const aws4 = require('aws4');
const {
  TextEncoder,
  TextDecoder,
} = require('text-encoding');
const {
  URL,
} = require('url'); // Requires node 7.10.0

// Kind of a dirty hack
global.TextDecoder = TextDecoder;
global.URL = URL;

global.chrome = {
  storage: {
    onChanged: {
      addListener: () => {},
    },
  },
  webRequest: {
    onBeforeRequest: {
      addListener: () => {},
    },
    onBeforeSendHeaders: {
      addListener: () => {},
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
      requestHandler.onRequest({
        requestId: 'test',
        requestBody: {
          raw: [{
            bytes: new TextEncoder('utf-8').encode('testing'),
          }],
        },
        url: 'https://example.com',
      });
      assert.deepEqual(requestHandler.state.reqs.test, 'testing');
    });
  });
  describe('- onBeforeSendHeaders ', () => {
    it('should sign headers', () => {
      const signedHeaders = Object.entries(aws4.sign({
        host: 'sqs.us-east-1.amazonaws.com',
        path: '/?Action=ListQueues',
        method: 'GET',
      }, {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      }).headers).map(x => ({
        name: x[0].toString(),
        value: x[1].toString(),
      }));
      const output = requestHandler.onHeaders({
        url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
        method: 'GET',
        requestHeaders: [],
        requestId: 'test',
      }).requestHeaders;
      assert.deepEqual(output, signedHeaders);
    });
  });
});
