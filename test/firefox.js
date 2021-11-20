/* eslint import/no-unresolved:0 */
/* eslint-env mocha */
const assert = require('assert');

const Headers = require('fetch-headers');
const webcrypto = require('isomorphic-webcrypto');

global.Headers = Headers;
global.crypto = webcrypto;

const extension = require('../src/firefox');

describe('Firefox Signer', () => {
  it('should sign headers', async () => {
    const res = await extension.signer({
      accessKeyId: 'test',
      secretAccessKey: 'test',
      url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
      method: 'GET',
      requestHeaders: [],
      requestId: 'test',
    });

    assert.equal(res.requestHeaders.find(x => x.name.toLowerCase() === 'host').value, 'sqs.us-east-1.amazonaws.com');
    assert.ok(res.requestHeaders.find(x => x.name.toLowerCase() === 'authorization'));
  });
});

