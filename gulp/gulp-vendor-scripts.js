import gulp from 'gulp';
const plugins = require('gulp-load-plugins')({ lazy: false });
import config from './config';

gulp.task('vendor-scripts', () => {
  return gulp.src(config.vendorScriptsSrc)
    .pipe(plugins.plumber())
    .pipe(plugins.concat(config.vendorScriptDistFileName))
    .pipe(gulp.dest(config.scriptsDist));
});
