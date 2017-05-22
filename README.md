## AWS Agent
Allows Chrome users to access AWS resources that require sigv4. Influenced by [carsales/aws-request-signer](https://github.com/carsales/aws-request-signer), unfortunately I needed changes that I couldn't wait for them to merge/release.

#### Main differences from carsales/aws-request-signer:

- They basically rolled their own signature process and I use browserify and [mhart/aws4](https://github.com/mhart/aws4) to handle all heavy lifting.
- This extension triggers on all AWS services instead of filtering for one.
- Instance Profile credentials aren't supported as I have no use for them.
