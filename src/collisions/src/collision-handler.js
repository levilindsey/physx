import {
  areVec3sClose,
  tmpVec1,
  tmpVec2,
  tmpVec3,
  tmpVec4,
} from '../../util';

import {collidableStore} from './collidable-store';
import {detectIntersection, calculateContact} from './collision-utils';

/**
 * This module defines a collision pipeline.
 *
 * These functions will detect collisions between collidable bodies and update their momenta in
 * response to the collisions.
 *
 * - Consists of an efficient broad-phase collision detection step followed by a precise
 *   narrow-phase step.
 * - Calculates the position, surface normal, and time of each contact.
 * - Calculates the impulse of a collision and updates the bodies' linear and angular momenta in
 *   response.
 * - Applies Coulomb friction to colliding bodies.
 * - Sub-divides the time step to more precisely determine when and where a collision occurs.
 * - Supports multiple collisions with a single body in a single time step.
 * - Efficiently supports bodies coming to rest against each other.
 * - Bodies will never penetrate one another.
 * - This does not address the tunnelling problem. That is, it is possible for two fast-moving
 *   bodies to pass through each other as long as they did not intersect each other during any time
 *   step.
 * - This only supports collisions between certain types of shapes. Fortunately, this set provides
 *   reasonable approximations for most other shapes. The supported types of shapes are: spheres,
 *   capsules, AABBs, and OBBs.
 *
 * ## Objects that come to rest
 *
 * An important efficiency improvement is to not process objects through the physics engine pipeline
 * after they have come to rest. The isAtRest field indicates when a body has come to rest.
 *
 * isAtRest is set to true after a physics frame is finished if the collisions, forces, position,
 * and orientation of a job have not changed from the previous to the current state.
 *
 * isAtRest is set to false from two possible events: after a physics frame is finished if the
 * collisions have changed from the previous to the current state, or when a force is added to
 * removed from the job.
 *
 * ## Collision calculations do not consider velocity
 *
 * Collision detection works by waiting until two bodies intersect. However, because time frames are
 * not infinitely small, when an intersection is detected, it's already past the exact instance of
 * collision. To alleviate problems from this, the velocity of each body can be considered when
 * calculating the collision time, position, and contact normal. However, taking velocity into
 * account makes the contact calculations much more complex, so we do not consider velocity in our
 * calculations.
 *
 * A notable consequence of this is that the calculated contact normals can be incorrect. Consider
 * the following moving squares. At time t2 they are found to have collided. The calculated contact
 * point will be somewhere within the intersection of the corners. But the calculated contact normal
 * will point upwards, while the true contact normal should point to the right. This is because the
 * contact calculations do not consider velocity and instead only consider the shallowest direction
 * of overlap.
 *
 * // Time t1
 *                    +------------+
 *                    |            |
 *                    |            |
 *                <-- |      B     |
 *                    |            |
 *  +------------+    |            |
 *  |            |    +------------+
 *  |            |
 *  |      A     | -->
 *  |            |
 *  |            |
 *  +------------+
 *
 * // Time t2
 *         +------------+
 *         |            |
 *         |            |
 *         |      B     |
 *         |            |
 *  +------------+      |
 *  |      +-----|------+
 *  |            |
 *  |      A     |
 *  |            |
 *  |            |
 *  +------------+
 */

/**
 * Detect and handle any collisions between a given job and all other collidable bodies.
 *
 * @param {CollidablePhysicsJob} job
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {PhysicsConfig} physicsParams
 */
function handleCollisionsForJob(job, elapsedTime, physicsParams) {
  const collidable = job.collidable;

  // Clear any previous collision info.
  collidable.previousCollisions = collidable.collisions;
  collidable.collisions = [];

  // Find all colliding collidables.
  const collidingCollidables = findIntersectingCollidablesForCollidable(collidable);

  // Store the time of collision for each collision.
  const collisions = _recordCollisions(collidable, collidingCollidables, elapsedTime);

  // Calculate the points of contact for each collision.
  _calculatePointsOfContact(collisions);

  // Collision resolution.
  _resolveCollisions(collisions, physicsParams);
}

/**
 * Finds all other collidables that intersect with the given collidable.
 *
 * @param {Collidable} collidable
 * @returns {Array.<Collidable>}
 */
