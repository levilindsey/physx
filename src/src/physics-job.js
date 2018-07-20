import {animator} from 'lsl-animatex';
import {PhysicsEngine} from './physics-engine';
import {PhysicsState} from './physics-state';
import {_util} from '../util';

/**
 * A PhysicsJob maintains a current force/momentum state and defines a method for applying forces at
 * a given physics time step.
 */
class PhysicsJob {
  /**
   * @param {Array.<ForceApplier>} [forceAppliers]
   * @param {PhysicsState} [state]
   */
  constructor(forceAppliers, state) {
    forceAppliers = forceAppliers || [];
    state = state || new PhysicsState();

    this.startTime = null;
    this.currentState = state;
    this.previousState = null;
    this.renderState = null;
    this._forceAppliers = forceAppliers;
  }

  /**
   * @param {ForceApplierOutput} outputParams
   * @param {ForceApplierInput} inputParams
   */
  applyForces(outputParams, inputParams) {
    this._forceAppliers.forEach(forceApplier => forceApplier(outputParams, inputParams));
  }

  /**
   * @param {ForceApplier} forceApplier
   * @param {number} [index=0] The index to add the given force applier in the current list of
   * appliers.
   */
  addForceApplier(forceApplier, index = 0) {
    this._forceAppliers.splice(index, 0, forceApplier);
  }

  /**
   * @param {ForceApplier} forceApplier
   */
  removeForceApplier(forceApplier) {
    this._forceAppliers.splice(this._forceAppliers.indexOf(forceApplier), 1);
  }

  /**
   * Registers this PhysicsJob and all of its descendant child jobs with the physics engine.
   *
   * @param {number} [startTime]
   */
  start(startTime) {
    this.startTime = startTime || animator.currentTime;

    const previousState = new PhysicsState();
    previousState.copy(this.currentState);
    const renderState = new PhysicsState();
    renderState.copy(this.currentState);

    this.previousState = previousState;
    this.renderState = renderState;

    if (_util.isInDevMode) {
      // It is useful for debugging to be able to trace the states back to their jobs.
      this.currentState.job = this;
      this.previousState.job = this;
      this.renderState.job = this;
    }

    PhysicsEngine.instance.addJob(this);
  }

  /**
   * Unregisters this PhysicsJob and all of its descendant child jobs with the physics engine.
   *
   * Throws no error if the job is not registered.
   */
  finish() {
    PhysicsEngine.instance.removeJob(this);
  }

  /**
   * @param {number} [startTime]
   */
  restart(startTime) {
    this.finish();
    this.start(startTime);
  }
}

export {PhysicsJob};

/**
 * @typedef {Function} ForceApplier
 * @property {vec3} force Output.
 * @property {vec3} torque Output.
 * @property {PhysicsState} state Input.
 * @property {number} t Input.
 * @property {number} dt Input.
 */

/**
 * @typedef {Object} PhysicsConfig
 * @property {number} timeStepDuration
 * @property {number} gravity
 * @property {vec3} _gravityVec
 * @property {number} linearDragCoefficient
 * @property {number} angularDragCoefficient
 * @property {number} coefficientOfRestitution
 * @property {number} coefficientOfFriction
 * @property {number} lowMomentumSuppressionThreshold
 * @property {number} lowAngularMomentumSuppressionThreshold
 */
