const { AwsV4Signer } = require('aws4fetch');
const Extension = require('./extension');

module.exports = new Extension(async req => {
  const signer = new AwsV4Signer({
    ...req,
  });
  const signed = await signer.sign();

  // aws4fetch removes Host, and lemme tell you, AWS does not care for that.
  // They give a very opaque 400 error without a body to explain why.
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
});

