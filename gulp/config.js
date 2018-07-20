const appName = 'physx';

const config = {};

config.srcPath = 'src';
config.distPath = 'dist';
config.nodeModulesPath = 'node_modules';

config.karmaConfigPath = `${__dirname}/../karma.conf.js`;

config.publicPath = config.srcPath;

config.scriptsDist = `${config.distPath}/scripts`;
config.shadersDist = `${config.distPath}/shaders`;
config.sourceMapsDist = '.';

config.scriptDistFileName = `${appName}.js`;
config.vendorScriptDistFileName = 'lib.js';

config.distGlob = `${config.distPath}/**`;

config.frontEndTestsSrc = `${config.publicPath}/**/*_test.js`;

config.scriptsSrc = [
  `${config.publicPath}/**/*.js`,
  `!${config.frontEndTestsSrc}`,
];
config.mainScriptSrc = `${config.publicPath}/index.js`;
config.scriptsSrcBasePath = config.publicPath;
config.shadersSrc = `${config.publicPath}/**/*.+(frag|vert|glsl|c)`;

// TODO: these source arrays need to be manually kept up-to-date with the front-end libraries that are used in this app
config.vendorScriptsSrc = [
  `${config.nodeModulesPath}/dat.gui/dat.gui.min.js`,
  `${config.nodeModulesPath}/gl-matrix/dist/gl-matrix-min.js`
];
config.vendorScriptsMinSrc = [
  `${config.nodeModulesPath}/gl-matrix/dist/gl-matrix-min.js`,
  `${config.nodeModulesPath}/dat.gui/dat.gui.min.js`
];

config.allFilesForFrontEndTests = [
  `${config.scriptsDist}/${config.vendorScriptDistFileName}`,
  `${config.publicPath}/**/*.js`,
];

config.filesToExcludeInFrontEndTests = [];

config.filesToProcessForFrontEndTests = `${config.publicPath}/**/*.js`;

config.buildTasks = [
  'scripts',
  'shaders',
  'vendor-scripts',
];
//config.host = '0.0.0.0';

config.port = 8080;

export default config;
