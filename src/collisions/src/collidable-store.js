import {detectBoundingVolumeIntersection} from './collision-utils';

// TODO: Implement some form of bounding volume hierarchy to make searching for potential collisions
// more efficient.

/**
 * This class registers and retrieves all Collidables within a scene.
 */
class CollidableStore {
  constructor() {
    this._collidables = [];
  }

  /**
   * Caches the given program wrapper.
   *
   * This method is idempotent; a given program will only be cached once.
   *
   * @param {Collidable} collidable
   */
  registerCollidable(collidable) {
    this._collidables.push(collidable);
  }

  /**
   * @param {Collidable} collidable
   */
  unregisterCollidable(collidable) {
    const index = this._collidables.indexOf(collidable);
    if (index >= 0) {
      this._collidables.splice(index, 1);
    }
  }

  /**
   * @param {Collidable} collidable
   * @returns {Array.<Collidable>}
   */
  getPossibleCollisionsForCollidable(collidable) {
    return this._collidables.filter(other =>
      collidable !== other &&
      detectBoundingVolumeIntersection(collidable, other));
  }

  /**
   * @returns {Array.<Collision>}
   */
  getPossibleCollisionsForAllCollidables() {
    const result = [];
    for (let i = 0, count = this._collidables.length; i < count; i++) {
      const collidableA = this._collidables[i];
      for (let j = i + 1; j < count; j++) {
        const collidableB = this._collidables[j];
        if (detectBoundingVolumeIntersection(collidableA, collidableB)) {
          result.push({collidableA: collidableA, collidableB: collidableB});
        }
      }
    }
    return result;
  }

  /**
   * @param {Function} callback
   */
  forEach(callback) {
    this._collidables.forEach(callback);
  }
}

const collidableStore = new CollidableStore();
export {collidableStore};

/**
 * @typedef {Object} Collision
 * @property {Collidable} collidableA
 * @property {Collidable} collidableB
 * @property {vec3} [contactPoint] In world coordinates.
 * @property {vec3} [contactNormal] Points away from body A and toward body B.
 * @property {number} [time]
 */
