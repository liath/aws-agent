const pump = require('pump');
const gulp = require('gulp');
const browserify = require('browserify');
const {
  noop,
} = require('gulp-util');
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

const defaultFn = async (cb, env = 'production') => {
  let requestHandler = browserify({
    entries: ['src/request-handler.js'],
  }).transform('envify', {
    NODE_ENV: env,
    global: true,
  });

  let dialog = browserify({
    entries: ['src/dialog.js'],
  }).transform('envify', {
    NODE_ENV: env,
    global: true,
  });

  if (env === 'production') {
    requestHandler = requestHandler.transform('uglifyify', {
      global: true,
    });
    dialog = dialog.transform('uglifyify', {
      global: true,
    });
  }

  const keys = [];
  const locks = [
    new Promise(r => keys.push(r)),
    new Promise(r => keys.push(r)),
  ];

  pump([
    requestHandler.bundle(),
    source('request-handler.js'),
    buffer(),
    (env === 'production' ? minify() : noop()),
    gulp.dest('dist'),
  ], keys.pop());
  pump([
    dialog.bundle(),
    source('dialog.js'),
    buffer(),
    (env === 'production' ? minify() : noop()),
    gulp.dest('dist'),
  ], keys.pop());

  await Promise.all(locks);
  cb();
};

const developFn = cb => defaultFn(cb, 'dev');

const watchFn = () => gulp.watch(['src/*', 'lib/*'], gulp.series(staticFilesFn, developFn));

module.exports = {
  default: gulp.series(staticFilesFn, defaultFn),
  staticFiles: staticFilesFn,
  watch: gulp.series(staticFilesFn, developFn, watchFn),
};
