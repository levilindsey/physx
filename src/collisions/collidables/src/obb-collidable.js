import {Collidable} from './collidable';
import {Sphere} from './sphere-collidable';
import {LineSegment} from './line-segment';

/**
 * This class represents an oriented bounding box (OBB).
 *
 * This is useful both for collision detection and for representing any rotated rectangular cuboid.
 * An OBB is only appropriate for some geometries. For other geometries, an axially-aligned bounding
 * box (AABB) or a bounding sphere may be more appropriate.
 */
class Obb extends Collidable {
  /**
   * Defaults to being centered at the origin with its local axes aligned with the world axes.
   *
   * @param {number} halfSideLengthX
   * @param {number} halfSideLengthY
   * @param {number} halfSideLengthZ
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  constructor(halfSideLengthX, halfSideLengthY, halfSideLengthZ, isStationary = false, physicsJob) {
    super(isStationary, physicsJob);
    this.extents = [
      vec3.fromValues(halfSideLengthX, 0, 0),
      vec3.fromValues(0, halfSideLengthY, 0),
      vec3.fromValues(0, 0, halfSideLengthZ)
    ];
    this.axes = [
      vec3.fromValues(1, 0, 0),
      vec3.fromValues(0, 1, 0),
      vec3.fromValues(0, 0, 1)
    ];
    this.halfSideLengths = [
      halfSideLengthX,
      halfSideLengthY,
      halfSideLengthZ
    ];
    this._center = vec3.create();
    this._orientation = quat.create();
  }

  /**
   * @returns {vec3}
   * @override
   */
  get centerOfVolume() {
    return this._center;
  }

  /**
   * @returns {Collidable}
   * @override
   */
  get boundingVolume() {
    // Reuse the same value when this is called multiple times.
    if (!this._boundingSphere) {
      const radius = Math.sqrt(this.halfSideLengthX * this.halfSideLengthX +
          this.halfSideLengthY * this.halfSideLengthY +
          this.halfSideLengthZ * this.halfSideLengthZ);
      this._boundingSphere = new Sphere(0, 0, 0, radius, this.isStationary);
    }
    this._boundingSphere.position = this._center;
    return this._boundingSphere;
  }

  /**
   * @param {vec3} value
   * @override
   */
  set position(value) {
    vec3.copy(this._center, value);
  }

  /**
   * @param {quat} value
   * @override
   */
  set orientation(value) {
    quat.copy(this._orientation, value);
    this._updateExtents();
  }
  /** @returns {quat} */
  get orientation() {
    return this._orientation;
  }

  /** @returns {number} */
  get halfSideLengthX() {
    return this.halfSideLengths[0];
  }
  /** @param {number} value */
  set halfSideLengthX(value) {
    this.halfSideLengths[0] = value;
    this._updateExtents();
  }

  /** @returns {number} */
  get halfSideLengthY() {
    return this.halfSideLengths[1];
  }
  /** @param {number} value */
  set halfSideLengthY(value) {
    this.halfSideLengths[1] = value;
    this._updateExtents();
  }

  /** @returns {number} */
  get halfSideLengthZ() {
    return this.halfSideLengths[2];
  }
  /** @param {number} value */
  set halfSideLengthZ(value) {
    this.halfSideLengths[2] = value;
    this._updateExtents();
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
    vertex = vertex || _vertex1;

    for (let xScale = -1; xScale <= 1; xScale += 2) {
      for (let yScale = -1; yScale <= 1; yScale += 2) {
        for (let zScale = -1; zScale <= 1; zScale += 2) {
          vec3.copy(vertex, this._center);
          vec3.scaleAndAdd(vertex, vertex, this.extents[0], xScale);
          vec3.scaleAndAdd(vertex, vertex, this.extents[1], yScale);
          vec3.scaleAndAdd(vertex, vertex, this.extents[2], zScale);
          if (callback(vertex)) {
            return true;
          }
        }
      }
    }
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

    return _edgeExtentScales.some(edgeExtentScalePair => {
      const vertex1ExtentScales = edgeExtentScalePair[0];
      const vertex2ExtentScales = edgeExtentScalePair[1];

      // Calculate the edge's first and second vertex.
      vec3.copy(_vertex1, this._center);
      vec3.copy(_vertex2, this._center);
      for (let i = 0; i < 3; i++) {
        vec3.scaleAndAdd(_vertex1, _vertex1, this.extents[i], vertex1ExtentScales[i]);
        vec3.scaleAndAdd(_vertex2, _vertex2, this.extents[i], vertex2ExtentScales[i]);
      }

      // Call back with the edge.
      edge.reset(_vertex1, _vertex2);
      return callback(edge);
    });
  }

  /**
   * Calls the given callback once for each face.
   *
   * @param {FaceCallback} callback
   * @param {Array.<vec3>} [face] Output param.
   * @returns {boolean} True if one of the callbacks returned true.
   */
  someFace(callback, face) {
    face = face || [];

    return _faceExtentScales.some(faceExtentScales => {
      const vertex1ExtentScales = faceExtentScales[0];
      const vertex2ExtentScales = faceExtentScales[1];
      const vertex3ExtentScales = faceExtentScales[2];
      const vertex4ExtentScales = faceExtentScales[3];

      // Calculate the face's vertices.
      vec3.copy(_vertex1, this._center);
      vec3.copy(_vertex2, this._center);
      vec3.copy(_vertex3, this._center);
      vec3.copy(_vertex4, this._center);
      for (let i = 0; i < 3; i++) {
        vec3.scaleAndAdd(_vertex1, _vertex1, this.extents[i], vertex1ExtentScales[i]);
        vec3.scaleAndAdd(_vertex2, _vertex2, this.extents[i], vertex2ExtentScales[i]);
        vec3.scaleAndAdd(_vertex3, _vertex3, this.extents[i], vertex3ExtentScales[i]);
        vec3.scaleAndAdd(_vertex4, _vertex4, this.extents[i], vertex4ExtentScales[i]);
      }

      // Call back with the face.
      face.splice(0, 4, _vertex1, _vertex2, _vertex3, _vertex4);
      return callback(face);
    });
  }

