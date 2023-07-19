const browser = require('webextension-polyfill');

const hookConfig = {
  urls: [
    '*://*.ngrok-free.app/*',
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
  };

  this.onHeaders = req => {
    if ((!this.credentials.accessKeyId ||
      !this.credentials.secretAccessKey)) {
      return {
        requestHeaders: req.requestHeaders,
      };
    }

    let contentType = null;
    const flattenedHeaders = {};
    for (let i = 0; i < req.requestHeaders.length; i++) {
      const header = req.requestHeaders[i].name.toLowerCase();
      if (!header.includes('x-devtools') && header !== 'connection') {
        flattenedHeaders[req.requestHeaders[i].name] = req.requestHeaders[i].value;
      }
      if (header === 'content-type') {
        contentType = req.requestHeaders[i].value.toLowerCase();
      }
    }
    let body = null;
    let body = null;
      // At some point WebExt changed to no longer pass the raw payload
      // when Content-Type is one of the following:
      //   - multipart/form-data
      //   - application/x-www-form-urlencoded
      // In these cases we'll need to look at the header and determine
      // which way to turn the form object back into a string and _hope_
      // that this is what actually appears on the wire. :<
      if (this.reqs[req.requestId].raw) {
        // use raw if it's available
        body = this.reqs[req.requestId].raw
          .reduce((s, x) => s + new TextDecoder().decode(x.bytes), '');
      } else if (this.reqs[req.requestId].formData) {
        // best effort to un-parse the form data
        if (contentType === 'application/x-www-form-urlencoded') {
          body = Object.entries(this.reqs[req.requestId].formData)
            .reduce((s, [name, values]) => [
              ...s,
              ...values.map(value => `${name}=${value}`),
            ], []).join('&');
        } else {
          // TODO: We can not know any of the metadata for file uploads as the
          //       webextension spec omits them, so we'll never be able to
          //       sign file uploads unless this lands:
          //       https://bugzilla.mozilla.org/show_bug.cgi?id=1376155

          // this is prolly flaky, I don't wanna go read an RFC though
          const sep = '; boundary=';
          const boundary = `--${contentType.split(sep).slice(1).join(sep)}`;

          body = Object.entries(this.reqs[req.requestId].formData)
            .reduce((s, [name, values]) => [
              ...s,
              ...values.reduce((t, value) => [
                ...t,
                boundary,
                `Content-Disposition: form-data; name="${name}"`,
                '',
                value,
              ], []),
            ], [])
            .concat([
              `${boundary}--`,
            ])
            .join('\r\n');
        }
      }
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
