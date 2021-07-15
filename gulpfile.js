const pump = require('pump');
const gulp = require('gulp');
const browserify = require('browserify');
const minify = require('gulp-terser');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const staticFilesFn = async cb => {
  const keys = [];
  const locks = [
    new Promise(r => keys.push(r)),
    new Promise(r => keys.push(r)),
  ];

  pump([
    gulp.src('lib/*'),
    gulp.dest('dist'),
  ], keys.pop());
  pump([
    gulp.src('node_modules/normalize.css/normalize.css'),
    gulp.dest('dist'),
  ], keys.pop());

  await Promise.all(locks);
  cb();
};

const defaultFn = async (cb, browser, env) => {
  const requestHandler = browserify({
    entries: [`src/${browser}.js`],
  });

  const dialog = browserify({
    entries: ['src/dialog.js'],
  });

  const keys = [];
  const locks = [
    new Promise(r => keys.push(r)),
    new Promise(r => keys.push(r)),
  ];

  pump([
    requestHandler.bundle(),
    source(`request-handler.js`),
    buffer(),
    ...env === 'production' ? [minify()] : [],
    gulp.dest('dist'),
  ], keys.pop());
  pump([
    dialog.bundle(),
    source('dialog.js'),
    buffer(),
    ...env === 'production' ? [minify()] : [],
    gulp.dest('dist'),
  ], keys.pop());

  await Promise.all(locks);
  cb();
};

module.exports = {
  'firefox-dev': gulp.series(staticFilesFn, cb => defaultFn(cb, 'firefox', 'dev')),
  'firefox-prod': gulp.series(staticFilesFn, cb => defaultFn(cb, 'firefox', 'production')),
  'firefox-watch': () => gulp.watch(['src/*', 'lib/*'], module.exports.firefoxDev),
  'chrome-dev': gulp.series(staticFilesFn, cb => defaultFn(cb, 'chrome', 'dev')),
  'chrome-prod': gulp.series(staticFilesFn, cb => defaultFn(cb, 'chrome', 'production')),
  'chrome-watch': () => gulp.watch(['src/*', 'lib/*'], module.exports.chromeDev),
  'static-files': staticFilesFn,
  default: module.exports.firefoxDev,
};

