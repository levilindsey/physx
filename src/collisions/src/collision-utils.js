import {
  Aabb,
  Capsule,
  Obb,
  Sphere
} from '../collidables';

import {
  aabbCollisionDetection,
  capsuleCollisionDetection,
  obbCollisionDetection,
  sphereCollisionDetection,
} from '../collision-detection';

import {
  aabbContactCalculation,
  capsuleContactCalculation,
  obbContactCalculation,
  sphereContactCalculation,
} from '../contact-calculation';

/**
 * This module defines a collection of static utility functions for detecting and responding to
 * collisions.
 */

/**
 * @param {Collidable} a
 * @param {Collidable} b
 * @returns {boolean}
 */
function detectIntersection(a, b) {
  if (a instanceof Sphere) {
    if (b instanceof Sphere) {
      return sphereCollisionDetection.sphereVsSphere(a, b);
    } else if (b instanceof Aabb) {
      return sphereCollisionDetection.sphereVsAabb(a, b);
    } else if (b instanceof Capsule) {
      return sphereCollisionDetection.sphereVsCapsule(a, b);
    } else if (b instanceof Obb) {
      return sphereCollisionDetection.sphereVsObb(a, b);
    } else {
      return sphereCollisionDetection.sphereVsPoint(a, b);
    }
  } else if (a instanceof Aabb) {
    if (b instanceof Sphere) {
      return aabbCollisionDetection.aabbVsSphere(a, b);
    } else if (b instanceof Aabb) {
      return aabbCollisionDetection.aabbVsAabb(a, b);
    } else if (b instanceof Capsule) {
      return aabbCollisionDetection.aabbVsCapsule(a, b);
    } else if (b instanceof Obb) {
      return aabbCollisionDetection.aabbVsObb(a, b);
    } else {
      return aabbCollisionDetection.aabbVsPoint(a, b);
    }
  } else if (a instanceof Capsule) {
    if (b instanceof Sphere) {
      return capsuleCollisionDetection.capsuleVsSphere(a, b);
    } else if (b instanceof Aabb) {
      return capsuleCollisionDetection.capsuleVsAabb(a, b);
    } else if (b instanceof Capsule) {
      return capsuleCollisionDetection.capsuleVsCapsule(a, b);
    } else if (b instanceof Obb) {
      return capsuleCollisionDetection.capsuleVsObb(a, b);
    } else {
      return capsuleCollisionDetection.capsuleVsPoint(a, b);
    }
  } else if (a instanceof Obb) {
    if (b instanceof Sphere) {
      return obbCollisionDetection.obbVsSphere(a, b);
    } else if (b instanceof Aabb) {
      return obbCollisionDetection.obbVsAabb(a, b);
    } else if (b instanceof Capsule) {
      return obbCollisionDetection.obbVsCapsule(a, b);
    } else if (b instanceof Obb) {
      return obbCollisionDetection.obbVsObb(a, b);
    } else {
      return obbCollisionDetection.obbVsPoint(a, b);
    }
  } else {
    if (b instanceof Sphere) {
      return sphereCollisionDetection.sphereVsPoint(b, a);
    } else if (b instanceof Aabb) {
      return aabbCollisionDetection.aabbVsPoint(b, a);
    } else if (b instanceof Capsule) {
      return capsuleCollisionDetection.capsuleVsPoint(b, a);
    } else if (b instanceof Obb) {
      return obbCollisionDetection.obbVsPoint(b, a);
    } else {
      return false;
    }
  }
}

/**
 * @param {Collision} collision
 */
function calculateContact(collision) {
  const a = collision.collidableA;
  const b = collision.collidableB;
  const contactPoint = vec3.create();
  const contactNormal = vec3.create();

  if (a instanceof Sphere) {
    if (b instanceof Sphere) {
      sphereContactCalculation.sphereVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof Aabb) {
      sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof Capsule) {
      sphereContactCalculation.sphereVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof Obb) {
      sphereContactCalculation.sphereVsObb(contactPoint, contactNormal, a, b);
    } else {
      sphereContactCalculation.sphereVsPoint(contactPoint, contactNormal, a, b);
    }
  } else if (a instanceof Aabb) {
    if (b instanceof Sphere) {
      aabbContactCalculation.aabbVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof Aabb) {
      aabbContactCalculation.aabbVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof Capsule) {
      aabbContactCalculation.aabbVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof Obb) {
      aabbContactCalculation.aabbVsObb(contactPoint, contactNormal, a, b);
    } else {
      aabbContactCalculation.aabbVsPoint(contactPoint, contactNormal, a, b);
    }
  } else if (a instanceof Capsule) {
    if (b instanceof Sphere) {
      capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof Aabb) {
      capsuleContactCalculation.capsuleVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof Capsule) {
      capsuleContactCalculation.capsuleVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof Obb) {
      capsuleContactCalculation.capsuleVsObb(contactPoint, contactNormal, a, b);
    } else {
      capsuleContactCalculation.capsuleVsPoint(contactPoint, contactNormal, a, b);
    }
  } else if (a instanceof Obb) {
    if (b instanceof Sphere) {
      obbContactCalculation.obbVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof Aabb) {
      obbContactCalculation.obbVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof Capsule) {
      obbContactCalculation.obbVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof Obb) {
      obbContactCalculation.obbVsObb(contactPoint, contactNormal, a, b);
    } else {
      obbContactCalculation.obbVsPoint(contactPoint, contactNormal, a, b);
    }
  } else {
    if (b instanceof Sphere) {
      sphereContactCalculation.sphereVsPoint(contactPoint, contactNormal, b, a);
    } else if (b instanceof Aabb) {
      aabbContactCalculation.aabbVsPoint(contactPoint, contactNormal, b, a);
    } else if (b instanceof Capsule) {
      capsuleContactCalculation.capsuleVsPoint(contactPoint, contactNormal, b, a);
    } else if (b instanceof Obb) {
      obbContactCalculation.obbVsPoint(contactPoint, contactNormal, b, a);
    } else {}
    vec3.negate(contactNormal, contactNormal);
  }

  collision.contactPoint = contactPoint;
  collision.contactNormal = contactNormal;
}

/**
 * @param {Collidable} a
 * @param {Collidable} b
 * @returns {boolean}
 */
function detectBoundingVolumeIntersection(a, b) {
  return detectIntersection(a.boundingVolume, b.boundingVolume);
}

export {
  detectIntersection,
  calculateContact,
  detectBoundingVolumeIntersection,
};
