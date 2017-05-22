/* eslint import/no-unresolved:0 */
/* eslint-env mocha */
const assert = require('assert');
const aws4 = require('aws4');
const requestHandler = require('../src/request-handler');
const TextEncoder = require('text-encoding').TextEncoder;
const TextDecoder = require('text-encoding').TextDecoder;
const URL = require('url').URL; // Requires node 7.10.0

// Kind of a dirty hack
global.TextDecoder = TextDecoder;
global.URL = URL;

beforeEach(() => {
  requestHandler.state = {
    credentials: { accessKeyId: '', secretAccessKey: '' },
    reqs: {},
  };
});

describe('Request Handler', () => {
  describe('- onBeforeRequest Hook', () => {
    it('should do nothing when there is no request body', () => {
      requestHandler.onRequest({});
      assert.deepEqual(requestHandler.state.reqs, {});
    });
    it('should save the request body for later use', () => {
      requestHandler.onRequest({
        requestId: 'test',
        requestBody: { raw: [{ bytes: new TextEncoder('utf-8').encode('testing') }] },
      });
      assert.deepEqual(requestHandler.state.reqs.test, 'testing');
    });
  });
  describe('- onBeforeSendHeaders Hook', () => {
    it('should sign headers', () => {
      const signedHeaders = Object.entries(aws4.sign({
        host: 'sqs.us-east-1.amazonaws.com',
        path: '/?Action=ListQueues',
        method: 'GET',
      }, {
        accessKeyId: '',
        secretAccessKey: '',
      }).headers).map(x => ({ name: x[0].toString(), value: x[1].toString() }));
      const output = requestHandler.onHeaders({
        url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
        method: 'GET',
        requestHeaders: [],
        requestId: 'test',
      }).requestHeaders;
      assert.deepEqual(signedHeaders, output);
    });
  });
});
