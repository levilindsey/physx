import {_geometry, _util} from '../../util';
import {Integrator} from './integrator';
import {PhysicsState} from '../../src/physics-state';

// TODO: Account for the fact that collisions take place between time steps; integration should
// really consider the previous state as being the time and state at the moment of collision.

/**
 * This class numerically integrates the equations of motion. That is, this implements physics
 * simulations by updating position and velocity values for each time step.
 *
 * This integrator is an implementation of the classical Runge-Kutta method (RK4)
 * (https://en.wikipedia.org/wiki/Runge_kutta).
 *
 * This integrator causes energy to be lost at a small rate. This is a common problem for numerical
 * integrators, and is usually negligible.
 */
class RK4Integrator extends Integrator {
  constructor() {
    super();
    if (_util.isInDevMode) {
      this._wrapForDevMode();
    }
  }

  /**
   * Integrate the state from t to t + dt.
   *
   * @param {PhysicsJob} job
   * @param {number} t Total elapsed time.
   * @param {number} dt Duration of the current time step.
   */
  integrate(job, t, dt) {
    const state = job.currentState;
    _tempState.copy(state);

    _calculateDerivative(_a, _tempState, job, t, 0, _EMPTY_DERIVATIVE);
    _calculateDerivative(_b, _tempState, job, t, dt * 0.5, _a);
    _calculateDerivative(_c, _tempState, job, t, dt * 0.5, _b);
    _calculateDerivative(_d, _tempState, job, t, dt, _c);

    _calculateVec3DerivativeWeightedSum(
        _positionDerivative, _a.velocity, _b.velocity, _c.velocity, _d.velocity);
    _calculateVec3DerivativeWeightedSum(
        _momentumDerivative, _a.force, _b.force, _c.force, _d.force);
    _calculateQuatDerivativeWeightedSum(_orientationDerivative, _a.spin, _b.spin, _c.spin, _d.spin);
    _calculateVec3DerivativeWeightedSum(
        _angularMomentumDerivative, _a.torque, _b.torque, _c.torque, _d.torque);

    vec3.scaleAndAdd(state.position, state.position, _positionDerivative, dt);
    vec3.scaleAndAdd(state.momentum, state.momentum, _momentumDerivative, dt);
    _geometry.scaleAndAddQuat(state.orientation, state.orientation, _orientationDerivative, dt);
    vec3.scaleAndAdd(state.angularMomentum, state.angularMomentum, _angularMomentumDerivative, dt);

    state.updateDependentFields();
  }

  /**
   * Wraps the integrate method and check for NaN values after each integration.
   *
   * @private
   */
  _wrapForDevMode() {
    const unguardedIntegrate = this.integrate.bind(this);
    this.integrate = (job, t, dt) => {
      unguardedIntegrate(job, t, dt);
      _checkForStateError(job.currentState);
    };
  }
}

/**
 * Calculate the derivative from the given state with the given time step.
 *
 * @param {PhysicsDerivative} out
 * @param {PhysicsState} state
 * @param {PhysicsJob} job
 * @param {number} t
 * @param {number} dt
 * @param {PhysicsDerivative} d
 * @private
 */
function _calculateDerivative(out, state, job, t, dt, d) {
  vec3.scaleAndAdd(state.position, state.position, d.velocity, dt);
  vec3.scaleAndAdd(state.momentum, state.momentum, d.force, dt);
  _geometry.scaleAndAddQuat(state.orientation, state.orientation, d.spin, dt);
  vec3.scaleAndAdd(state.angularMomentum, state.angularMomentum, d.torque, dt);

  state.updateDependentFields();

  out.velocity = state.velocity;
  out.spin = state.spin;
  vec3.set(out.force, 0, 0, 0);
  vec3.set(out.torque, 0, 0, 0);

  _forceApplierOutput.force = out.force;
  _forceApplierOutput.torque = out.torque;
  _forceApplierInput.state = state;
  _forceApplierInput.t = t + dt;
  _forceApplierInput.dt = dt;

  job.applyForces(_forceApplierOutput, _forceApplierInput);
}

const _EMPTY_DERIVATIVE = Integrator.createDerivative();

const _tempState = new PhysicsState();
const _a = Integrator.createDerivative();
const _b = Integrator.createDerivative();
const _c = Integrator.createDerivative();
const _d = Integrator.createDerivative();

const _positionDerivative = vec3.create();
const _momentumDerivative = vec3.create();
const _orientationDerivative = quat.create();
const _angularMomentumDerivative = vec3.create();

const _forceApplierOutput = {};
const _forceApplierInput = {};

/**
 * @param {vec3} out
 * @param {vec3} a
 * @param {vec3} b
 * @param {vec3} c
 * @param {vec3} d
 * @private
 */
function _calculateVec3DerivativeWeightedSum(out, a, b, c, d) {
  out[0] = 1 / 6 * (a[0] + 2 * (b[0] + c[0]) + d[0]);
  out[1] = 1 / 6 * (a[1] + 2 * (b[1] + c[1]) + d[1]);
  out[2] = 1 / 6 * (a[2] + 2 * (b[2] + c[2]) + d[2]);
}

/**
 * @param {quat} out
 * @param {quat} a
 * @param {quat} b
 * @param {quat} c
 * @param {quat} d
 * @private
 */
function _calculateQuatDerivativeWeightedSum(out, a, b, c, d) {
  out[0] = 1 / 6 * (a[0] + 2 * (b[0] + c[0]) + d[0]);
  out[1] = 1 / 6 * (a[1] + 2 * (b[1] + c[1]) + d[1]);
  out[2] = 1 / 6 * (a[2] + 2 * (b[2] + c[2]) + d[2]);
  out[3] = 1 / 6 * (a[3] + 2 * (b[3] + c[3]) + d[3]);
}

/**
 * @param {PhysicsState} state
 * @private
 */
function _checkForStateError(state) {
  const errorProperties = [
    'position',
    'momentum',
    'orientation',
    'angularMomentum',
  ].filter(property => _containsNaN(state[property]));
  const property = errorProperties[0];
  if (property) {
    throw new Error(`${property} contains a NaN value after integrating: ${state[property]}`);
  }
}

/**
 * Determines whether the given vector contains a NaN value.
 *
 * @param {vec3} v
 * @private
 */
function _containsNaN(v) {
  return isNaN(v[0]) || isNaN(v[1]) || isNaN(v[2]);
}

const rk4Integrator = new RK4Integrator();

export {rk4Integrator};
