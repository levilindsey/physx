import * as sphereCollisionDetection from './sphere-collision-detection';
import * as obbCollisionDetection from './obb-collision-detection';
import * as capsuleCollisionDetection from './capsule-collision-detection';
import {aabbVsPoint as geometryAabbVsPoint} from '../../../util';

/**
 * This module defines utility methods for detecting whether intersection has occurred between
 * axially-aligned bounding boxes and other shapes.
 */

/**
 * @param {Aabb} aabb
 * @param {vec3} point
 * @returns {boolean}
 */
function aabbVsPoint(aabb, point) {
  return geometryAabbVsPoint(aabb, point);
}

/**
 * @param {Aabb} aabb
 * @param {Sphere} sphere
 * @returns {boolean}
 */
function aabbVsSphere(aabb, sphere) {
  return sphereCollisionDetection.sphereVsAabb(sphere, aabb);
}

/**
 * @param {Aabb} aabbA
 * @param {Aabb} aabbB
 * @returns {boolean}
 */
function aabbVsAabb(aabbA, aabbB) {
  return aabbA.maxX >= aabbB.minX && aabbA.minX <= aabbB.maxX &&
      aabbA.maxY >= aabbB.minY && aabbA.minY <= aabbB.maxY &&
      aabbA.maxZ >= aabbB.minZ && aabbA.minZ <= aabbB.maxZ;
}

/**
 * @param {Aabb} aabb
 * @param {Obb} obb
 * @returns {boolean}
 */
function aabbVsObb(aabb, obb) {
  return obbCollisionDetection.obbVsAabb(obb, aabb);
}

/**
 * @param {Aabb} aabb
 * @param {Capsule} capsule
 * @returns {boolean}
 */
function aabbVsCapsule(aabb, capsule) {
  return capsuleCollisionDetection.capsuleVsAabb(capsule, aabb);
}

export {
  aabbVsPoint,
  aabbVsSphere,
  aabbVsAabb,
  aabbVsObb,
  aabbVsCapsule,
};
