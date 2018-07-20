import gulp from 'gulp';
import { Server } from 'karma';
import config from './config';

gulp.task('test', config.buildTasks, done => {
  new Server({
    configFile: config.karmaConfigPath,
    singleRun: true
  }, done).start();
});
