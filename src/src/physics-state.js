import {rotateTensor, createBoxInertiaTensor} from '../util';

/**
 * This class represents the state of an object that is needed for a physics simulation (such as
 * position, momentum, and mass).
 */
class PhysicsState {
  /**
   * @param {DynamicsConfig} [dynamicsParams={}]
   */
  constructor(dynamicsParams = {}) {
    const position = dynamicsParams.position || vec3.create();
    const momentum = dynamicsParams.momentum || vec3.create();
    const orientation = dynamicsParams.orientation || quat.create();
    const angularMomentum = dynamicsParams.angularMomentum || vec3.create();
    const mass = dynamicsParams.mass || 1;
    const unrotatedInertiaTensor = dynamicsParams.unrotatedInertiaTensor || createBoxInertiaTensor(1, 1, 1, mass);

    // Constant fields.

    this.mass = mass;
    this.inverseMass = 1 / mass;
    this.unrotatedInertiaTensor = unrotatedInertiaTensor;

    // Independent fields.

    this.position = position;
    this.momentum = momentum;
    this.orientation = orientation;
    this.angularMomentum = angularMomentum;

    // Dependent fields.

    // Linear velocity.
    this.velocity = vec3.create();
    // Quaternion-based representation of the rate of change in orientation.
    this.spin = quat.create();
    // Vector-based representation of the angular velocity.
    this.angularVelocity = vec3.create();
    // The inverse inertia tensor rotated to the world coordinate frame.
    this.inverseInertiaTensor = mat3.create();

    this.updateDependentFields();
  }

  updateDependentFields() {// TODO: Test this somehow...
    // Update linear velocity.
    vec3.scale(this.velocity, this.momentum, this.inverseMass);

    // Update angular velocity.
    quat.normalize(this.orientation, this.orientation);
    rotateTensor(this.inverseInertiaTensor, this.unrotatedInertiaTensor, this.orientation);
    mat3.invert(this.inverseInertiaTensor, this.unrotatedInertiaTensor);
    vec3.transformMat3(this.angularVelocity, this.angularMomentum, this.inverseInertiaTensor);
    quat.set(this.spin, this.angularVelocity[0], this.angularVelocity[1],
        this.angularVelocity[2], 0);
    quat.scale(this.spin, this.spin, 0.5);
    quat.multiply(this.spin, this.spin, this.orientation);
  }

  /**
   * Perform a deep copy.
   *
   * @param {PhysicsState} other
   */
  copy(other) {
    this.mass = other.mass;
    this.inverseMass = other.inverseMass;
    mat3.copy(this.unrotatedInertiaTensor, other.unrotatedInertiaTensor);
    mat3.copy(this.inverseInertiaTensor, other.inverseInertiaTensor);
    vec3.copy(this.position, other.position);
    vec3.copy(this.momentum, other.momentum);
    quat.copy(this.orientation, other.orientation);
    vec3.copy(this.angularMomentum, other.angularMomentum);
    vec3.copy(this.velocity, other.velocity);
    quat.copy(this.spin, other.spin);
    vec3.copy(this.angularVelocity, other.angularVelocity);
  }

  /**
   * @param {PhysicsState} a
   * @param {PhysicsState} b
   * @param {number} partialRatio
   */
  lerp(a, b, partialRatio) {
    vec3.lerp(this.position, a.position, b.position, partialRatio);
    vec3.lerp(this.momentum, a.momentum, b.momentum, partialRatio);
    quat.slerp(this.orientation, a.orientation, b.orientation, partialRatio);
    quat.normalize(this.orientation, this.orientation);
    vec3.lerp(this.angularMomentum, a.angularMomentum, b.angularMomentum, partialRatio);
    this.updateDependentFields();
  }
}

export {PhysicsState};

/**
 * @typedef {Object} DynamicsConfig
 * @property {vec3} [position]
 * @property {vec3} [momentum]
 * @property {quat} [orientation]
 * @property {vec3} [angularMomentum]
 * @property {number} [mass]
 * @property {mat3} [unrotatedInertiaTensor]
 */
