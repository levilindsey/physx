import {Collidable} from './collidable';

/**
 * This class represents a bounding sphere.
 *
 * This is primarily useful for collision detection. A bounding sphere is only appropriate for some
 * geometries. For other geometries, an axially-aligned bounding box may be more appropriate. For
 * others still, an oriented bounding box or a more complicated hierarchical model may be more
 * appropriate.
 */
class Sphere extends Collidable {
  /**
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} centerZ
   * @param {number} radius
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  constructor(centerX, centerY, centerZ, radius, isStationary = false, physicsJob) {
    super(isStationary, physicsJob);
    this.centerX = centerX;
    this.centerY = centerY;
    this.centerZ = centerZ;
    this.radius = radius;
  }

  /**
   * @returns {vec3}
   * @override
   */
  get centerOfVolume() {
    // Reuse the same object when this is called multiple times.
    this._center = this._center || vec3.create();
    vec3.set(this._center, this.centerX, this.centerY, this.centerZ);
    return this._center;
  }

  /**
   * @returns {Collidable}
   * @override
   */
  get boundingVolume() {
    return this;
  }

  /**
   * @param {vec3} value
   * @override
   */
  set position(value) {
    this.centerX = value[0];
    this.centerY = value[1];
    this.centerZ = value[2];
  }

  /**
   * @param {quat} value
   * @override
   */
  set orientation(value) {
    // Do nothing.
  }
}

export {Sphere};
