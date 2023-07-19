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

const extension = require('../src/chrome');

beforeEach(() => {
  extension.state = {
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
    reqs: {},
  };
});

describe('Chrome Signer', () => {
  it('should sign headers', () => {
    const res = extension.signer({
      url: 'https://sqs.us-east-1.amazonaws.com/?Action=ListQueues',
      method: 'GET',
      requestHeaders: [],
      requestId: 'test',
    });

    assert.ok(res.requestHeaders.find(x => x.name.toLowerCase() === 'authorization'));
  });
});

