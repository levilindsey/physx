/**
 * This module defines a collection of static general utility functions for testing.
 */

import {
  Capsule,
  Obb,
} from '../../collisions/collidables';

function createObb(halfSideLengthX, halfSideLengthY, halfSideLengthZ,
                   centerX, centerY, centerZ, rotate=true) {
  const obb = new Obb(halfSideLengthX, halfSideLengthY, halfSideLengthZ);
  if (rotate) {
    const orientation = quat.create();
    quat.rotateZ(orientation, orientation, Math.PI / 4);
    quat.rotateX(orientation, orientation, Math.PI / 4);
    obb.orientation = orientation;
  }
  obb.position = vec3.fromValues(centerX, centerY, centerZ);
  return obb
}

function createCapsule(halfDistance, radius, centerX, centerY, centerZ) {
  const capsule = new Capsule(halfDistance, radius);
  capsule.position = vec3.fromValues(centerX, centerY, centerZ);
  return capsule;
}

/**
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {vec3} [v3] If given, then if v1 != v2, v1 == v3 will be checked instead.
 * @param {vec3} [v4] If given, then if v1 != v3, v1 == v4 will be checked instead.
 */
function checkVec3(v1, v2, v3, v4) {
  let result = _compareVertices(v1, v2);
  if (result !== 0 && typeof v3 !== 'undefined') {
    result = _compareVertices(v1, v3);
    if (result !== 0 && typeof v4 !== 'undefined') {
      result = _compareVertices(v1, v4);
    }
  }
  expect(result).toEqual(0, `Expected (${v1}) to match (${v2})`);
}

/**
 * @param {LineSegment} segment
 * @param {vec3} expectedStart
 * @param {vec3} expectedEnd
 */
function checkSegment(segment, expectedStart, expectedEnd) {
  for (let i = 0; i < 3; i++) {
    expect(segment.start[i]).toBeCloseTo(expectedStart[i], 5);
    expect(segment.end[i]).toBeCloseTo(expectedEnd[i], 5);
  }
}

/**
 * @param {LineSegment} a
 * @param {LineSegment} b
 */
function checkSegmentWithoutOrientation(a, b) {
  expect(_compareEdges(a, b)).toEqual(0);
}

/**
 * @param {Array.<vec3>} a
 * @param {Array.<vec3>} b
 */
function checkPolylineWithoutOrder(a, b) {
  expect(_comparePolylnes(a, b)).toEqual(0);
}

/**
 * @param {Array.<vec3>} a
 * @param {Array.<vec3>} b
 */
function checkSortedPoints(a, b) {
  expect(a.length).toEqual(b.length);
  for (let i = 0, count = a.length; i < count; i++) {
    checkVec3(a[i], b[i]);
  }
}

/**
 * @param {Array.<vec3>} a
 * @param {Array.<vec3>} b
 */
function checkUnsortedPoints(a, b) {
  a = a.slice();
  b = b.slice();
  a = sortVertices(a);
  b = sortVertices(b);
  checkSortedPoints(a, b);
}

/**
 * @param {Array.<LineSegment>} a
 * @param {Array.<LineSegment>} b
 */
function checkSortedEdges(a, b) {
  expect(a.length).toEqual(b.length);
  for (let i = 0, count = a.length; i < count; i++) {
    checkSegmentWithoutOrientation(a[i], b[i]);
  }
}

/**
 * @param {Array.<LineSegment>} a
 * @param {Array.<LineSegment>} b
 */
function checkUnsortedEdges(a, b) {
  a = a.slice();
  b = b.slice();
  a = sortEdges(a);
  b = sortEdges(b);
  checkSortedEdges(a, b);
}

/**
 * @param {Array.<Array.<vec3>>} a
 * @param {Array.<Array.<vec3>>} b
 */
function checkSortedPolylines(a, b) {
  expect(a.length).toEqual(b.length);
  for (let i = 0, count = a.length; i < count; i++) {
    checkPolylineWithoutOrder(a[i], b[i]);
  }
}

/**
 * @param {Array.<Array.<vec3>>} a
 * @param {Array.<Array.<vec3>>} b
 */
function checkUnsortedPolylines(a, b) {
  a = sortPolylines(a);
  b = sortPolylines(b);
  checkSortedPolylines(a, b);
}

/**
 * @param {Array.<vec3>} vertices
 * @returns {Array.<vec3>}
 */
function sortVertices(vertices) {
  return vertices.sort(_compareVertices)
}

/**
 * @param {Array.<LineSegment>} edges
 * @returns {Array.<LineSegment>}
 */
function sortEdges(edges) {
  return edges.sort(_compareEdges)
}

/**
 * @param {Array.<Array.<vec3>>} polylines
 * @returns {Array.<Array.<vec3>>}
 */
function sortPolylines(polylines) {
  return polylines.sort(_comparePolylnes)
}

const EPSILON = 0.00001;

/**
 * @param {vec3} a
 * @param {vec3} b
 * @returns {number}
 */
function _compareVertices(a, b) {
  let diff = a[0] - b[0];
  if (Math.abs(diff) > EPSILON) {
    return diff;
  }
  diff = a[1] - b[1];
  if (Math.abs(diff) > EPSILON) {
    return diff;
  }
  diff = a[2] - b[2];
  if (Math.abs(diff) > EPSILON) {
    return diff;
  }
  return 0;
}

/**
 * @param {LineSegment} a
 * @param {LineSegment} b
 * @returns {number}
 */
function _compareEdges(a, b) {
  let aMin;
  let aMax;
  let bMin;
  let bMax;
  if (_compareVertices(a.start, a.end) <= 0) {
    aMin = a.start;
    aMax = a.end;
  } else {
    aMin = a.end;
    aMax = a.start;
  }
  if (_compareVertices(b.start, b.end) <= 0) {
    bMin = b.start;
    bMax = b.end;
  } else {
    bMin = b.end;
    bMax = b.start;
  }
  const startComparison = _compareVertices(aMin, bMin);
  return startComparison !== 0 ? startComparison : _compareVertices(aMax, bMax);
}

/**
 * @param {Array.<vec3>} a
 * @param {Array.<vec3>} b
 * @returns {number}
 */
function _comparePolylnes(a, b) {
  a = sortVertices(a);
  b = sortVertices(b);
  for (let i = 0, count = Math.min(a.length, b.length); i < count; i++) {
    const comparison = _compareVertices(a[i], b[i]);
    if (comparison !== 0) {
      return comparison;
    }
  }
  return a.length - b.length;
}

export {
  createObb,
  createCapsule,
  checkVec3,
  checkSegment,
  checkSegmentWithoutOrientation,
  checkPolylineWithoutOrder,
  checkSortedPoints,
  checkUnsortedPoints,
  checkSortedEdges,
  checkSortedPolylines,
  checkUnsortedEdges,
  checkUnsortedPolylines,
  sortVertices,
  sortEdges,
  sortPolylines,
};
