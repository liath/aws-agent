const browser = require('webextension-polyfill');
const { AwsV4Signer } = require('aws4fetch');

const hookConfig = {
  urls: ['*://*.amazonaws.com/*'],
};

const s3dash = /s3-(\w+-\w+-\d+)/;

const extension = {
  state: {
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
    reqs: {},
  },
  onHeaders: async req => {
    if ((!extension.state.credentials.accessKeyId ||
      !extension.state.credentials.secretAccessKey)) {
      return {
        requestHeaders: req.requestHeaders,
      };
    }

    const flattenedHeaders = {};
    for (let i = 0; i < req.requestHeaders.length; i++) {
      const header = req.requestHeaders[i].name.toLowerCase();
      if (!header.includes('x-devtools') && header !== 'connection') {
        flattenedHeaders[req.requestHeaders[i].name] = req.requestHeaders[i].value;
      }
    }

    const signer = new AwsV4Signer({
      url: req.url,
      ...extension.state.credentials,
      method: req.method,
      headers: flattenedHeaders,
      body: extension.state.reqs[req.requestId],
    });
    const signed = await signer.sign();

    delete extension.state.reqs[req.requestId];

    // aws4fetch removes Host, and lemme tell you, AWS does not care for that.
    // They give a very opaque 400 error with out a body to explain why.
    const requestHeaders = [
      ['Host', signer.url.host],
      ...signed.headers,
    ].map(x => ({
      name: x[0].toString(),
      value: x[1].toString(),
    }));

    return {
      requestHeaders,
    };
  },
  onRequest: req => {
    if ((!extension.state.credentials.accessKeyId ||
      !extension.state.credentials.secretAccessKey)) {
      return {
        requestHeaders: req.requestHeaders,
      };
    }

    const url = new URL(req.url);

    if (url) {
      const testPath = url.pathname.split('/')
        .map(x => encodeURIComponent(decodeURIComponent(x))).join('/');

      if (testPath !== url.pathname) {
        url.pathname = testPath;
        return {
          redirectUrl: url.toString(),
        };
      }

      // workaround for old "S3dash" urls, see discussion here for more info:
      // https://github.com/mhart/aws4fetch/issues/13
      const s3dashTest = url.hostname.replace(s3dash, 's3.$1');
      if (s3dashTest !== url.hostname) {
        url.hostname = s3dashTest;
        return {
          redirectUrl: url.toString(),
        };
      }

      if (req.requestBody) {
        extension.state.reqs[req.requestId] = req.requestBody;
      }
    }

    return {};
  },
};

const getCredentials = async () => {
  const creds = await browser.storage.sync.get({
    accessKeyId: '',
    secretAccessKey: '',
  });

  extension.state.credentials = creds;
};

getCredentials();

browser.storage.onChanged.addListener(getCredentials);
browser.webRequest.onBeforeRequest.addListener(
  extension.onRequest,
  hookConfig,
  ['blocking', 'requestBody'],
);
browser.webRequest.onBeforeSendHeaders.addListener(
  extension.onHeaders,
  hookConfig,
  ['blocking', 'requestHeaders'],
);

module.exports = extension;
