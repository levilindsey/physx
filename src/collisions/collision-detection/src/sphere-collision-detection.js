import {findClosestPointFromAabbToPoint, tmpVec1} from '../../../util';
import * as obbCollisionDetection from './obb-collision-detection';
import * as capsuleCollisionDetection from './capsule-collision-detection';

/**
 * This module defines utility methods for detecting whether intersection has occurred between
 * spheres and other shapes.
 */

/**
 * @param {Sphere} sphere
 * @param {vec3} point
 * @returns {boolean}
 */
function sphereVsPoint(sphere, point) {
  return vec3.squaredDistance(point, sphere.centerOfVolume) <= sphere.radius * sphere.radius;
}

/**
 * @param {Sphere} sphereA
 * @param {Sphere} sphereB
 * @returns {boolean}
 */
function sphereVsSphere(sphereA, sphereB) {
  const sumOfRadii = sphereA.radius + sphereB.radius;
  return vec3.squaredDistance(sphereA.centerOfVolume, sphereB.centerOfVolume) <=
      sumOfRadii * sumOfRadii;
}

/**
 * @param {Sphere} sphere
 * @param {Aabb} aabb
 * @returns {boolean}
 */
function sphereVsAabb(sphere, aabb) {
  findClosestPointFromAabbToPoint(tmpVec1, aabb, sphere.centerOfVolume);
  return vec3.squaredDistance(tmpVec1, sphere.centerOfVolume) <= sphere.radius * sphere.radius;
}

/**
 * @param {Sphere} sphere
 * @param {Obb} obb
 * @returns {boolean}
 */
function sphereVsObb(sphere, obb) {
  return obbCollisionDetection.obbVsSphere(obb, sphere);
}

/**
 * @param {Sphere} sphere
 * @param {Capsule} capsule
 * @returns {boolean}
 */
function sphereVsCapsule(sphere, capsule) {
  return capsuleCollisionDetection.capsuleVsSphere(capsule, sphere);
}

export {
  sphereVsPoint,
  sphereVsSphere,
  sphereVsAabb,
  sphereVsObb,
  sphereVsCapsule,
};