function findIntersectingCollidablesForCollidable(collidable) {
  // Broad-phase collision detection (pairs whose bounding volumes intersect).
  const collidingCollidables = collidableStore.getPossibleCollisionsForCollidable(collidable);

  // Narrow-phase collision detection (pairs that actually intersect).
  return _detectPreciseCollisionsFromCollidingCollidables(collidable, collidingCollidables);
}

/**
 * @param {Array.<CollidablePhysicsJob>} jobs
 */
function determineJobsAtRest(jobs) {
  jobs.forEach(job => job.isAtRest = _isJobAtRest(job));
}

function recordOldCollisionsForDevModeForAllCollidables() {
  collidableStore.forEach(_recordOldCollisionsForDevModeForCollidable);
}

/**
 * Logs a warning message for any pair of objects that intersect.
 */
function checkThatNoObjectsCollide() {
  // Broad-phase collision detection (pairs whose bounding volumes intersect).
  let collisions = collidableStore.getPossibleCollisionsForAllCollidables();

  // Narrow-phase collision detection (pairs that actually intersect).
  collisions = _detectPreciseCollisionsFromCollisions(collisions);

  collisions.forEach(collision => {
    console.warn('Objects still intersect after collision resolution', collision);
  });
}

/**
 * Create collision objects that record the time of collision and the collidables in the collision.
 *
 * Also record references to these collisions on the collidables.
 *
 * @param {Collidable} collidable
 * @param {Array.<Collidable>} collidingCollidables
 * @param {DOMHighResTimeStamp} elapsedTime
 * @returns {Array.<Collision>}
 * @private
 */
function _recordCollisions(collidable, collidingCollidables, elapsedTime) {
  return collidingCollidables.map(other => {
    const collision = {
      collidableA: collidable,
      collidableB: other,
      time: elapsedTime
    };

    // Record the fact that these objects collided (the ModelController may want to handle this).
    collision.collidableA.collisions.push(collision);
    collision.collidableB.collisions.push(collision);

    return collision;
  });
}

/**
 * Narrow-phase collision detection.
 *
 * Given a list of possible collision pairs, filter out which pairs are actually colliding.
 *
 * @param {Array.<Collision>} collisions
 * @returns {Array.<Collision>}
 * @private
 */
function _detectPreciseCollisionsFromCollisions(collisions) {
  return collisions.filter(collision => {
    // TODO:
    // - Use temporal bisection with discrete sub-time steps to find time of collision (use
    //       x-vs-y-specific intersection detection methods).
    // - Make sure the collision object is set up with the "previousState" from the sub-step
    //   before collision and the time from the sub-step after collision (determined from the
    //   previous temporal bisection search...)

    return detectIntersection(collision.collidableA, collision.collidableB);
  });
}

/**
 * Narrow-phase collision detection.
 *
 * Given a list of possible collision pairs, filter out which pairs are actually colliding.
 *
 * @param {Collidable} collidable
 * @param {Array.<Collidable>} collidingCollidables
 * @returns {Array.<Collidable>}
 * @private
 */
function _detectPreciseCollisionsFromCollidingCollidables(collidable, collidingCollidables) {
  return collidingCollidables.filter(other => {
    // TODO:
    // - Use temporal bisection with discrete sub-time steps to find time of collision (use
    //       x-vs-y-specific intersection detection methods).
    // - Make sure the collision object is set up with the "previousState" from the sub-step
    //   before collision and the time from the sub-step after collision (determined from the
    //   previous temporal bisection search...)

    return detectIntersection(collidable, other);
  });
}

/**
 * Calculate the intersection position and contact normal of each collision.
 *
 * @param {Array.<Collision>} collisions
 * @private
 */
function _calculatePointsOfContact(collisions) {
  collisions.forEach(calculateContact);
}

/**
 * Updates the linear and angular momenta of each body in response to its collision.
 *
 * @param {Array.<Collision>} collisions
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _resolveCollisions(collisions, physicsParams) {
  collisions.forEach(collision => {
    // If neither physics job needs the standard collision restitution, then don't do it.
    if (_notifyPhysicsJobsOfCollision(collision)) {
      if (collision.collidableA.physicsJob && collision.collidableB.physicsJob) {
        // Neither of the collidables is stationary.
        _resolveCollision(collision, physicsParams);
      } else {
        // One of the two collidables is stationary.
        _resolveCollisionWithStationaryObject(collision, physicsParams);
      }
    }
  });
}

/**
 * @param {Collision} collision
 * @returns {boolean} True if one of the PhysicsJobs need the standard collision restitution to
 * proceed.
 * @private
 */
