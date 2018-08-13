## AWS Agent
Allows your browser to access AWS resources that require Amazon's Sigv4 scheme.

Inspired by [carsales/aws-request-signer](https://github.com/carsales/aws-request-signer).

#### Main differences from carsales/aws-request-signer:

- They basically rolled their own signature process and I use browserify and [mhart/aws4](https://github.com/mhart/aws4) to handle all heavy lifting.
- This extension triggers on all AWS services instead of filtering for one.
- Instance Profile credentials aren't supported as I have no use for them.
- Chrome/Firefox/Opera support.
