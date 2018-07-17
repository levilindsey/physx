/**
 * This module defines utility methods for detecting whether intersection has occurred between
 * capsules and other shapes.
 */

import {
  findClosestPointFromAabbToPoint,
  findSquaredDistanceBetweenSegments,
  findSquaredDistanceFromSegmentToPoint,
  tmpVec1
} from '../../../util';
import * as obbCollisionDetection from './obb-collision-detection';

/**
 * @param {Capsule} capsule
 * @param {vec3} point
 * @returns {boolean}
 */
function capsuleVsPoint(capsule, point) {
  return findSquaredDistanceFromSegmentToPoint(capsule.segment, point) <=
      capsule.radius * capsule.radius;
}

/**
 * @param {Capsule} capsule
 * @param {Sphere} sphere
 * @returns {boolean}
 */
function capsuleVsSphere(capsule, sphere) {
  const sumOfRadii = capsule.radius + sphere.radius;
  return findSquaredDistanceFromSegmentToPoint(capsule.segment, sphere.centerOfVolume) <=
      sumOfRadii * sumOfRadii;
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {Capsule} capsule
 * @param {Aabb} aabb
 * @returns {boolean}
 */
function capsuleVsAabb(capsule, aabb) {
  const squaredRadius = capsule.radius * capsule.radius;

  // Check whether the two capsule ends intersect the AABB (sphere vs AABB) (addresses the
  // capsule-vs-AABB-face case).
  findClosestPointFromAabbToPoint(tmpVec1, aabb, capsule.segment.start);
  if (vec3.squaredDistance(tmpVec1, capsule.segment.start) <= squaredRadius) {
    return true;
  }
  findClosestPointFromAabbToPoint(tmpVec1, aabb, capsule.segment.end);
  if (vec3.squaredDistance(tmpVec1, capsule.segment.end) <= squaredRadius) {
    return true;
  }

  // Check whether the capsule intersects with any AABB edge (addresses the capsule-vs-AABB-edge
  // case).
  return aabb.someEdge(edge =>
      findSquaredDistanceBetweenSegments(capsule.segment, edge) <= squaredRadius);

  // (The capsule-vs-AABB-vertex case is covered by the capsule-vs-AABB-edge case).
}

/**
 * @param {Capsule} capsule
 * @param {Obb} obb
 * @returns {boolean}
 */
function capsuleVsObb(capsule, obb) {
  return obbCollisionDetection.obbVsCapsule(obb, capsule);
}

/**
 * @param {Capsule} capsuleA
 * @param {Capsule} capsuleB
 * @returns {boolean}
 */
function capsuleVsCapsule(capsuleA, capsuleB) {
  const sumOfRadii = capsuleA.radius + capsuleB.radius;
  return findSquaredDistanceBetweenSegments(capsuleA.segment, capsuleB.segment) <=
      sumOfRadii * sumOfRadii;
}

export {
  capsuleVsPoint,
  capsuleVsSphere,
  capsuleVsAabb,
  capsuleVsObb,
  capsuleVsCapsule,
};
