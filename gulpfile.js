'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');

const paths = {
  src: ['index.js', 'lib/**/*.js']
};

gulp.task('eslint', function() {
  return gulp.src(paths.src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('watch', function() {
  gulp.watch(paths.src, gulp.series('eslint'));
});

gulp.task('default', ['watch']);
