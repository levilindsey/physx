/**
 * This module defines utility methods for calculating a contact point between axially-aligned 
 * bounding boxes and other shapes.
 *
 * - Each of these functions assumes that the objects are actually colliding.
 * - The resulting contact point may be anywhere within the intersection of the two objects.
 */

import * as sphereContactCalculation from './sphere-contact-calculation';
import * as obbContactCalculation from './obb-contact-calculation';
import * as capsuleContactCalculation from './capsule-contact-calculation';
import {tmpVec1} from '../../../util';
import {aabbCollisionDetection} from '../../collision-detection';

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {vec3} point
 */
function aabbVsPoint(contactPoint, contactNormal, aabb, point) {
  vec3.copy(contactPoint, point);
  findAabbNormalFromContactPoint(contactNormal, contactPoint, aabb);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {Sphere} sphere
 */
function aabbVsSphere(contactPoint, contactNormal, aabb, sphere) {
  sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, sphere, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabbA
 * @param {Aabb} aabbB
 */
function aabbVsAabb(contactPoint, contactNormal, aabbA, aabbB) {
  // Compute the contact normal.
  vec3.set(contactNormal, 0, 0, 0);
  const xIntersectionDepth = Math.min(aabbA.maxX - aabbB.minX, aabbB.maxX - aabbA.minX);
  const yIntersectionDepth = Math.min(aabbA.maxY - aabbB.minY, aabbB.maxY - aabbA.minY);
  const zIntersectionDepth = Math.min(aabbA.maxZ - aabbB.minZ, aabbB.maxZ - aabbA.minZ);
  // Assume that the direction of intersection corresponds to whichever axis has the shallowest
  // intersection.
  if (xIntersectionDepth <= yIntersectionDepth) {
    if (xIntersectionDepth <= zIntersectionDepth) {
      contactNormal[0] = aabbA.maxX - aabbB.minX <= aabbB.maxX - aabbA.minX ? 1 : -1;
    } else {
      contactNormal[2] = aabbA.maxZ - aabbB.minZ <= aabbB.maxZ - aabbA.minZ ? 1 : -1;
    }
  } else {
    if (yIntersectionDepth <= zIntersectionDepth) {
      contactNormal[1] = aabbA.maxY - aabbB.minY <= aabbB.maxY - aabbA.minY ? 1 : -1;
    } else {
      contactNormal[2] = aabbA.maxZ - aabbB.minZ <= aabbB.maxZ - aabbA.minZ ? 1 : -1;
    }
  }

  // TODO: The two AABBs form a square intersection cross-section region along the direction of the
  // normal. Calculate the center of that square to use as the point of contact.
  if (!aabbA.someVertex(vertex => aabbCollisionDetection.aabbVsPoint(aabbB, vertex),
          contactPoint)) {
    aabbB.someVertex(vertex => aabbCollisionDetection.aabbVsPoint(aabbA, vertex), contactPoint);
  }
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {Obb} obb
 */
function aabbVsObb(contactPoint, contactNormal, aabb, obb) {
  obbContactCalculation.obbVsAabb(contactPoint, contactNormal, obb, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {Capsule} capsule
 */
function aabbVsCapsule(contactPoint, contactNormal, aabb, capsule) {
  capsuleContactCalculation.capsuleVsAabb(contactPoint, contactNormal, capsule, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactNormal Output param.
 * @param {vec3} contactPoint
 * @param {Aabb} aabb
 * @private
 */
function findAabbNormalFromContactPoint(contactNormal, contactPoint, aabb) {
  vec3.set(contactNormal, 0, 0, 0);
  vec3.subtract(tmpVec1, contactPoint, aabb.centerOfVolume);
  const xDistanceFromFace = aabb.rangeX / 2 - Math.abs(tmpVec1[0]);
  const yDistanceFromFace = aabb.rangeY / 2 - Math.abs(tmpVec1[1]);
  const zDistanceFromFace = aabb.rangeZ / 2 - Math.abs(tmpVec1[2]);
  // Assume that the point is contacting whichever face it's closest to.
  if (xDistanceFromFace <= yDistanceFromFace) {
    if (xDistanceFromFace <= zDistanceFromFace) {
      contactNormal[0] = tmpVec1[0] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = tmpVec1[2] > 0 ? 1 : -1;
    }
  } else {
    if (yDistanceFromFace <= zDistanceFromFace) {
      contactNormal[1] = tmpVec1[1] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = tmpVec1[2] > 0 ? 1 : -1;
    }
  }
}

export {
  aabbVsPoint,
  aabbVsSphere,
  aabbVsAabb,
  aabbVsObb,
  aabbVsCapsule,
  findAabbNormalFromContactPoint,
};
