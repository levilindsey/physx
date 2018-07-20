import {FrameLatencyProfiler, PersistentAnimationJob} from 'lsl-animatex';
import {_util} from '../util';

import {
  checkThatNoObjectsCollide,
  CollidablePhysicsJob,
  determineJobsAtRest,
  handleCollisionsForJob,
  recordOldCollisionsForDevModeForAllCollidables,
} from '../collisions';
import {PhysicsState} from './physics-state';
import {rk4Integrator} from '../integrator';

const _FRAME_LATENCY_LOG_PERIOD = 5000;
const _LATENCY_LOG_LABEL = 'Physics frame duration';

/**
 * This physics engine simulates high-performance, three-dimensional rigid-body dynamics.
 *
 * Notable features:
 * - Includes collision detection with impulse-based resolution.
 * - Decouples the physics simulation and animation rendering time steps, and uses a fixed timestep
 * for the physics loop. This gives us numerical stability and precise reproducibility.
 * - Suppresses linear and angular momenta below a certain threshold.
 *
 * The engine consists primarily of a collection of individual physics jobs and an update loop. This
 * update loop is in turn controlled by the animation loop. However, whereas the animation loop
 * renders each job once per frame loop--regardless of how much time actually elapsed since the
 * previous frame--the physics loop updates its jobs at a constant rate. To reconcile these frame
 * rates, the physics loop runs as many times as is needed in order to catch up to the time of the
 * current animation frame. The physics frame rate should be much higher than the animation frame
 * rate.
 *
 * It is VERY IMPORTANT for a PhysicsJob to minimize the runtime of its update step.
 *
 * ## A note on job order
 *
 * The integration+collision pipeline handle one job at a time. A consequence of this design
 * is that half of the collisions technically represent a false interaction between the state of the
 * first object at time t and the state of the second object at time t - 1.
 *
 * This implementation prevents a more problematic issue. If all objects were first integrated, then
 * all objects were checked for collisions, then all collisions were resolved, then the following
 * scenario could arise:
 * - The next position of object A collides with the previous position of object B, but not with the
 *   next position of object B, so object A moves successfully to its new position.
 * - The next position of object B collides with the next position of object C, so objects B and C
 *   are reset to their previous positions.
 * - Object B and C now intersect.
 */
class PhysicsEngine extends PersistentAnimationJob {
  /**
   * Clients should call PhysicsEngine.create instead of instantiating a PhysicsEngine directly.
   *
   * @param {PhysicsConfig} physicsParams
   */
  constructor(physicsParams) {
    super();

    if (_physicsEngine) {
      throw new Error('Can\'t instantiate multiple instances of PhysicsEngine.');
    }

    _physicsEngine = this;

    this._physicsParams = physicsParams;
    this.integrator = rk4Integrator;
    this._elapsedTime = 0.0;
    this._remainingTime = 0.0;
    this._nonCollidableJobs = [];
    this._collidableJobs = [];

    if (_util.isInDevMode) {
      this._setUpForInDevMode();
    }
  }

  /**
   * @param {PhysicsConfig} physicsParams
   */
  static create(physicsParams) {
    new PhysicsEngine(physicsParams);
  }

  reset() {
    this._elapsedTime = 0.0;
    this._remainingTime = 0.0;
    this._nonCollidableJobs = [];
    this._collidableJobs = [];
  }

  /**
   * Adds the given PhysicsJob.
   *
   * @param {PhysicsJob} job
   */
  addJob(job) {
    // console.debug(`Starting PhysicsJob`);

    if (job instanceof CollidablePhysicsJob) {
      this._collidableJobs.push(job);
    } else {
      this._nonCollidableJobs.push(job);
    }
  }

  /**
   * Removes the given PhysicsJob.
   *
   * Throws no error if the job is not registered.
   *
   * @param {PhysicsJob} job
   */
  removeJob(job) {
    // console.debug(`Cancelling PhysicsJob`);
    this._removeJob(job);
  }

  /**
   * Wraps the draw and update methods in a profiler function that will track the frame latencies.
   *
   * @private
   */
  _setUpForInDevMode() {
    const unwrappedUpdate = this.update.bind(this);
    const latencyProfiler = new FrameLatencyProfiler(_FRAME_LATENCY_LOG_PERIOD, 
        this._physicsParams.timeStepDuration, _LATENCY_LOG_LABEL);
    latencyProfiler.start();

    this.update = (...args) => {
      const beforeTime = performance.now();
      unwrappedUpdate(...args);
      const deltaTime = performance.now() - beforeTime;
      latencyProfiler.recordFrameLatency(deltaTime);
    };
  }

  /**
   * Update the physics state for the current animation update frame.
   *
   * @param {DOMHighResTimeStamp} currentTime
   * @param {DOMHighResTimeStamp} deltaTime
   */
  update(currentTime, deltaTime) {
    this._remainingTime += deltaTime;

    // Run as many constant-interval physics updates as are needed for the given animation frame
    // interval.
    while (this._remainingTime >= this._physicsParams.timeStepDuration) {
      this._updateToNextPhysicsFrame();
      this._elapsedTime += this._physicsParams.timeStepDuration;
      this._remainingTime -= this._physicsParams.timeStepDuration;
    }

    // Calculate the intermediate physics state to use for rendering the current animation frame.
    const partialRatio = this._remainingTime / this._physicsParams.timeStepDuration;
    this._setPartialStateForRenderTimeStepForAllJobs(partialRatio);
  }

