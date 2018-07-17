/**
 * This module defines utility methods for calculating a contact point between oriented bounding
 * boxes and other shapes.
 *
 * - Each of these functions assumes that the objects are actually colliding.
 * - The resulting contact point may be anywhere within the intersection of the two objects.
 */

import {
  findPoiBetweenSegmentAndPlaneRegion,
  findClosestPointFromObbToPoint,
  findSquaredDistanceBetweenSegments,
  findClosestPointsFromSegmentToSegment,
  tmpVec1
} from '../../../util';
import {aabbCollisionDetection, obbCollisionDetection} from '../../collision-detection';
import {LineSegment} from '../../collidables';
import * as aabbContactCalculation from './aabb-contact-calculation';

// TODO: There are more efficient (but far more complicated) algorithms for finding the point of
// intersection with OBBs. Port over some other pre-existing solutions for these.

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {vec3} point
 */
function obbVsPoint(contactPoint, contactNormal, obb, point) {
  vec3.copy(contactPoint, point);
  findObbNormalFromContactPoint(contactNormal, contactPoint, obb);
}

/**
 * Finds the closest point anywhere inside the OBB to the center of the sphere.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Sphere} sphere
 */
function obbVsSphere(contactPoint, contactNormal, obb, sphere) {
  findClosestPointFromObbToPoint(contactPoint, obb, sphere.centerOfVolume);
  vec3.subtract(contactNormal, sphere.centerOfVolume, contactPoint);
  vec3.normalize(contactNormal, contactNormal);
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Aabb} aabb
 */
function obbVsAabb(contactPoint, contactNormal, obb, aabb) {
  return _obbVsBoxHelper(contactPoint, contactNormal, obb, aabb, aabbCollisionDetection.aabbVsPoint,
      aabbContactCalculation.findAabbNormalFromContactPoint);
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obbA
 * @param {Obb} obbB
 */
function obbVsObb(contactPoint, contactNormal, obbA, obbB) {
  return _obbVsBoxHelper(contactPoint, contactNormal, obbA, obbB, obbCollisionDetection.obbVsPoint,
      findObbNormalFromContactPoint);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Obb|Aabb} other
 * @param {Function} otherVsPointCollisionDetectionCallback
 * @param {Function} findOtherNormalFromContactPoint
 * @private
 */
function _obbVsBoxHelper(contactPoint, contactNormal, obb, other,
                         otherVsPointCollisionDetectionCallback,
                         findOtherNormalFromContactPoint) {
  // Check whether any vertices from A lie within B's bounds.
  if (obb.someVertex(vertex => otherVsPointCollisionDetectionCallback(other, vertex),
          contactPoint)) {
    findOtherNormalFromContactPoint(contactNormal, contactPoint, other);
    vec3.negate(contactNormal, contactNormal);
    return;
  }

  // Check whether any vertices from B lie within A's bounds.
  if (other.someVertex(vertex => obbCollisionDetection.obbVsPoint(obb, vertex), contactPoint)) {
    findObbNormalFromContactPoint(contactNormal, contactPoint, obb);
    return;
  }

  // We assume that a vertex-to-face collision would have been detected by one of the two above
  // checks. Any edge-to-edge collision must involve both an edge from A through a face of B and
  // vice versa. So it is sufficient to only check the edges of one and the faces of the other.
  other.someEdge(edge =>
      obb.someFace(face => findPoiBetweenSegmentAndPlaneRegion(contactPoint, edge, ...face)));
  findObbNormalFromContactPoint(contactNormal, contactPoint, obb);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Capsule} capsule
 */
function obbVsCapsule(contactPoint, contactNormal, obb, capsule) {
  // tmpVec1 is the point on the capsule segment that is closest to the OBB.

  //
  // Check the edges.
  //

  const segment = new LineSegment(vec3.create(), vec3.create());
  const squaredRadius = capsule.radius * capsule.radius;
  const areIntersecting = obb.someEdge(edge =>
      findSquaredDistanceBetweenSegments(capsule.segment, edge) < squaredRadius, segment);

  if (areIntersecting) {
    findClosestPointsFromSegmentToSegment(tmpVec1, contactPoint, capsule.segment, segment);
    vec3.subtract(contactNormal, tmpVec1, contactPoint);
    vec3.normalize(contactNormal, contactNormal);
    return;
  }

  //
  // Check the faces.
  //

  obb.somePushedOutFace(face =>
      findPoiBetweenSegmentAndPlaneRegion(tmpVec1, capsule.segment, ...face), capsule.radius);

  findObbNormalFromContactPoint(contactNormal, tmpVec1, obb);

  // NOTE: This assumes that the angle between the capsule segment and the face plane is not oblique
  // and that the depth of penetration is shallow. When both of these conditions are not true, the
  // contact point will be offset from the intersection point on the pushed-out face.
  vec3.scaleAndAdd(contactPoint, tmpVec1, contactNormal, -capsule.radius);
}

/**
 * @param {vec3} contactNormal Output param.
 * @param {vec3} contactPoint
 * @param {Obb} obb
 * @private
 */
function findObbNormalFromContactPoint(contactNormal, contactPoint, obb) {
  // Calculate the displacement along each axis.
  const projections = [];
  vec3.subtract(tmpVec1, contactPoint, obb.centerOfVolume);
  for (let i = 0; i < 3; i++) {
    projections[i] = vec3.dot(obb.axes[i], tmpVec1);
  }

  // Determine which face the normal is pointing away from.
  vec3.set(contactNormal, 0, 0, 0);
  const xDistanceFromFace = obb.halfSideLengths[0] - Math.abs(projections[0]);
  const yDistanceFromFace = obb.halfSideLengths[1] - Math.abs(projections[1]);
  const zDistanceFromFace = obb.halfSideLengths[2] - Math.abs(projections[2]);
  // Assume that the point is contacting whichever face it's closest to.
  if (xDistanceFromFace <= yDistanceFromFace) {
    if (xDistanceFromFace <= zDistanceFromFace) {
      contactNormal[0] = projections[0] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = projections[2] > 0 ? 1 : -1;
    }
  } else {
    if (yDistanceFromFace <= zDistanceFromFace) {
      contactNormal[1] = projections[1] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = projections[2] > 0 ? 1 : -1;
    }
  }

  // Apply the OBB's orientation to the normal.
  vec3.transformQuat(contactNormal, contactNormal, obb.orientation);
}

export {
  obbVsPoint,
  obbVsSphere,
  obbVsAabb,
  obbVsObb,
  obbVsCapsule,
  findObbNormalFromContactPoint,
};