function _notifyPhysicsJobsOfCollision(collision) {
  return collision.collidableA.physicsJob.handleCollision(collision) ||
      collision.collidableB.physicsJob.handleCollision(collision)
}

/**
 * Resolve a collision between two moving, physics-based objects.
 *
 * This is based on collision-response algorithms from Wikipedia
 * (https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model).
 *
 * @param {Collision} collision
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _resolveCollision(collision, physicsParams) {
  const collidableA = collision.collidableA;
  const collidableB = collision.collidableB;
  const previousStateA = collidableA.physicsJob.previousState;
  const previousStateB = collidableB.physicsJob.previousState;
  const nextStateA = collidableA.physicsJob.currentState;
  const nextStateB = collidableB.physicsJob.currentState;
  const centerA = collidableA.centerOfMass;
  const centerB = collidableB.centerOfMass;
  const contactPoint = collision.contactPoint;

  const contactPointOffsetA = tmpVec3;
  vec3.subtract(contactPointOffsetA, contactPoint, centerA);
  const contactPointOffsetB = tmpVec4;
  vec3.subtract(contactPointOffsetB, contactPoint, centerB);

  //
  // Calculate the relative velocity of the bodies at the point of contact.
  //
  // We use the velocity from the previous state, since it is the velocity that led to the
  // collision.
  //

  const velocityA = tmpVec1;
  vec3.cross(tmpVec1, previousStateA.angularVelocity, contactPointOffsetA);
  vec3.add(velocityA, previousStateA.velocity, tmpVec1);

  const velocityB = tmpVec2;
  vec3.cross(tmpVec2, previousStateB.angularVelocity, contactPointOffsetB);
  vec3.add(velocityB, previousStateB.velocity, tmpVec2);

  const relativeVelocity = vec3.create();
  vec3.subtract(relativeVelocity, velocityB, velocityA);

  if (vec3.dot(relativeVelocity, collision.contactNormal) >= 0) {
    // If the relative velocity is not pointing against the normal, then the normal was calculated
    // incorrectly (this is likely due to the time step being too large and the fact that our
    // contact calculations don't consider velocity). So update the contact normal to be in the
    // direction of the relative velocity.

    // TODO: Check that this works as expected.

    // console.warn('Non-collision because objects are moving away from each other.');

    vec3.copy(collision.contactNormal, relativeVelocity);
    vec3.normalize(collision.contactNormal, collision.contactNormal);
    vec3.negate(collision.contactNormal, collision.contactNormal);
  }

  _applyImpulseFromCollision(collision, relativeVelocity, contactPointOffsetA,
      contactPointOffsetB, physicsParams);

  // NOTE: This state reversion is only applied to collidableA. This assumes that only A is moving
  // during this iteration of the collision pipeline.

  // Revert to the position and orientation from immediately before the collision.
  vec3.copy(nextStateA.position, previousStateA.position);
  quat.copy(nextStateA.orientation, previousStateA.orientation);

  // Also revert the collidables' position and orientation.
  collidableA.position = previousStateA.position;
  collidableA.orientation = previousStateA.orientation;

  nextStateA.updateDependentFields();
  nextStateB.updateDependentFields();
}

/**
 * Resolve a collision between one moving, physics-based object and one stationary object.
 *
 * @param {Collision} collision
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _resolveCollisionWithStationaryObject(collision, physicsParams) {
  const contactNormal = collision.contactNormal;

  let physicsCollidable;
  if (collision.collidableA.physicsJob) {
    physicsCollidable = collision.collidableA;
  } else {
    physicsCollidable = collision.collidableB;
    vec3.negate(contactNormal, contactNormal);
  }

  const previousState = physicsCollidable.physicsJob.previousState;
  const nextState = physicsCollidable.physicsJob.currentState;
  const center = physicsCollidable.centerOfMass;
  const contactPoint = collision.contactPoint;

  const contactPointOffset = tmpVec3;
  vec3.subtract(contactPointOffset, contactPoint, center);

  // Calculate the relative velocity of the bodies at the point of contact. We use the velocity from
  // the previous state, since it is the velocity that led to the collision.
  const velocity = vec3.create();
  vec3.cross(tmpVec1, previousState.angularVelocity, contactPointOffset);
  vec3.add(velocity, previousState.velocity, tmpVec1);

  if (vec3.dot(velocity, contactNormal) <= 0) {
    // If the relative velocity is not pointing against the normal, then the normal was calculated
    // incorrectly (this is likely due to the time step being too large and the fact that our
    // contact calculations don't consider velocity). So update the contact normal to be in the
    // direction of the relative velocity.

    // TODO: Check that this works as expected.

    console.warn('Non-collision because object is moving away from stationary object.');

    vec3.copy(collision.contactNormal, velocity);
    vec3.normalize(collision.contactNormal, collision.contactNormal);
    vec3.negate(collision.contactNormal, collision.contactNormal);
  }

  _applyImpulseFromCollisionWithStationaryObject(physicsCollidable, collision, velocity,
      contactPointOffset, physicsParams);

  // Revert to the position and orientation from immediately before the collision.
  vec3.copy(nextState.position, previousState.position);
  quat.copy(nextState.orientation, previousState.orientation);

  // Also revert the collidable's position and orientation.
  physicsCollidable.position = previousState.position;
  physicsCollidable.orientation = previousState.orientation;

  nextState.updateDependentFields();
}

/**
 * This is based on collision-response algorithms from Wikipedia
 * (https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model). This algorithm
 * has been simplified by assuming the stationary body has infinite mass and zero velocity.
 *
 * @param {Collision} collision
 * @param {vec3} relativeVelocity
 * @param {vec3} contactPointOffsetA
 * @param {vec3} contactPointOffsetB
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _applyImpulseFromCollision(collision, relativeVelocity, contactPointOffsetA,
                                    contactPointOffsetB, physicsParams) {
  const collidableA = collision.collidableA;
  const collidableB = collision.collidableB;

  const stateA = collidableA.physicsJob.currentState;
  const stateB = collidableB.physicsJob.currentState;

  const contactNormal = collision.contactNormal;

  //
  // Calculate and apply the main collision impulse.
  //

  vec3.scale(tmpVec1, relativeVelocity, -(1 + physicsParams.coefficientOfRestitution));
  const numerator = vec3.dot(tmpVec1, contactNormal);

  vec3.cross(tmpVec1, contactPointOffsetA, contactNormal);
  vec3.transformMat3(tmpVec1, tmpVec1, stateA.inverseInertiaTensor);
  vec3.cross(tmpVec1, tmpVec1, contactPointOffsetA);

  vec3.cross(tmpVec2, contactPointOffsetB, contactNormal);
  vec3.transformMat3(tmpVec2, tmpVec2, stateB.inverseInertiaTensor);
  vec3.cross(tmpVec2, tmpVec2, contactPointOffsetB);

  vec3.add(tmpVec1, tmpVec1, tmpVec2);
  const denominator = vec3.dot(tmpVec1, contactNormal) + stateA.inverseMass + stateB.inverseMass;

  const impulseMagnitude = numerator / denominator;

  _applyImpulse(stateA, -impulseMagnitude, contactNormal, contactPointOffsetA);
  _applyImpulse(stateB, impulseMagnitude, contactNormal, contactPointOffsetB);

  //
  // Calculate and apply a dynamic friction impulse.
  //

  const frictionImpulseMagnitude = impulseMagnitude * physicsParams.coefficientOfFriction;

  const tangent = tmpVec2;
  vec3.scale(tmpVec1, contactNormal, vec3.dot(relativeVelocity, contactNormal));
  vec3.subtract(tangent, relativeVelocity, tmpVec1);
  vec3.normalize(tangent, tangent);

  _applyImpulse(stateA, frictionImpulseMagnitude, tangent, contactPointOffsetA);
  _applyImpulse(stateB, -frictionImpulseMagnitude, tangent, contactPointOffsetB);
}

/**
 * This is based on collision-response algorithms from Wikipedia
 * (https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model). This algorithm
 * has been simplified by assuming the stationary body has infinite mass and zero velocity.
 *
 * @param {Collidable} physicsCollidable
 * @param {Collision} collision
 * @param {vec3} velocity
 * @param {vec3} contactPointOffset
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _applyImpulseFromCollisionWithStationaryObject(physicsCollidable, collision, velocity,
                                                        contactPointOffset, physicsParams) {
  const state = physicsCollidable.physicsJob.currentState;
  const contactNormal = collision.contactNormal;

  //
  // Calculate and apply the main collision impulse.
  //

  vec3.scale(tmpVec1, velocity, -(1 + physicsParams.coefficientOfRestitution));
  const numerator = vec3.dot(tmpVec1, contactNormal);

  vec3.cross(tmpVec1, contactPointOffset, contactNormal);
  vec3.transformMat3(tmpVec1, tmpVec1, state.inverseInertiaTensor);
  vec3.cross(tmpVec1, tmpVec1, contactPointOffset);
  const denominator = vec3.dot(tmpVec1, contactNormal) + state.inverseMass;

  const impulseMagnitude = numerator / denominator;

  _applyImpulse(state, impulseMagnitude, contactNormal, contactPointOffset);

  //
  // Calculate and apply a dynamic friction impulse.
  //

  const frictionImpulseMagnitude = impulseMagnitude * physicsParams.coefficientOfFriction;

  const tangent = tmpVec2;
  vec3.scale(tmpVec1, contactNormal, vec3.dot(velocity, contactNormal));
  vec3.subtract(tangent, velocity, tmpVec1);
  vec3.normalize(tangent, tangent);

  _applyImpulse(state, frictionImpulseMagnitude, tangent, contactPointOffset);
}

/**
 * @param {PhysicsState} state
 * @param {number} impulseMagnitude
 * @param {vec3} impulseDirection
 * @param {vec3} contactPointOffset
 * @private
 */
