const aws4 = require('aws4');

const hookConfig = {
  urls: ['*://*.amazonaws.com/*'],
  types: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
    'font', 'object', 'xmlhttprequest', 'ping', 'other'],
};

const extension = {
  state: {
    credentials: { accessKeyId: '', secretAccessKey: '' },
    reqs: {},
  },
  onHeaders: req => {
    const url = new URL(req.url);
    // Bail if we have no creds or already have a signature
    if (!extension.state.credentials.accessKeyId ||
        !extension.state.credentials.secretAccessKey ||
        [...url.searchParams.keys()].some(x =>
          x.toLowerCase().includes('x-amz-'))) {
      return { requestHeaders: req.requestHeaders };
    }
    const flattenedHeaders = {};
    for (let i = 0; i < req.requestHeaders.length; i++) {
      if (req.requestHeaders[i].name.toLowerCase().includes('x-amz-')) {
        // Bail if the request is already signed
        return { requestHeaders: req.requestHeaders };
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
    extension.state.reqs[req.requestId] = undefined;
    const requestHeaders = Object.entries(signed.headers).map(x =>
      ({ name: x[0].toString(), value: x[1].toString() }));
    return { requestHeaders };
  },
  onRequest: req => {
    if (extension.state.credentials.accessKeyId &&
        extension.state.credentials.secretAccessKey && req.requestBody) {
      extension.state.reqs[req.requestId] = new TextDecoder('utf-8')
        .decode(req.requestBody.raw[0].bytes);
    }
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
