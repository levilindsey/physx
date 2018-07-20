import 'babel-register';
import gulp from 'gulp';
import del from 'del';
import config from './config';

gulp.task('clean', done => {
  del([config.distPath]).then(paths => {
    done();
  });
});