function _applyImpulse(state, impulseMagnitude, impulseDirection, contactPointOffset) {
  // Calculate the updated linear momenta.
  const finalLinearMomentum = vec3.create();
  vec3.scaleAndAdd(finalLinearMomentum, state.momentum, impulseDirection, impulseMagnitude);

  // Calculate the updated angular momenta.
  const finalAngularMomentum = vec3.create();
  vec3.cross(tmpVec1, contactPointOffset, impulseDirection);
  vec3.scaleAndAdd(finalAngularMomentum, state.angularMomentum, tmpVec1, impulseMagnitude);

  // Apply the updated momenta.
  vec3.copy(state.momentum, finalLinearMomentum);
  vec3.copy(state.angularMomentum, finalAngularMomentum);
}

/**
 * @param {CollidablePhysicsJob} job
 * @returns {boolean}
 * @private
 */
function _isJobAtRest(job) {
  return areVec3sClose(job.currentState.position, job.previousState.position) &&
      areVec3sClose(job.currentState.velocity, job.previousState.velocity) &&
      areVec3sClose(job.currentState.orientation, job.previousState.orientation) &&
      _doCollisionsMatch(job.collidable.collisions, job.collidable.previousCollisions);
}

/**
 * @param {Array.<Collision>} collisionsA
 * @param {Array.<Collision>} collisionsB
 * @returns {boolean}
 * @private
 */
