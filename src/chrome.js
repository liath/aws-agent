const aws4 = require('aws4');
const Extension = require('./extension');

module.exports = new Extension(req => {
  const url = new URL(req.url);
  const res = aws4.sign({
    ...req,
    host: url.host,
    path: `${url.pathname}${url.search}`,
  }, {
    accessKeyId: req.accessKeyId,
    secretAccessKey: req.secretAccessKey,
  });

  const requestHeaders = Object.entries(res.headers).map(x => ({
    name: x[0].toString(),
    value: x[1].toString(),
  }));

  return {
    requestHeaders,
  };
});

