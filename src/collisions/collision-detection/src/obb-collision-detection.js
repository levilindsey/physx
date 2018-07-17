/**
 * This module defines utility methods for detecting whether intersection has occurred between
 * oriented bounding boxes and other shapes.
 */

import {
  findClosestPointFromObbToPoint,
  findPoiBetweenSegmentAndPlaneRegion,
  findSquaredDistanceBetweenSegments,
  tmpVec1,
  tmpVec2,
  tmpVec3,
  tmpVec4
} from '../../../util';
import * as aabbCollisionDetection from './aabb-collision-detection';
import * as capsuleCollisionDetection from './capsule-collision-detection';

// TODO: Refactor these to not actually calculate the point of intersection. These checks can
// instead be done more efficiently using SAT.

/**
 * @param {Obb} obb
 * @param {vec3} point
 * @returns {boolean}
 */
function obbVsPoint(obb, point) {
  vec3.subtract(tmpVec4, point, obb.centerOfVolume);

  vec3.set(tmpVec1, 1, 0, 0);
  vec3.transformQuat(tmpVec1, tmpVec1, obb.orientation);
  const axis1Distance = vec3.dot(tmpVec4, tmpVec1);

  if (axis1Distance >= -obb.halfSideLengthX && axis1Distance <= obb.halfSideLengthX) {
    vec3.set(tmpVec2, 0, 1, 0);
    vec3.transformQuat(tmpVec2, tmpVec2, obb.orientation);
    const axis2Distance = vec3.dot(tmpVec4, tmpVec2);

    if (axis2Distance >= -obb.halfSideLengthY && axis2Distance <= obb.halfSideLengthY) {
      vec3.set(tmpVec3, 0, 0, 1);
      vec3.transformQuat(tmpVec3, tmpVec3, obb.orientation);
      const axis3Distance = vec3.dot(tmpVec4, tmpVec3);

      return axis3Distance >= -obb.halfSideLengthZ && axis3Distance <= obb.halfSideLengthZ;
    }
  }

  return false;
}

/**
 * @param {Obb} obb
 * @param {Sphere} sphere
 * @returns {boolean}
 */
function obbVsSphere(obb, sphere) {
  findClosestPointFromObbToPoint(tmpVec1, obb, sphere.centerOfVolume);
  return vec3.squaredDistance(tmpVec1, sphere.centerOfVolume) <=
      sphere.radius * sphere.radius;
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {Obb} obb
 * @param {Aabb} aabb
 * @returns {boolean}
 */
function obbVsAabb(obb, aabb) {
  return _obbVsBoxHelper(obb, aabb, aabbCollisionDetection.aabbVsPoint);
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {Obb} obbA
 * @param {Obb} obbB
 * @returns {boolean}
 */
function obbVsObb(obbA, obbB) {
  return _obbVsBoxHelper(obbA, obbB, obbVsPoint);
}

/**
 * @param {Obb} obb
 * @param {Obb|Aabb} other
 * @param {Function} otherVsPointCallback
 * @returns {boolean}
 * @private
 */
function _obbVsBoxHelper(obb, other, otherVsPointCallback) {
  // Check whether any vertices from A lie within B's bounds.
  if (obb.someVertex(vertex => otherVsPointCallback(other, vertex))) return true;

  // Check whether any vertices from B lie within A's bounds.
  if (other.someVertex(vertex => obbVsPoint(obb, vertex))) return true;

  // We assume that a vertex-to-face collision would have been detected by one of the two above
  // checks. Any edge-to-edge collision must involve both an edge from A through a face of B and
  // vice versa. So it is sufficient to only check the edges of one and the faces of the other.
  if (other.someEdge(edge =>
          obb.someFace(face =>
              findPoiBetweenSegmentAndPlaneRegion(tmpVec1, edge, ...face))))
    return true;

  return false;
}

/**
 * @param {Obb} obb
 * @param {Capsule} capsule
 * @returns {boolean}
 */
function obbVsCapsule(obb, capsule) {
  // Check the edges.
  const squaredRadius = capsule.radius * capsule.radius;
  let areIntersecting = obb.someEdge(edge =>
      findSquaredDistanceBetweenSegments(capsule.segment, edge) < squaredRadius);

  if (areIntersecting) return true;

  // Check the faces.
  areIntersecting = obb.somePushedOutFace(face =>
          findPoiBetweenSegmentAndPlaneRegion(tmpVec1, capsule.segment, ...face), capsule.radius);

  // Check for inclusion of one shape inside the other.
  areIntersecting = areIntersecting || obbVsPoint(obb, capsule.centerOfVolume);
  areIntersecting = areIntersecting || capsuleCollisionDetection.capsuleVsPoint(capsule,
      obb.centerOfVolume);

  return areIntersecting;
}

export {
  obbVsPoint,
  obbVsSphere,
  obbVsAabb,
  obbVsObb,
  obbVsCapsule,
};