function _doCollisionsMatch(collisionsA, collisionsB) {
  const count = collisionsA.length;

  if (count !== collisionsB.length) return false;

  for (let i = 0; i < count; i++) {
    const collisionA = collisionsA[i];
    const collisionB = collisionsB[i];
    if (collisionA.collidableA !== collisionB.collidableA ||
        collisionA.collidableB !== collisionB.collidableB ||
        !areVec3sClose(collisionA.contactPoint, collisionB.contactPoint) ||
        !areVec3sClose(collisionA.contactNormal, collisionB.contactNormal)) {
      return false
    }
  }

  return true;
}

/**
 * @param {Collidable} collidable
 * @private
 */
function _recordOldCollisionsForDevModeForCollidable(collidable) {
  if (!collidable.extraPreviousCollisions) {
    collidable.extraPreviousCollisions = [];
  }

  for (let i = 3; i > 0; i--) {
    collidable.extraPreviousCollisions[i] = collidable.extraPreviousCollisions[i - 1];
  }
  collidable.extraPreviousCollisions[0] = collidable.previousCollisions;
}

/**
 * @param {Collision} collision
 * @param {Object} thisController
 * @returns {Object}
 */
function getOtherControllerFromCollision(collision, thisController) {
  const controllerA = collision.collidableA.physicsJob.controller;
  const controllerB = collision.collidableB.physicsJob.controller;
  if (controllerA === thisController) {
    return controllerB;
  } else if (controllerB === thisController) {
    return controllerA;
  } else {
    throw new Error('Neither collidable corresponds to the given controller');
  }
}

export {
  handleCollisionsForJob,
  findIntersectingCollidablesForCollidable,
  determineJobsAtRest,
  recordOldCollisionsForDevModeForAllCollidables,
  checkThatNoObjectsCollide,
  getOtherControllerFromCollision,
};
