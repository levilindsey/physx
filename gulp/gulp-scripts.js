import gulp from 'gulp';
import babelify from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
const plugins = require('gulp-load-plugins')({ lazy: false });
import config from './config';

gulp.task('scripts', () => {
  browserify({ entries: config.mainScriptSrc, extensions: ['.js'], debug: true })
    .transform(babelify, { presets: ['env'] })
    .bundle()
    .on('error', error => {
      console.error(error);
      this.emit('end');
    })
    .pipe(source(config.scriptDistFileName))
    .pipe(buffer())
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.sourcemaps.write(config.sourceMapsDist))
    .pipe(gulp.dest(config.scriptsDist))
    .pipe(plugins.size({ title: 'Scripts before minifying' }));
});
