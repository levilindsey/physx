# physx

#### A physics engine with 3D rigid-body dynamics and collision detection (with impulse-based resolution).

_DISCLAIMER: This has some rough edges and should probably not be used directly within production apps._

_See this in use at [levi.dev/dynamics][demo]!_

This framework only defines physics logic. If you also need a 3D rendering framework, checkout
[grafx][grafx]. Or checkout [gamex][gamex], a game engine that ties the grafx and physx frameworks
together.

## Notable Features

- Includes [collision detection][collision-detection] with [impulse-based 
  resolution][collision-resolution].
- [Decouples the physics simulation and animation rendering time steps][stable-time-steps], and uses
  a fixed timestep for the physics loop. This provides numerical stability and precise
  reproducibility.
- Suppresses linear and angular momenta below a certain threshold.

The engine consists primarily of a collection of individual physics jobs and an update loop. This
update loop is in turn controlled by the animation loop. However, whereas the animation loop renders
each job once per frame loop&mdash;regardless of how much time actually elapsed since the previous
frame&mdash;the physics loop updates its jobs at a constant rate. To reconcile these frame rates,
the physics loop runs as many times as is needed in order to catch up to the time of the current
animation frame. The physics frame rate should be much higher than the animation frame rate.

It is _very important_ for a PhysicsJob to minimize the runtime of its update step.

## Collision Detection

This physics engine also includes a collision-detection pipeline. This will detect collisions
between collidable rigid bodies and update their momenta in response to the collisions.

- Consists of an efficient broad-phase collision detection step followed by a precise narrow-phase
  step.
- Calculates the position, surface normal, and time of each contact.
- Calculates the impulse of a collision and updates the bodies' linear and angular momenta in
  response.
- Applies Coulomb friction to colliding bodies.
- Sub-divides the time step to more precisely determine when and where a collision occurs.
- Supports multiple collisions with a single body in a single time step.
- Efficiently supports bodies coming to rest against each other.
- Bodies will never penetrate one another.
- This does not address the [tunnelling problem][tunnelling-problem]. That is, it is possible for
  two fast-moving bodies to pass through each other as long as they did not intersect each other
  during any time step.
- This only supports collisions between certain types of shapes. Fortunately, this set provides
  reasonable approximations for most other shapes. The supported types of shapes are:
    - [sphere][sphere]
    - [capsule][capsule]
    - [AABB][aabb]
    - [OBB][obb]

## Code Coverage

The collision and geometry logic is tested (with [Karma][karma] and [Jasmine][jasmine]).

## Acknowledgements / Technology Stack

The technologies used in this library include:

- [ES2015][es2015]
- [WebGL][webgl]
- [gulp.js][gulp]
- [Babel][babel]
- [Browserify][browserify]
- [SASS][sass]
- [animatex][animatex]
- Numerous other packages that are available via [NPM][npm] (these are listed within the
  [`package.json`](./package.json) file)

Many online resources influenced the design of this library. Some of these include:

- [gafferongames.com][gafferongames]
- [geometrictools.com][geometrictools]
- [clb.demon.fi/MathGeoLib/nightly][mathgeolib]
- [euclideanspace.com][euclideanspace]

## Developing / Running the Code

See [Getting Set Up](./docs/getting-set-up) or [Understanding the
Code](./docs/understanding-the-code) for more info.

## License

MIT

[demo]: http://levi.codes/dynamics

[grafx]: https://github.com/levilindsey/grafx
[gamex]: https://github.com/levilindsey/gamex
[animatex]: https://github.com/levilindsey/animatex

[tunnelling-problem]: https://www.aorensoftware.com/blog/2011/06/01/when-bullets-move-too-fast/
[sphere]: https://en.wikipedia.org/wiki/Sphere
[capsule]: https://en.wikipedia.org/wiki/Capsule_(geometry)
[aabb]: https://en.wikipedia.org/w/index.php?title=Axis-aligned_bounding_box&redirect=no
[obb]: https://en.wikipedia.org/w/index.php?title=Oriented_bounding_box&redirect=no

[es2015]: http://www.ecma-international.org/ecma-262/6.0/
[webgl]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
[node]: http://nodejs.org/
[babel]: https://babeljs.io/
[browserify]: http://browserify.org/
[gulp]: http://gulpjs.com/
[sass]: http://sass-lang.com/
[jasmine]: http://jasmine.github.io/
[karma]: https://karma-runner.github.io/1.0/index.html
[npm]: http://npmjs.org/

[gafferongames]: http://gafferongames.com
[geometrictools]: http://geometrictools.com
[mathgeolib]: http://clb.demon.fi/MathGeoLib/nightly
[euclideanspace]: http://euclideanspace.com

[collision-detection]: https://en.wikipedia.org/wiki/Collision_detection
[collision-resolution]: https://en.wikipedia.org/wiki/Collision_response#Impulse-based_contact_model
[stable-time-steps]: https://gafferongames.com/post/fix_your_timestep/
