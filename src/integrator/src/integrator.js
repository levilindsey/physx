/**
 * This class numerically integrates the equations of motion. That is, an integrator implements
 * physics simulations by updating position and velocity values for each time step.
 *
 * @abstract
 */
class Integrator {
  constructor() {
    // Integrator is an abstract class. It should not be instantiated directly.
    if (new.target === Integrator) {
      throw new TypeError('Cannot construct Integrator instances directly');
    }
  }

  /**
   * Integrate the state from t to t + dt.
   *
   * @param {PhysicsJob} job
   * @param {number} t Total elapsed time.
   * @param {number} dt Duration of the current time step.
   * @abstract
   */
  integrate(job, t, dt) {
    // Extending classes should implement this method.
    throw new TypeError('Method not implemented');
  }

  /**
   * @returns {PhysicsDerivative}
   */
  static createDerivative() {
    return {
      velocity: vec3.create(),
      force: vec3.create(),
      spin: quat.create(),
      torque: vec3.create()
    };
  }
}

export {Integrator};

/**
 * @typedef {Object} PhysicsDerivative
 * @property {vec3} velocity Derivative of position.
 * @property {vec3} force Derivative of momentum.
 * @property {quat} spin Derivative of orientation.
 * @property {vec3} torque Derivative of angular momentum.
 */

/**
 * @typedef {Object} ForceApplierOutput
 * @property {vec3} force
 * @property {vec3} torque
 */

/**
 * @typedef {Object} ForceApplierInput
 * @property {PhysicsState} state
 * @property {number} t
 * @property {number} dt
 */
