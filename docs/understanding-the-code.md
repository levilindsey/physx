# Understanding the Code

TODO

### File Structure

#### Top-Level Entries

TODO

##### `src/`

This directory contains all of the front-end logic.

##### `res/`

This directory contains all of the media files used within this project.

##### `dist/`

This directory is not actually stored in the project repository. Instead, everything in `dist` is generated as part of 
the build process. During the build process all previous contents of `dist` are deleted, so remember to **never make 
changes directly to the contents of `dist`!**

##### `gulp/`

This directory contains all of the different gulp tasks. Each gulp task has been split apart into its own file.

See the page on the [build system](./docs/build-system.md) for more information.

##### `docs/`

This directory holds these descriptive markdown files.

#### Server-Side Entries

TODO

##### `src/server/config`

###### `secure-config.js`

Contains sensitive information (API keys, database credentials, cookie secrets, etc.) that should not be kept in a 
public repository. This file is ignored by git, so you will need to manually transfer it around whenever you want to 
set up a new development environment for this codebase. 

TODO

#### Front-End Entries

TODO
