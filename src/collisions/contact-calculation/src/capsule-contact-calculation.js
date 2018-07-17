/**
 * This module defines utility methods for calculating a contact point between capsules and other 
 * shapes.
 *
 * - Each of these functions assumes that the objects are actually colliding.
 * - The resulting contact point may be anywhere within the intersection of the two objects.
 */

import {
  findClosestPointFromAabbToPoint,
  findClosestPointOnSegmentToPoint,
  findClosestPointsFromSegmentToSegment,
  tmpVec1,
  tmpVec2
} from '../../../util';
import * as obbContactCalculation from './obb-contact-calculation';

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {vec3} point
 */
function capsuleVsPoint(contactPoint, contactNormal, capsule, point) {
  vec3.copy(contactPoint, point);
  findClosestPointOnSegmentToPoint(contactNormal, capsule.segment, point);
  vec3.subtract(contactNormal, contactPoint, contactNormal);
  vec3.normalize(contactNormal, contactNormal);
}

/**
 * Finds the closest point on the surface of the capsule to the sphere center.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {Sphere} sphere
 */
function capsuleVsSphere(contactPoint, contactNormal, capsule, sphere) {
  const sphereCenter = sphere.centerOfVolume;
  findClosestPointOnSegmentToPoint(contactPoint, capsule.segment, sphereCenter);
  vec3.subtract(contactNormal, sphereCenter, contactPoint);
  vec3.normalize(contactNormal, contactNormal);
  vec3.scaleAndAdd(contactPoint, contactPoint, contactNormal, capsule.radius);
}

/**
 * Finds the closest point on the surface of the capsule to the AABB.
 *
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {Aabb} aabb
 */
function capsuleVsAabb(contactPoint, contactNormal, capsule, aabb) {
  // tmpVec1 represents the closest point on the capsule to the AABB. tmpVec2
  // represents the closest point on the AABB to the capsule.

  //
  // Check whether the two capsule ends intersect the AABB (sphere vs AABB) (addresses the
  // capsule-vs-AABB-face case).
  //

  const squaredRadius = capsule.radius * capsule.radius;
  let doesAabbIntersectAnEndPoint = false;

  let endPoint = capsule.segment.start;
  findClosestPointFromAabbToPoint(tmpVec2, aabb, endPoint);
  if (vec3.squaredDistance(tmpVec2, endPoint) <= squaredRadius) {
    doesAabbIntersectAnEndPoint = true;
  } else {
    endPoint = capsule.segment.end;
    findClosestPointFromAabbToPoint(tmpVec2, aabb, endPoint);
    if (vec3.squaredDistance(tmpVec2, endPoint) <= squaredRadius) {
      doesAabbIntersectAnEndPoint = true;
    }
  }

  if (!doesAabbIntersectAnEndPoint) {
    //
    // Check whether the capsule intersects with any AABB edge (addresses the capsule-vs-AABB-edge
    // case).
    //
    aabb.someEdge(edge => {
      findClosestPointsFromSegmentToSegment(tmpVec1, tmpVec2,
          capsule.segment, edge);
      const distance = vec3.squaredDistance(tmpVec1, tmpVec2);
      return distance <= squaredRadius;
    });
  }

  // (The capsule-vs-AABB-vertex case is covered by the capsule-vs-AABB-edge case).

  findClosestPointOnSegmentToPoint(tmpVec1, capsule.segment, tmpVec2);
  vec3.subtract(contactNormal, tmpVec2, tmpVec1);
  vec3.normalize(contactNormal, contactNormal);
  vec3.scaleAndAdd(contactPoint, tmpVec1, contactNormal, capsule.radius);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {Obb} obb
 */
function capsuleVsObb(contactPoint, contactNormal, capsule, obb) {
  obbContactCalculation.obbVsCapsule(contactPoint, contactNormal, obb, capsule);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * Finds the closest point on the surface of capsule A to capsule B.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsuleA
 * @param {Capsule} capsuleB
 */
function capsuleVsCapsule(contactPoint, contactNormal, capsuleA, capsuleB) {
  findClosestPointsFromSegmentToSegment(tmpVec1, tmpVec2,
      capsuleA.segment, capsuleB.segment);
  vec3.subtract(contactNormal, tmpVec2, tmpVec1);
  vec3.normalize(contactNormal, contactNormal);
  vec3.scaleAndAdd(contactPoint, tmpVec1, contactNormal, capsuleA.radius);
}

export {
  capsuleVsPoint,
  capsuleVsSphere,
  capsuleVsAabb,
  capsuleVsObb,
  capsuleVsCapsule,
};
