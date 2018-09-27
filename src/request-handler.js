const browser = require('webextension-polyfill');
const aws4 = require('aws4');

const hookConfig = {
  urls: ['*://*.amazonaws.com/*', 'http://169.254.169.254/*'],
};

// https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
const s3tests = [
  // s3.us-east-1.amazonaws.com
  // s3-website.us-east-1.amazonaws.com
  // s3.dualstack.us-east-1.amazonaws.com
  /(.*\.)?s3(-website|\.dualstack)?(\.|-)\w+-\w+-\d+\.amazonaws\.com/i,
  // s3.amazonaws.com
  // s3-external-1.amazonaws.com
  /(.*\.)?s3(-external-1)?.amazonaws.com/i,
];

const extension = {
  state: {
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
    reqs: {},
  },
  connFilter: req => {
    const url = new URL(req.url);
    const params = [...url.searchParams.keys()];
    // Bail if we have no creds or already have a signature
    // or on s3 stuff which has been the source of all weirdness so far
    if (!extension.state.credentials.accessKeyId
      || !extension.state.credentials.secretAccessKey
      || s3tests.some(x => x.test(url.host))
      || params.some(x => {
        const p = x.toLowerCase();
        return p.startsWith('x-amz-') || p === 'AWSAccessKeyId';
      })) {
      return false;
    }
    return url;
  },
  onHeaders: req => {
    const url = extension.connFilter(req);
    if (!url) {
      return {
        requestHeaders: req.requestHeaders,
      };
    }

    const flattenedHeaders = {};
    for (let i = 0; i < req.requestHeaders.length; i++) {
      const header = req.requestHeaders[i].name.toLowerCase();
      if (header.includes('x-amz-')) {
        // Bail if the request is already signed
        return {
          requestHeaders: req.requestHeaders,
        };
      }
      if (!header.includes('x-devtools') && header !== 'connection') {
        flattenedHeaders[header] = req.requestHeaders[i].value;
      }
    }

    const signed = aws4.sign({
      body: extension.state.reqs[req.requestId],
      headers: flattenedHeaders,
      host: url.host,
      method: req.method,
      path: `${url.pathname}${url.search}`,
    }, extension.state.credentials);

    delete extension.state.reqs[req.requestId];

    const requestHeaders = Object.entries(signed.headers).map(x => ({
      name: x[0].toString(),
      value: x[1].toString(),
    }));

    return {
      requestHeaders,
    };
  },
  onRequest: req => {
    const url = extension.connFilter(req);

    if (url) {
      const testPath = url.pathname.split('/')
        .map(x => encodeURIComponent(decodeURIComponent(x))).join('/');

      if (testPath !== url.pathname) {
        url.pathname = testPath;
        return {
          redirectUrl: url.toString(),
        };
      }

      if (req.requestBody) {
        const d = new TextDecoder('utf-8');
        extension.state.reqs[req.requestId] = req.requestBody.raw
          .reduce((a, x) => a + d.decode(x.bytes), '');
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

browser.storage.onChanged.addListener(getCredentials);
browser.webRequest.onBeforeRequest.addListener(
  extension.onRequest,
  hookConfig, ['blocking', 'requestBody']
);
browser.webRequest.onBeforeSendHeaders.addListener(
  extension.onHeaders,
  hookConfig, ['blocking', 'requestHeaders']
);

module.exports = extension;
