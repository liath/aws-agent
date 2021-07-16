# Change Log
All notable changes to this project will be documented in this file. This change log follows the conventions of [keepachangelog.com](http://keepachangelog.com/).

## [Unreleased]
### Changed
- Extension is now a customized for Chrome vs Firefox as Chrome still lacks async support on needed APIs.
  Following the resolution of this ticket we should be good to move Chrome to WebCrypto too:
  https://bugs.chromium.org/p/chromium/issues/detail?id=328932
- Switched from CloudBuild to Github Actions

### Fixed
- Brought back mhart/aws4 for Chrome builds due to above note.

## [0.2.0] - 2020-05-27
### Changed
- Polished UI a bit
- Switched to mhart/aws4fetch
- Switched from a dumb shell script to a Makefile for packaging.

### Added
- Some CI/CD stuff

## [0.1.3] - 2018-11-16
### Changed
- Updated deps for cached-path-relative >= 1.0.2. (CVE-2018-16472)

### Fixed
- Forgot to save fix for unit tests.

## [0.1.2] - 2018-09-27
### Fixed
- S3 URL test has been updated to handle everything from the docs.

## [0.1.1] - 2018-09-11
### Fixed
- Forgot to load settings at boot!

### Added
- web-ext was missing from deps.

## [0.1.0] - 2018-08-13
### Added
- this CHANGELOG.
- switched to being a standard WebExtension and shimming to support Chrome.

### Changed
- switched to async interfaces where possible.
- we build dialog.js with browserify now too.
- cleaned up the UI a little.

### Fixed
- connection filter wasn't catching pre-signed S3 URLs.

## [0.0.9] - 2017-10-26
### Changed
- started using jsbeautify.
- switched from uglify to babili.
- added production flag to gulp.

### Fixed
- request payloads being truncated to 4096 bytes.

## [0.0.8] - 2017-09-07
### Changed
- S3 URL regex wasn't doing what I thought it was.

## [0.0.7] - 2017-07-19
### Added
- LICENSE
- step in filter to skip S3 URLs.

### Fixed
- handling of encoded characters in URLs.

## [0.0.6] - 2017-06-09
### Added
- filter at `onRequest` so we skip connections we don't care about sooner.
- step in filter to skip S3 URLs.

## [0.0.5] - 2017-05-24
### Changed
- use npm's version hooks.

## [0.0.4] - 2017-05-24
### Changed
- build script stuff to make the version in manifest.json track the one in package.json.

## [0.0.3] - 2017-05-24
### Changed
- version bump for no apparent reason.

## [0.0.2] - 2017-05-22
### Changed
- version bump for no apparent reason.

[Unreleased]: https://github.com/Liath/aws-agent/compare/0.1.3...HEAD
[0.1.3]: https://github.com/Liath/aws-agent/commit/7180880a3167cf80c5002128f707f3e79e99305e
[0.1.2]: https://github.com/Liath/aws-agent/commit/e47bb54d5ba1ff3d81e1e069b91e726216c65259
[0.1.1]: https://github.com/Liath/aws-agent/commit/418ce088a06a96f16e8ea89419d0b1d3237faa48
[0.1.0]: https://github.com/Liath/aws-agent/commit/67a89c168c8c718dfc75b71ee6a0e3021eeb825b
[0.0.9]: https://github.com/Liath/aws-agent/commit/5d051100aa288071b5ef68a7f098d59764051831
[0.0.8]: https://github.com/Liath/aws-agent/commit/255c3d7bb42fb3422516346f2de6a1a21f037324
[0.0.7]: https://github.com/Liath/aws-agent/commit/4f0150e176d944765700afef9d47d8241306d853
[0.0.6]: https://github.com/Liath/aws-agent/commit/55ed9fa023b96b60bd1c2d3641ad6b60997370de
[0.0.5]: https://github.com/Liath/aws-agent/commit/08f4c086f5d2b33c9370602f80f7fb078d5f6a52
[0.0.4]: https://github.com/Liath/aws-agent/commit/dc04ca00eaafb992bdf04d7670482ffa2892c4ac
[0.0.3]: https://github.com/Liath/aws-agent/commit/dc04ca00eaafb992bdf04d7670482ffa2892c4ac
[0.0.2]: https://github.com/Liath/aws-agent/commit/dc04ca00eaafb992bdf04d7670482ffa2892c4ac
[0.0.1]: https://github.com/Liath/aws-agent/commit/8f834c25adf04cfb5fcb0f956b83eb6c216086a5
