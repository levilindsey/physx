/**
 * This module defines utility methods for calculating a contact point between spheres and other
 * shapes.
 *
 * - Each of these functions assumes that the objects are actually colliding.
 * - The resulting contact point may be anywhere within the intersection of the two objects.
 */

import {findClosestPointFromAabbSurfaceToPoint} from '../../../util';
import {findAabbNormalFromContactPoint} from './aabb-contact-calculation';
import * as obbContactCalculation from './obb-contact-calculation';
import * as capsuleContactCalculation from './capsule-contact-calculation';

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {vec3} point
 */
function sphereVsPoint(contactPoint, contactNormal, sphere, point) {
  vec3.copy(contactPoint, point);
  // Assume that the point is contacting the closest point on the surface of the sphere.
  vec3.subtract(contactNormal, point, sphere.centerOfVolume);
  vec3.normalize(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphereA
 * @param {Sphere} sphereB
 */
function sphereVsSphere(contactPoint, contactNormal, sphereA, sphereB) {
  vec3.subtract(contactNormal, sphereB.centerOfVolume, sphereA.centerOfVolume);
  vec3.normalize(contactNormal, contactNormal);
  // The point on the surface of sphere A that is closest to the center of sphere B.
  vec3.scaleAndAdd(contactPoint, sphereA.centerOfVolume, contactNormal, sphereA.radius);
}

/**
 * Finds the closest point on the surface of the AABB to the sphere center.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {Aabb} aabb
 */
function sphereVsAabb(contactPoint, contactNormal, sphere, aabb) {
  findClosestPointFromAabbSurfaceToPoint(contactPoint, aabb, sphere.centerOfVolume);
  findAabbNormalFromContactPoint(contactNormal, contactPoint, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {Obb} obb
 */
function sphereVsObb(contactPoint, contactNormal, sphere, obb) {
  obbContactCalculation.obbVsSphere(contactPoint, contactNormal, obb, sphere);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {Capsule} capsule
 */
function sphereVsCapsule(contactPoint, contactNormal, sphere, capsule) {
  capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, capsule, sphere);
  vec3.negate(contactNormal, contactNormal);
}

export {
  sphereVsPoint,
  sphereVsSphere,
  sphereVsAabb,
  sphereVsObb,
  sphereVsCapsule,
};
