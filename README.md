## AWS Agent
Allows your browser to access resources that require AWS Sigv4 signatures.

Inspired by [carsales/aws-request-signer](https://github.com/carsales/aws-request-signer).

#### Compiling
Preferably, you should use npm >= 5.7.1 so you can use `npm ci`. This ensures you have the exact same files (and is much faster). Otherwise, install with `npm i`.
```sh
npm ci
npm run package
```

#### Main differences from carsales/aws-request-signer:

- They basically rolled their own signature process vs I rely on mhart's excellent libraries. In Firefox (and presumably elsewhere) I use [mhart/aws4fetch](https://github.com/mhart/aws4fetch) to handle all heavy lifting. This has the perk of using the browser's WebCrypto API, which should be insanely faster. In Chrome I use [mhart/aws4](https://github.com/mhart/aws4) because Chrome still has zero async support for webRequest.onBeforeSendHeaders.
- This extension triggers on all AWS services instead of filtering for one.
- Instance Profile credentials aren't supported as I have no use for them but could be added fairly trivially.
- Chrome/Firefox/Opera support.

