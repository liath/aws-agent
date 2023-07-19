const browser = require('webextension-polyfill');

const hookConfig = {
  urls: [
    '*://*.amazonaws.com/*',
  ],
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

    let body = null;
    if (this.reqs[req.requestId]) {
      if (this.reqs[req.requestId].raw) {
        // Use raw if it's available
        body = this.reqs[req.requestId].raw
          .reduce((s, x) => s + new TextDecoder().decode(x.bytes), '');
      } else {
        // We can not know any of the metadata for file uploads as the webext
        // spec omits them so we'll never be able to sign multipart bodies.
        // I kind of doubt we'd be able to guarantee we reconstruct the payload
        // byte-for-byte for either of the formdata request types anyways so
        // lets opt-out of content signing on them.
        flattenedHeaders['X-Amz-Content-Sha256'] = 'UNSIGNED-PAYLOAD';
      }
    }

    const res = this.signer({
      url: req.url,
      ...this.credentials,
      method: req.method,
      headers: flattenedHeaders,
      body,
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
      this.reqs[req.requestId] = req.requestBody;
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
