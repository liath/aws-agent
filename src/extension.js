const browser = require('webextension-polyfill');

const hookConfig = {
  urls: ['*://*.amazonaws.com/*'],
};

const s3dash = /s3-(\w+-\w+-\d+)/;

/**
 * AWS-Agent Extension
 *
 * @param {function} signer
 */
function Extension(signer) {
  this.signer = signer;
  this.credentials = {
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
  };
  this.reqs = {};

  this.onHeaders = req => {
    if ((!this.credentials.accessKeyId ||
      !this.credentials.secretAccessKey)) {
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

    const res = this.signer({
      url: req.url,
      ...this.credentials,
      method: req.method,
      headers: flattenedHeaders,
      body: this.reqs[req.requestId],
    });

    delete this.reqs[req.requestId];

    return res;
  };

  this.onRequest = req => {
    if ((!this.credentials.accessKeyId ||
      !this.credentials.secretAccessKey)) {
      return {
        requestHeaders: req.requestHeaders,
      };
    }

    const url = new URL(req.url);

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
      this.reqs[req.requestId] = new TextDecoder().decode(req.requestBody.raw[0].bytes);
    }

    return {};
  };

  this.getCredentials = async () => {
    this.credentials = await browser.storage.sync.get({
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    });
  };
  this.getCredentials();

  browser.storage.onChanged.addListener(this.getCredentials);
  browser.webRequest.onBeforeRequest.addListener(
    this.onRequest,
    hookConfig,
    ['blocking', 'requestBody'],
  );
  browser.webRequest.onBeforeSendHeaders.addListener(
    this.onHeaders,
    hookConfig,
    ['blocking', 'requestHeaders'],
  );
}



module.exports = Extension;