  _updateToNextPhysicsFrame() {
    if (_util.isInDevMode) {
      this._recordOldStatesForAllJobsForDevMode();
      recordOldCollisionsForDevModeForAllCollidables();
    }

    this._nonCollidableJobs.forEach(this._integratePhysicsStateForJob.bind(this));
    this._collidableJobs.forEach(job => {
      if (!job.isAtRest) {
        this._integratePhysicsStateForCollidableJob(job);
        handleCollisionsForJob(job, this._elapsedTime, this._physicsParams);
      }
    });

    if (_util.isInDevMode) {
      checkThatNoObjectsCollide();
    }

    this._suppressLowMomentaForAllJobs();

    determineJobsAtRest(this._collidableJobs);
  }

  /**
   * Removes the given job from the collection of active jobs if it exists.
   *
   * @param {PhysicsJob} job
   * @param {number} [index=-1]
   * @private
   */
  _removeJob(job, index = -1) {
    if (job instanceof CollidablePhysicsJob) {
      _removeJobFromCollection(job, index, this._collidableJobs);
    } else {
      _removeJobFromCollection(job, index, this._nonCollidableJobs);
    }
  }

  /**
   * Update the current physics state for a job for the current physics update frame.
   *
   * This includes applying all forces that have been registered with the physics job.
   *
   * @param {CollidablePhysicsJob} job
   * @private
   */
  _integratePhysicsStateForCollidableJob(job) {
    this._integratePhysicsStateForJob(job);

    // Update the collidable's position and orientation.
    job.collidable.position = job.currentState.position;
    job.collidable.orientation = job.currentState.orientation;
  }

  /**
   * Update the current physics state for a job for the current physics update frame.
   *
   * This includes applying all forces that have been registered with the physics job.
   *
   * @param {PhysicsJob} job
   * @private
   */
  _integratePhysicsStateForJob(job) {
    job.previousState.copy(job.currentState);
    this.integrator.integrate(job, this._elapsedTime, this._physicsParams.timeStepDuration);
  }

  _suppressLowMomentaForAllJobs() {
    this._collidableJobs.forEach(job => _suppressLowMomentaForJob(job,
        this._physicsParams.lowMomentumSuppressionThreshold,
        this._physicsParams.lowAngularMomentumSuppressionThreshold));
    this._nonCollidableJobs.forEach(job => _suppressLowMomentaForJob(job,
        this._physicsParams.lowMomentumSuppressionThreshold,
        this._physicsParams.lowAngularMomentumSuppressionThreshold));
  }

  /**
   * Calculate the intermediate physics state to use for rendering the current animation frame. The
   * given ratio specifies how far the current render frame is between the previous and current
   * physics update frames.
   *
   * @param {number} partialRatio
   * @private
   */
  _setPartialStateForRenderTimeStepForAllJobs(partialRatio) {
    this._collidableJobs.forEach(_setPartialStateForRenderTimeStepForJob.bind(null, partialRatio));
    this._nonCollidableJobs.forEach(_setPartialStateForRenderTimeStepForJob.bind(null, partialRatio));
  }

  _recordOldStatesForAllJobsForDevMode() {
    this._collidableJobs.forEach(_recordOldStatesForJob);
    this._nonCollidableJobs.forEach(_recordOldStatesForJob);
  }

  draw() {}

  /**
   * @returns {PhysicsEngine}
   */
  static get instance() {
    if (!_physicsEngine) {
      throw new Error('Can\'t access PhysicsEngine.instance before it has been instantiated.');
    }
    return _physicsEngine;
  }
}

/**
 * @param {PhysicsJob} job
 * @param {number} lowMomentumSuppressionThreshold
 * @param {number} lowAngularMomentumSuppressionThreshold
 * @private
 */
function _suppressLowMomentaForJob(job, lowMomentumSuppressionThreshold,
                                   lowAngularMomentumSuppressionThreshold) {
  const currentState = job.currentState;

  if (vec3.squaredLength(currentState.momentum) < lowMomentumSuppressionThreshold) {
    vec3.set(currentState.momentum, 0, 0, 0);
  }

  if (vec3.squaredLength(currentState.angularMomentum) < lowAngularMomentumSuppressionThreshold) {
    vec3.set(currentState.angularMomentum, 0, 0, 0);
  }
}

/**
 * @param {PhysicsJob} job
 * @param {number} index
 * @param {Array.<PhysicsJob>} jobs
 * @private
 */
function _removeJobFromCollection(job, index, jobs) {
  if (index >= 0) {
    jobs.splice(index, 1);
  } else {
    const count = jobs.length;
    for (index = 0; index < count; index++) {
      if (jobs[index] === job) {
        jobs.splice(index, 1);
        break;
      }
    }
  }
}

/**
 * @param {number} partialRatio
 * @param {PhysicsJob} job
 * @private
 */
function _setPartialStateForRenderTimeStepForJob(partialRatio, job) {
  job.renderState.lerp(job.previousState, job.currentState, partialRatio);
}

/**
 * @param {PhysicsJob} job
 * @private
 */
function _recordOldStatesForJob(job) {
  if (!job.extraPreviousStates) {
    job.extraPreviousStates = [];
    for (let i = 0; i < 4; i++) {
      job.extraPreviousStates[i] = new PhysicsState();
    }
  }

  for (let i = 3; i > 0; i--) {
    job.extraPreviousStates[i].copy(job.extraPreviousStates[i - 1]);
  }
  job.extraPreviousStates[0].copy(job.previousState);
}

let _physicsEngine = null;

export {PhysicsEngine};
