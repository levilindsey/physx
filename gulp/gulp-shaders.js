import gulp from 'gulp';
const plugins = require('gulp-load-plugins')({ lazy: false });
import config from './config';

gulp.task('shaders', () => {
  return gulp.src(config.shadersSrc)
    .pipe(plugins.plumber())
    .pipe(plugins.flatten())
    .pipe(gulp.dest(config.shadersDist));
});
