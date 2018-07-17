import {Collidable} from './collidable';
import {LineSegment} from './line-segment';

/**
 * This class represents a capsule.
 *
 * - A capsule is a cylinder with semi-spheres on either end.
 * - A capsule can represent a rough approximation of many useful shapes.
 * - A capsule can be used for relatively efficient collision detection.
 */
class Capsule extends Collidable {
  /**
   * The default orientation of the capsule is along the z-axis.
   *
   * @param {number} halfDistance Half the distance from the centers of the capsule end spheres.
   * @param {number} radius
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  constructor(halfDistance, radius, isStationary = false, physicsJob) {
    super(isStationary, physicsJob);
    this.halfDistance = halfDistance;
    this.segment = new LineSegment(vec3.fromValues(0, 0, -halfDistance),
        vec3.fromValues(0, 0, halfDistance));
    this.radius = radius;
  }

  /**
   * @returns {vec3}
   * @override
   */
  get centerOfVolume() {
    return this.segment.center;
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
    this.segment.center = value;
  }

  /**
   * @param {quat} value
   * @override
   */
  set orientation(value) {
    this.segment.orientation = value;
  }
}

export {Capsule};
