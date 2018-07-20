import gulp from 'gulp';
import config from './config';

gulp.task('watch', config.buildTasks, () => {
  gulp.watch(config.scriptsSrc, ['scripts']);
  gulp.watch(config.shadersSrc, ['shaders']);
  gulp.watch(config.vendorScriptsSrc, ['vendor-scripts']);
});
