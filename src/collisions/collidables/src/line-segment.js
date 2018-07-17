import {tmpVec1, tmpVec2} from '../../../util';

/**
 * This class represents a line segment.
 */
class LineSegment {
  /**
   * @param {vec3} start
   * @param {vec3} end
   */
  constructor(start, end) {
    this.start = vec3.create();
    this.end = vec3.create();
    this._center = vec3.create();
    this._originalOrientationStart = vec3.create();
    this._originalOrientationEnd = vec3.create();
    this.reset(start, end);
  }

  /**
   * @param {vec3} start
   * @param {vec3} end
   */
  reset(start, end) {
    vec3.copy(this.start, start);
    vec3.copy(this.end, end);
    vec3.subtract(this._originalOrientationStart, this.start, this.center);
    vec3.subtract(this._originalOrientationEnd, this.end, this.center);
  }

  /** @returns {LineSegment} */
  clone() {
    const segment = new LineSegment(this.start, this.end);
    segment._originalOrientationStart = this._originalOrientationStart;
    segment._originalOrientationEnd = this._originalOrientationEnd;
    return segment;
  }

  /**
   * The UN-NORMALIZED direction of this segment.
   *
   * @returns {vec3}
   */
  get dir() {
    // Reuse the same object when this is called multiple times.
    this._dir = this._dir || vec3.create();
    return vec3.subtract(this._dir, this.end, this.start);
  }

  /** @returns {vec3} */
  get center() {
    vec3.lerp(this._center, this.start, this.end, 0.5);
    return this._center;
  }

  /** @param {vec3} value */
  set center(value) {
    // Reuse the same object when this is called multiple times.
    this._displacement = this._displacement || vec3.create();
    vec3.subtract(this._displacement, value, this.center);

    vec3.add(this.start, this.start, this._displacement);
    vec3.add(this.end, this.end, this._displacement);
  }

  /** @param {quat} value */
  set orientation(value) {
    vec3.transformQuat(tmpVec1, this._originalOrientationStart, value);
    vec3.transformQuat(tmpVec2, this._originalOrientationEnd, value);

    // We don't want this to be re-calculated between start/end updates.
    const center = this.center;

    vec3.add(this.start, center, tmpVec1);
    vec3.add(this.end, center, tmpVec2);
  }
}

export {LineSegment};
