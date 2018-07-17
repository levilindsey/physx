import {createCollidableFromRenderableShape} from './collidable-factories';
import {collidableStore} from './collidable-store';
import {PhysicsJob} from '../../src/physics-job';
import {createForCollidable} from '../../util';

/**
 * A CollidablePhysicsJob extends the standard PhysicsJob with a collidable geometry.
 */
class CollidablePhysicsJob extends PhysicsJob {
  /**
   * @param {CollidableShapeConfig} collidableParams
   * @param {PhysicsState} state
   * @param {Array.<ForceApplier>} forceAppliers
   * @param {Object} controller
   * @param {CollisionHandler} collisionHandler
   */
  constructor(collidableParams, state, forceAppliers, controller, collisionHandler) {
    super(forceAppliers, state);

    collidableParams.scale = collidableParams.scale || vec3.fromValues(1, 1, 1);
    this.collidable = createCollidableFromRenderableShape(collidableParams, this);
    this.currentState.unrotatedInertiaTensor =
        createForCollidable(this.collidable, this.currentState.mass);
    this.currentState.updateDependentFields();
    this.isAtRest = false;
    this.controller = controller;
    this._collisionHandler = collisionHandler;
  }

  /**
   * @param {ForceApplier} forceApplier
   */
  addForceApplier(forceApplier) {
    super.addForceApplier(forceApplier);
    this.isAtRest = false;
  }

  /**
   * @param {ForceApplier} forceApplier
   */
  removeForceApplier(forceApplier) {
    super.removeForceApplier(forceApplier);
    this.isAtRest = false;
  }

  /**
   * This callback is triggered in response to a collision.
   *
   * @param {Collision} collision
   * @returns {boolean} True if this needs the standard collision restitution to proceed.
   */
  handleCollision(collision) {
    return this._collisionHandler(collision);
  }

  /**
   * @param {number} [startTime]
   * @override
   */
  start(startTime) {
    super.start(startTime);
    collidableStore.registerCollidable(this.collidable);
  }

  /**
   * @override
   */
  finish() {
    super.finish();
    collidableStore.unregisterCollidable(this.collidable);
  }

  /** @returns {vec3} */
  get position() {
    return this.currentState.position;
  }

  /** @param {vec3} value */
  set position(value) {
    this.currentState.position = vec3.clone(value);
    this.collidable.position = vec3.clone(value);
  }
}

export {CollidablePhysicsJob};

/**
 * @typedef {Function} CollisionHandler
 * @param {Collision} collision
 * @returns {boolean} True if this needs the standard collision restitution to proceed.
 */
