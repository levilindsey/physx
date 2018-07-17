/**
 * This module defines a collection of static general utility functions for calculating forces.
 */

/**
 * @param {GravityApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyGravity(config, output, input) {
  vec3.scaleAndAdd(output.force, output.force, config._gravityVec, input.state.mass);
}

/**
 * @param {LinearDragApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyLinearDrag(config, output, input) {
  const dragMagnitude = -vec3.squaredLength(input.state.velocity) * config.linearDragCoefficient;
  vec3.normalize(_vec3, input.state.velocity);
  vec3.scaleAndAdd(output.force, output.force, _vec3, dragMagnitude);
}

/**
 * @param {AngularDragApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyAngularDrag(config, output, input) {
  vec3.scaleAndAdd(output.torque, output.torque, input.state.angularVelocity,
      config.angularDragCoefficient);
}

/**
 * Applies a simple linear spring force (using Hooke's law).
 *
 * force = displacement * coefficient
 *
 * @param {LinearSpringForceApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyLinearSpringForce(config, output, input) {
  vec3.subtract(_vec3, config.getIntendedPosition(), input.state.position);
  vec3.scaleAndAdd(output.force, output.force, _vec3, config.springCoefficient);
}

/**
 * @param {SpringDampingApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applySpringDamping(config, output, input) {
  vec3.scale(_vec3, input.state.velocity, -config.dampingCoefficient);
  vec3.add(output.force, output.force, _vec3);
}

const _vec3 = vec3.create();

export {
  applyAngularDrag,
  applyGravity,
  applyLinearDrag,
  applyLinearSpringForce,
  applySpringDamping,
}

/**
 * @typedef {Object} GravityApplierConfig
 * @property {vec3} _gravityVec
 */

/**
 * @typedef {Object} LinearDragApplierConfig
 * @property {number} linearDragCoefficient
 */

/**
 * @typedef {Object} AngularDragApplierConfig
 * @property {number} angularDragCoefficient
 */

/**
 * @typedef {Object} LinearSpringForceApplierConfig
 * @property {number} springCoefficient
 * @property {Function.<vec3>} getIntendedPosition
 */

/**
 * @typedef {Object} SpringDampingApplierConfig
 * @property {number} dampingCoefficient
 */
