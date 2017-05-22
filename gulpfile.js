const pump = require('pump');
const gulp = require('gulp');
const browserify = require('browserify');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

gulp.task('staticFiles', cb => {
  pump([gulp.src('lib/*'), gulp.dest('dist')], cb);
});
gulp.task('default', ['staticFiles'], cb => {
  const browserified = browserify({ entries: ['src/request-handler.js'] })
    .transform('aliasify', { global: true });

  pump([
    browserified.bundle(),
    source('request-handler.js'),
    buffer(),
    (gutil.env.type === 'production' ? uglify() : gutil.noop()),
    gulp.dest('dist'),
  ], cb);
});
gulp.task('watch', ['default'], () => gulp.watch(['src/*', 'lib/*'], ['default']));
