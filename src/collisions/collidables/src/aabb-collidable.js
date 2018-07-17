import {Collidable} from './collidable';
import {LineSegment} from './line-segment';
import {tmpVec1, tmpVec2} from '../../../util';

/**
 * This class represents an axially-aligned bounding box (AABB).
 *
 * This is primarily useful for collision detection. An AABB is only appropriate for some
 * geometries. For other geometries, an oriented bounding box (OBB) or a bounding sphere may be more
 * appropriate.
 */
class Aabb extends Collidable {
  /**
   * @param {number} minX
   * @param {number} minY
   * @param {number} minZ
   * @param {number} maxX
   * @param {number} maxY
   * @param {number} maxZ
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  constructor(minX, minY, minZ, maxX, maxY, maxZ, isStationary = false, physicsJob) {
    super(isStationary, physicsJob);
    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;
  }

  /**
   * Creates a new bounding box with the dimensions of an axially-aligned cube centered around the 
   * given center and with the given half-side length.
   *
   * @param {vec3} center
   * @param {number} halfSideLength
   */
  static createAsUniformAroundCenter(center, halfSideLength) {
    const bounds = new Aabb(0, 0, 0, 0, 0, 0);
    bounds.setAsUniformAroundCenter(center, halfSideLength);
    return bounds;
  }

  /**
   * Updates the dimensions of this bounding box to represent an axially-aligned cube centered
   * around the given center and with the given half-side length.
   *
   * @param {vec3} center
   * @param {number} halfSideLength
   */
  setAsUniformAroundCenter(center, halfSideLength) {
    this.minX = center[0] - halfSideLength;
    this.minY = center[1] - halfSideLength;
    this.minZ = center[2] - halfSideLength;
    this.maxX = center[0] + halfSideLength;
    this.maxY = center[1] + halfSideLength;
    this.maxZ = center[2] + halfSideLength;
  }

  /** @returns {number} */
  get rangeX() {
    return this.maxX - this.minX;
  }
  /** @returns {number} */
  get rangeY() {
    return this.maxY - this.minY;
  }
  /** @returns {number} */
  get rangeZ() {
    return this.maxZ - this.minZ;
  }

  /** @returns {number} */
  get centerX() {
    return this.minX + this.rangeX / 2;
  }
  /** @returns {number} */
  get centerY() {
    return this.minY + this.rangeY / 2;
  }
  /** @returns {number} */
  get centerZ() {
    return this.minZ + this.rangeZ / 2;
  }

  /** @returns {number} */
  get surfaceArea() {
    const rangeX = this.rangeX;
    const rangeY = this.rangeY;
    const rangeZ = this.rangeZ;
    return 2 * (rangeX * rangeY + rangeX * rangeZ + rangeY * rangeZ);
  }

  /**
   * @returns {vec3}
   * @override
   */
  get centerOfVolume() {
    // Reuse the same object when this is called multiple times.
    this._centerOfVolume = this._centerOfVolume || vec3.create();
    vec3.set(this._centerOfVolume, this.centerX, this.centerY, this.centerZ);
    return this._centerOfVolume;
  }

  /**
   * @returns {Collidable}
   * @override
   */
  get boundingVolume() {
    return this;
  }

  /**
   * @param {vec3} value
   * @override
   */
  set position(value) {
    const rangeX = this.rangeX;
    const rangeY = this.rangeY;
    const rangeZ = this.rangeZ;
    this.minX = value[0] - rangeX / 2;
    this.minY = value[1] - rangeY / 2;
    this.minZ = value[2] - rangeZ / 2;
    this.maxX = value[0] + rangeX / 2;
    this.maxY = value[1] + rangeY / 2;
    this.maxZ = value[2] + rangeZ / 2;
  }

  /**
   * @param {quat} value
   * @override
   */
  set orientation(value) {
    // Do nothing.
  }

  /**
   * Calls the given callback once for each vertex.
   *
   * Stops as soon as the callback returns true for a vertex.
   *
   * @param {VertexCallback} callback
   * @param {vec3} [vertex] Output param.
   * @returns {boolean} True if one of the callbacks returned true.
   */
  someVertex(callback, vertex) {
    vertex = vertex || tmpVec1;

    vec3.set(vertex, this.minX, this.minY, this.minZ);
    if (callback(vertex)) return true;

    vec3.set(vertex, this.maxX, this.minY, this.minZ);
    if (callback(vertex)) return true;

    vec3.set(vertex, this.minX, this.maxY, this.minZ);
    if (callback(vertex)) return true;

    vec3.set(vertex, this.maxX, this.maxY, this.minZ);
    if (callback(vertex)) return true;

    vec3.set(vertex, this.minX, this.minY, this.maxZ);
    if (callback(vertex)) return true;

    vec3.set(vertex, this.maxX, this.minY, this.maxZ);
    if (callback(vertex)) return true;

    vec3.set(vertex, this.minX, this.maxY, this.maxZ);
    if (callback(vertex)) return true;

    vec3.set(vertex, this.maxX, this.maxY, this.maxZ);
    if (callback(vertex)) return true;

    return false;
  }

  /**
   * Calls the given callback once for each edge.
   *
   * @param {EdgeCallback} callback
   * @param {LineSegment} [edge] Output param.
   * @returns {boolean} True if one of the callbacks returned true.
   */
  someEdge(callback, edge) {
    edge = edge || _segment;

    //
    // Edges along front face.
    //

    vec3.set(tmpVec1, this.minX, this.minY, this.minZ);
    vec3.set(tmpVec2, this.maxX, this.minY, this.minZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.minX, this.maxY, this.minZ);
    vec3.set(tmpVec2, this.maxX, this.maxY, this.minZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.minX, this.minY, this.minZ);
    vec3.set(tmpVec2, this.minX, this.maxY, this.minZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.maxX, this.minY, this.minZ);
    vec3.set(tmpVec2, this.maxX, this.maxY, this.minZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    //
    // Edges along back face.
    //

    vec3.set(tmpVec1, this.minX, this.minY, this.maxZ);
    vec3.set(tmpVec2, this.maxX, this.minY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.minX, this.maxY, this.maxZ);
    vec3.set(tmpVec2, this.maxX, this.maxY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.minX, this.minY, this.maxZ);
    vec3.set(tmpVec2, this.minX, this.maxY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.maxX, this.minY, this.maxZ);
    vec3.set(tmpVec2, this.maxX, this.maxY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    //
    // Edges between front and back faces.
    //

    vec3.set(tmpVec1, this.minX, this.minY, this.minZ);
    vec3.set(tmpVec2, this.minX, this.minY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.maxX, this.minY, this.minZ);
    vec3.set(tmpVec2, this.maxX, this.minY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.minX, this.maxY, this.minZ);
    vec3.set(tmpVec2, this.minX, this.maxY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    vec3.set(tmpVec1, this.maxX, this.maxY, this.minZ);
    vec3.set(tmpVec2, this.maxX, this.maxY, this.maxZ);
    edge.reset(tmpVec1, tmpVec2);
    if (callback(edge)) return true;

    return false;
  }
}

const _segment = new LineSegment(vec3.create(), vec3.create());

export {Aabb};