  /**
   * Calls the given callback once for each face with a given additional offset from the center
   * applied to each face.
   *
   * @param {FaceCallback} callback
   * @param {number} radiusOffset
   * @param {Array.<vec3>} [face] Output param.
   * @returns {boolean} True if one of the callbacks returned true.
   */
  somePushedOutFace(callback, radiusOffset, face) {
    face = face || [];

    return _faceExtentScales.some((faceExtentScales, index) => {
      const vertex1ExtentScales = faceExtentScales[0];
      const vertex2ExtentScales = faceExtentScales[1];
      const vertex3ExtentScales = faceExtentScales[2];
      const vertex4ExtentScales = faceExtentScales[3];
      const directionOffsets = _pushedOutFaceOffsetDirections[index];

      // Calculate the face's vertices.
      vec3.copy(_vertex1, this._center);
      vec3.copy(_vertex2, this._center);
      vec3.copy(_vertex3, this._center);
      vec3.copy(_vertex4, this._center);
      for (let i = 0; i < 3; i++) {
        // Add the offset for the normal vertex position.
        vec3.scaleAndAdd(_vertex1, _vertex1, this.extents[i], vertex1ExtentScales[i]);
        vec3.scaleAndAdd(_vertex2, _vertex2, this.extents[i], vertex2ExtentScales[i]);
        vec3.scaleAndAdd(_vertex3, _vertex3, this.extents[i], vertex3ExtentScales[i]);
        vec3.scaleAndAdd(_vertex4, _vertex4, this.extents[i], vertex4ExtentScales[i]);
        // Add the pushed-out offset.
        vec3.scaleAndAdd(_vertex1, _vertex1, this.extents[i],
            radiusOffset / this.halfSideLengths[i] * directionOffsets[i]);
        vec3.scaleAndAdd(_vertex2, _vertex2, this.extents[i],
            radiusOffset / this.halfSideLengths[i] * directionOffsets[i]);
        vec3.scaleAndAdd(_vertex3, _vertex3, this.extents[i],
            radiusOffset / this.halfSideLengths[i] * directionOffsets[i]);
        vec3.scaleAndAdd(_vertex4, _vertex4, this.extents[i],
            radiusOffset / this.halfSideLengths[i] * directionOffsets[i]);
      }

      // Call back with the face.
      face.splice(0, 4, _vertex1, _vertex2, _vertex3, _vertex4);
      return callback(face);
    });
  }

  _updateExtents() {
    vec3.set(_vertex1, this.halfSideLengths[0], 0, 0);
    vec3.transformQuat(this.extents[0], _vertex1, this._orientation);
    vec3.set(_vertex1, 0, this.halfSideLengths[1], 0);
    vec3.transformQuat(this.extents[1], _vertex1, this._orientation);
    vec3.set(_vertex1, 0, 0, this.halfSideLengths[2]);
    vec3.transformQuat(this.extents[2], _vertex1, this._orientation);

    vec3.set(_vertex1, 1, 0, 0);
    vec3.transformQuat(this.axes[0], _vertex1, this._orientation);
    vec3.set(_vertex1, 0, 1, 0);
    vec3.transformQuat(this.axes[1], _vertex1, this._orientation);
    vec3.set(_vertex1, 0, 0, 1);
    vec3.transformQuat(this.axes[2], _vertex1, this._orientation);
  }
}

const _vertex1 = vec3.create();
const _vertex2 = vec3.create();
const _vertex3 = vec3.create();
const _vertex4 = vec3.create();
const _segment = new LineSegment(vec3.create(), vec3.create());

const _edgeExtentScales = [
  // Front-face edges.
  [[1, -1, -1], [1, -1, 1]],
  [[1, -1, -1], [1, 1, -1]],
  [[1, 1, 1], [1, -1, 1]],
  [[1, 1, 1], [1, 1, -1]],
  // Back-face edges.
  [[-1, -1, -1], [-1, -1, 1]],
  [[-1, -1, -1], [-1, 1, -1]],
  [[-1, 1, 1], [-1, -1, 1]],
  [[-1, 1, 1], [-1, 1, -1]],
  // Front-to-back edges.
  [[1, -1, 1], [-1, -1, 1]],
  [[1, 1, -1], [-1, 1, -1]],
  [[1, 1, 1], [-1, 1, 1]],
  [[1, -1, -1], [-1, -1, -1]],
];

const _faceExtentScales = [
  [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]],
  [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
  [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
  [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
  [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
  [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]],
];

const _pushedOutFaceOffsetDirections = [
  vec3.fromValues(1, 0, 0),
  vec3.fromValues(-1, 0, 0),
  vec3.fromValues(0, 1, 0),
  vec3.fromValues(0, -1, 0),
  vec3.fromValues(0, 0, 1),
  vec3.fromValues(0, 0, -1),
];

export {Obb};

/**
 * @callback VertexCallback
 * @param {vec3}
 * @returns {boolean} If true, iteration will stop.
 */

/**
 * @callback EdgeCallback
 * @param {LineSegment}
 * @returns {boolean} If true, iteration will stop.
 */

/**
 * @callback FaceCallback
 * @param {Array.<vec3>}
 * @returns {boolean} If true, iteration will stop.
 */
