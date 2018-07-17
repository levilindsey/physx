/**
 * This module defines a set of factory functions for creating Collidable instances.
 */

import {
  Capsule,
  Obb,
  Sphere
} from '../collidables';
import {_geometry} from '../../util';

/**
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createCollidableFromRenderableShape(params, physicsJob) {
  return _collidableCreators[params.collidableShapeId](params, physicsJob);
}

/**
 * This assumes the base RenderableShape has a side length of one unit.
 *
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createObbFromRenderableShape(params, physicsJob) {
  const halfRangeX = params.scale[0] / 2;
  const halfRangeY = params.scale[1] / 2;
  const halfRangeZ = params.scale[2] / 2;
  return new Obb(halfRangeX, halfRangeY, halfRangeZ, params.isStationary, physicsJob);
}

/**
 * This assumes the base RenderableShape has a "radius" of one unit.
 *
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createSphereFromRenderableShape(params, physicsJob) {
  const radius = params.radius || vec3.length(params.scale) / Math.sqrt(3);
  return new Sphere(0, 0, 0, radius, params.isStationary, physicsJob);
}

/**
 * The radius of the created capsule will be an average from the two shortest sides.
 *
 * There are two modes: either we use scale, or we use radius and capsuleEndPointsDistance.
 *
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createCapsuleFromRenderableShape(params, physicsJob) {
  const scale = params.scale;
  const capsuleEndPointsDistance = params.capsuleEndPointsDistance;
  const isStationary = params.isStationary;
  let radius = params.radius;

  let halfDistance;

  // There are two modes: either we use scale, or we use radius and capsuleEndPointsDistance.
  if (typeof radius === 'number' && typeof capsuleEndPointsDistance === 'number') {
    halfDistance = capsuleEndPointsDistance / 2;
  } else {
    const copy = vec3.clone(scale);
    copy.sort();

    const length = copy[2];
    radius = (copy[0] + copy[1]) / 2;
    halfDistance = length / 2 - radius;
  }

  const orientation = quat.create();
  if (scale[0] > scale[1]) {
    if (scale[0] > scale[2]) {
      vec3.rotateY(orientation, orientation, _geometry.HALF_PI);
    } else {
      // Do nothing; the capsule defaults to being aligned with the z-axis.
    }
  } else {
    if (scale[1] > scale[2]) {
      vec3.rotateX(orientation, orientation, -_geometry.HALF_PI);
    } else {
      // Do nothing; the capsule defaults to being aligned with the z-axis.
    }
  }

  const capsule = new Capsule(halfDistance, radius, isStationary, physicsJob);
  capsule.orientation = orientation;

  return capsule;
}

/**
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createSphereOrCapsuleFromRenderableShape(params, physicsJob) {
  const scale = params.scale;
  const radius = params.radius;
  const capsuleEndPointsDistance = params.capsuleEndPointsDistance;

  const halfLengthX = scale[0] * radius;
  const halfLengthY = scale[1] * radius;
  const halfLengthZ = scale[2] * (radius + capsuleEndPointsDistance) / 2;

  const minLength = Math.min(Math.min(halfLengthX, halfLengthY), halfLengthZ);
  const maxLength = Math.max(Math.max(halfLengthX, halfLengthY), halfLengthZ);

  if (maxLength / minLength >= _SPHERE_VS_CAPSULE_ASPECT_RATIO_THRESHOLD) {
    return createCapsuleFromRenderableShape(params, physicsJob);
  } else {
    return createSphereFromRenderableShape(params, physicsJob);
  }
}

const _SPHERE_VS_CAPSULE_ASPECT_RATIO_THRESHOLD = 2;

const _collidableCreators = {
  'CUBE': createObbFromRenderableShape,
  'SPHERE_OR_CAPSULE': createSphereOrCapsuleFromRenderableShape,
  'SPHERE': createSphereFromRenderableShape,
  'CAPSULE': createCapsuleFromRenderableShape,
};

export {
  createCapsuleFromRenderableShape,
  createCollidableFromRenderableShape,
  createObbFromRenderableShape,
  createSphereFromRenderableShape,
  createSphereOrCapsuleFromRenderableShape,
};

/**
 * @typedef {Object} CollidableShapeConfig
 * @property {string} collidableShapeId The ID of the type of collidable shape.
 * @property {vec3} [scale]
 * @property {boolean} [isStationary=false] Whether the collidable is fixed in place.
 */

/**
 * @typedef {CollidableShapeConfig} SphericalCollidableShapeParams
 * @property {number} radius
 */

/**
 * @typedef {SphericalCollidableShapeParams} CapsuleCollidableShapeParams
 * @property {number} capsuleEndPointsDistance The distance between the centers of the spheres on either end
 * of the capsule.
 */
