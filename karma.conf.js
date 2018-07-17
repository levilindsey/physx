/**
 * Karma configuration.
 */

module.exports = karma => {
  const gulpConfig = require('../../lsl-gulp-config');

  karma.set({
    frameworks: ['browserify', 'jasmine'],
    basePath: './',
    files: gulpConfig.allFilesForFrontEndTests,
    exclude: gulpConfig.filesToExcludeInFrontEndTests,
    preprocessors: {
      [gulpConfig.filesToProcessForFrontEndTests]: ['browserify']
    },
    logLevel: 'LOG_DEBUG',
    autoWatch: true,
    reporters: ['progress'],
    browsers: ['Chrome'], // ['PhantomJS'],
    browserify: {
      debug: true,
      transform: ['babelify']
    }
  });
};