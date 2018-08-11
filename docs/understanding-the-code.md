# Understanding the Code

- `index.js`
  - Re-exports all public values of the library.
  - This is the main access point for consumers of this library via NPM.
- `dist/`
  - Everything in `dist` is generated as part of the build process.
  - During the build process all previous contents of `dist` are deleted, so remember to **never
    make changes directly to the contents of `dist`!**
- `docs/`
  - Descriptive markdown documentation.
- `gulp/`
  - All of the different gulp tasks. Each gulp task has been split apart into its own file.
  - See the page on the [build system](./docs/build-system.md) for more information.
- `res/`
  - All of the media files used within this project.
- `src/`
  - All of the actual frontend logic for this library.
