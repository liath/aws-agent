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

const s3urls = [
  's3-website.us-east-2.amazonaws.com',
  's3-website-us-east-1.amazonaws.com',
  's3-website-us-west-1.amazonaws.com',
  's3-website-us-west-2.amazonaws.com',
  's3-website.ca-central-1.amazonaws.com',
  's3-website.ap-south-1.amazonaws.com',
  's3-website.ap-northeast-2.amazonaws.com',
  's3-website.ap-northeast-3.amazonaws.com',
  's3-website-ap-southeast-1.amazonaws.com',
  's3-website-ap-southeast-2.amazonaws.com',
  's3-website-ap-northeast-1.amazonaws.com',
  's3-website.cn-northwest-1.amazonaws.com.cn',
  's3-website.eu-central-1.amazonaws.com',
  's3-website-eu-west-1.amazonaws.com',
  's3-website.eu-west-2.amazonaws.com',
  's3-website.eu-west-3.amazonaws.com',
  's3-website-sa-east-1.amazonaws.com', 's3.us-east-2.amazonaws.com',
  's3-us-east-2.amazonaws.com', 's3.dualstack.us-east-2.amazonaws.com',
  's3.amazonaws.com', 's3.us-east-1.amazonaws.com',
  's3-external-1.amazonaws.com', 's3.dualstack.us-east-1.amazonaws.com',
  's3.us-west-1.amazonaws.com', 's3-us-west-1.amazonaws.com',
  's3.dualstack.us-west-1.amazonaws.com', 's3.us-west-2.amazonaws.com',
  's3-us-west-2.amazonaws.com', 's3.dualstack.us-west-2.amazonaws.com',
  's3.ca-central-1.amazonaws.com', 's3-ca-central-1.amazonaws.com',
  's3.dualstack.ca-central-1.amazonaws.com',
  's3.ap-south-1.amazonaws.com', 's3-ap-south-1.amazonaws.com',
  's3.dualstack.ap-south-1.amazonaws.com',
  's3.ap-northeast-2.amazonaws.com', 's3-ap-northeast-2.amazonaws.com',
  's3.dualstack.ap-northeast-2.amazonaws.com',
  's3.ap-northeast-3.amazonaws.com', 's3-ap-northeast-3.amazonaws.com',
  's3.dualstack.ap-northeast-3.amazonaws.com',
  's3.ap-southeast-1.amazonaws.com', 's3-ap-southeast-1.amazonaws.com',
  's3.dualstack.ap-southeast-1.amazonaws.com',
  's3.ap-southeast-2.amazonaws.com', 's3-ap-southeast-2.amazonaws.com',
  's3.dualstack.ap-southeast-2.amazonaws.com',
  's3.ap-northeast-1.amazonaws.com', 's3-ap-northeast-1.amazonaws.com',
  's3.dualstack.ap-northeast-1.amazonaws.com',
  's3.cn-north-1.amazonaws.com.cn', 's3.cn-northwest-1.amazonaws.com.cn',
  's3.eu-central-1.amazonaws.com', 's3-eu-central-1.amazonaws.com',
  's3.dualstack.eu-central-1.amazonaws.com', 's3.eu-west-1.amazonaws.com',
  's3-eu-west-1.amazonaws.com', 's3.dualstack.eu-west-1.amazonaws.com',
  's3.eu-west-2.amazonaws.com', 's3-eu-west-2.amazonaws.com',
  's3.dualstack.eu-west-2.amazonaws.com', 's3.eu-west-3.amazonaws.com',
  's3-eu-west-3.amazonaws.com', 's3.dualstack.eu-west-3.amazonaws.com',
  's3.sa-east-1.amazonaws.com', 's3-sa-east-1.amazonaws.com',
  's3.dualstack.sa-east-1.amazonaws.com',
];

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
  describe('- connFilter ', () => {
    it('should skip all s3 urls', () => {
      const fails = s3urls.filter(x => requestHandler.connFilter({
        url: `https://${x}`,
      }));

      if (fails.length) {
        assert.fail(`Failed S3 URL(s):
${fails.map(x => `${x},`).join('\n')}`);
      }
    });
  });
});
