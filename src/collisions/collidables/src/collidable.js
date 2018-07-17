/**
 * This class represents a 3D collidable rigid object.
 *
 * This is useful for collision detection and response.
 *
 * @abstract
 */
class Collidable {
  /**
   * @param {boolean} isStationary
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  constructor(isStationary, physicsJob) {
    // Collidable is an abstract class. It should not be instantiated directly.
    if (new.target === Collidable) {
      throw new TypeError('Cannot construct Collidable instances directly');
    }

    this.isStationary = isStationary;
    this.physicsJob = physicsJob;
    this.collisions = [];
    this.previousCollisions = [];
  }

  /**
   * Implementing classes can override this to provide a center of mass that is different than the
   * center of volume.
   *
   * @returns {vec3}
   */
  get centerOfMass() {
    return this.centerOfVolume;
  }

  /**
   * @returns {vec3}
   * @abstract
   */
  get centerOfVolume() {
    // Extending classes should implement this method.
    throw new TypeError('Method not implemented');
  }

  /**
   * @returns {Collidable}
   * @abstract
   */
  get boundingVolume() {
    // Extending classes should implement this method.
    throw new TypeError('Method not implemented');
  }

  /**
   * @param {vec3} value
   * @abstract
   */
  set position(value) {
    // Extending classes should implement this method.
    throw new TypeError('Method not implemented');
  }

  /**
   * @param {quat} value
   * @abstract
   */
  set orientation(value) {
    // Extending classes should implement this method.
    throw new TypeError('Method not implemented');
  }
}

export {Collidable};
