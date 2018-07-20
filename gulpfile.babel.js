import glob from 'glob';

function loadTasks(includes) {
  includes
    // Expand the glob to get an array of the actual file paths
    .reduce((paths, include) => {
      return paths.concat(glob.sync(include));
    }, [])
    // Register each task with gulp
    .forEach((path) => {
      require(path);
    });
}

loadTasks([`./gulp/*.js`]);
