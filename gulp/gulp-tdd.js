import gulp from 'gulp';
import { Server } from 'karma';
import config from './config';

gulp.task('tdd', done => {
  new Server({
    configFile: config.karmaConfigPath
  }, done).start();
});
