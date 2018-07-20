import gulp from 'gulp';

gulp.task('default', ['clean'], () => {
  gulp.start('watch');
});
