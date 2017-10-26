const aws4 = require('aws4');

const hookConfig = {
  urls: ['*://*.amazonaws.com/*'],
  types: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
    'font', 'object', 'xmlhttprequest', 'ping', 'other'],
};

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
    // Bail if we have no creds or already have a signature
    // or on s3 stuff which has been the source of all weirdness so far
    if (!extension.state.credentials.accessKeyId ||
      !extension.state.credentials.secretAccessKey ||
      /(.*\.)?s3(-\w+-\w+-\d+)?\.amazonaws\.com/i.test(url.host) || [...url.searchParams.keys()].some(x =>
        x.toLowerCase().includes('x-amz-'))) {
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
      if (req.requestHeaders[i].name.toLowerCase().includes('x-amz-')) {
        // Bail if the request is already signed
        return {
          requestHeaders: req.requestHeaders,
        };
      }
      if (!req.requestHeaders[i].name.toLowerCase().includes('x-devtools')) {
        flattenedHeaders[req.requestHeaders[i].name] = req.requestHeaders[i].value;
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
    const requestHeaders = Object.entries(signed.headers).map(x =>
      ({
        name: x[0].toString(),
        value: x[1].toString(),
      }));
    return {
      requestHeaders,
    };
  },
  onRequest: req => {
    const url = extension.connFilter(req);
    if (extension.connFilter(req)) {
      const testPath = url.pathname.split('/').map(x =>
        encodeURIComponent(decodeURIComponent(x))).join('/');
      if (testPath !== url.pathname) {
        url.pathname = testPath;
        return {
          redirectUrl: url.toString(),
        };
      }
      if (req.requestBody) {
        const d = new TextDecoder('utf-8');
        extension.state.reqs[req.requestId] = req.requestBody.raw.reduce((a, x) => a + d.decode(x.bytes), '');
      }
    }
    return {};
  },
};
module.exports = extension;

const getCredentials = () =>
  new Promise(resolve =>
    chrome.storage.sync.get({
      accessKeyId: '',
      secretAccessKey: '',
    }, creds => {
      extension.state.credentials = creds;
      resolve();
    }));

if (typeof chrome !== 'undefined' && chrome) { // Set hooks if we're live
  getCredentials().then(() => {
    chrome.storage.onChanged.addListener(getCredentials);
    chrome.webRequest.onBeforeRequest.addListener(extension.onRequest,
      hookConfig, ['blocking', 'requestBody']);
    chrome.webRequest.onBeforeSendHeaders.addListener(extension.onHeaders,
      hookConfig, ['blocking', 'requestHeaders']);
  });
}
