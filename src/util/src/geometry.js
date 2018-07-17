/**
 * This module defines a collection of static geometry utility functions.
 */

const EPSILON = 0.0000001;
const HALF_PI = Math.PI / 2;
const TWO_PI = Math.PI * 2;

/**
 * Finds the minimum squared distance between two line segments.
 *
 * @param {LineSegment} segmentA
 * @param {LineSegment} segmentB
 * @returns {number}
 */
function findSquaredDistanceBetweenSegments(segmentA, segmentB) {
  findClosestPointsFromSegmentToSegment(_segmentDistance_tmpVecA, _segmentDistance_tmpVecB,
      segmentA, segmentB);
  return vec3.squaredDistance(_segmentDistance_tmpVecA, _segmentDistance_tmpVecB);
}

/**
 * Finds the minimum squared distance between a line segment and a point.
 *
 * @param {LineSegment} segment
 * @param {vec3} point
 * @returns {number}
 */
function findSquaredDistanceFromSegmentToPoint(segment, point) {
  findClosestPointOnSegmentToPoint(_segmentDistance_tmpVecA, segment, point);
  return vec3.squaredDistance(_segmentDistance_tmpVecA, point);
}

const _segmentDistance_tmpVecA = vec3.create();
const _segmentDistance_tmpVecB = vec3.create();

/**
 * @param {vec3} outputPoint Output parameter.
 * @param {Aabb} aabb
 * @param {vec3} targetPoint
 */
function findClosestPointFromAabbToPoint(outputPoint, aabb, targetPoint) {
  outputPoint[0] = aabb.minX > targetPoint[0]
      ? aabb.minX
      : aabb.maxX < targetPoint[0]
          ? aabb.maxX
          : targetPoint[0];
  outputPoint[1] = aabb.minY > targetPoint[1]
      ? aabb.minY
      : aabb.maxY < targetPoint[1]
          ? aabb.maxY
          : targetPoint[1];
  outputPoint[2] = aabb.minZ > targetPoint[2]
      ? aabb.minZ
      : aabb.maxZ < targetPoint[2]
          ? aabb.maxZ
          : targetPoint[2];
}

/**
 * @param {vec3} outputPoint Output parameter.
 * @param {Aabb} aabb
 * @param {vec3} targetPoint
 */
function findClosestPointFromAabbSurfaceToPoint(outputPoint, aabb, targetPoint) {
  findClosestPointFromAabbToPoint(outputPoint, aabb, targetPoint);

  // If the calculated point lies within the AABB, then we need to adjust one coordinate to lie
  // along the edge of the AABB.
  if (aabbVsPoint(aabb, outputPoint)) {
    // Calculate the closest vertex.
    _tmpVec1[0] = targetPoint[0] - aabb.minX < aabb.maxX - targetPoint[0]
        ? aabb.minX
        : aabb.maxX;
    _tmpVec1[1] = targetPoint[1] - aabb.minY < aabb.maxY - targetPoint[1]
        ? aabb.minY
        : aabb.maxY;
    _tmpVec1[2] = targetPoint[2] - aabb.minZ < aabb.maxZ - targetPoint[2]
        ? aabb.minZ
        : aabb.maxZ;

    // Calculate the distance to the vertex along each dimension.
    _tmpVec2[0] = _tmpVec1[0] - outputPoint[0];
    _tmpVec2[0] = _tmpVec2[0] < 0 ? -_tmpVec2[0] : _tmpVec2[0];
    _tmpVec2[1] = _tmpVec1[1] - outputPoint[1];
    _tmpVec2[1] = _tmpVec2[1] < 1 ? -_tmpVec2[1] : _tmpVec2[1];
    _tmpVec2[2] = _tmpVec1[2] - outputPoint[2];
    _tmpVec2[2] = _tmpVec2[2] < 2 ? -_tmpVec2[2] : _tmpVec2[2];

    // Determine along which dimension the point is closest to the AABB.
    const index = _tmpVec2[0] < _tmpVec2[1]
        ? (_tmpVec2[0] < _tmpVec2[2]
            ? 0
            : 2)
        : (_tmpVec2[1] < _tmpVec2[2]
            ? 1
            : 2);

    outputPoint[index] = _tmpVec1[index];
  }
}

/**
 * Finds the point of intersection between a line segment and a coplanar quadrilateral.
 *
 * This assumes the region is not degenerate (has non-zero side lengths).
 *
 * @param {vec3} poi Output param. Null if there is no intersection.
 * @param {LineSegment} segment
 * @param {vec3} planeVertex1
 * @param {vec3} planeVertex2
 * @param {vec3} planeVertex3
 * @param {vec3} planeVertex4
 * @returns {boolean} True if there is an intersection.
 */
function findPoiBetweenSegmentAndPlaneRegion(poi, segment, planeVertex1, planeVertex2, planeVertex3,
                                             planeVertex4) {
  return findPoiBetweenSegmentAndTriangle(poi, segment, planeVertex1, planeVertex2, planeVertex3) ||
      findPoiBetweenSegmentAndTriangle(poi, segment, planeVertex1, planeVertex3, planeVertex4);
}

/**
 * Finds the point of intersection between a line segment and a triangle.
 *
 * This assumes the triangle is not degenerate (has non-zero side lengths).
 *
 * ----------------------------------------------------------------------------
 * Originally based on Dan Sunday's algorithms at http://geomalgorithms.com/a06-_intersect-2.html.
 *
 * Copyright 2001 softSurfer, 2012 Dan Sunday
 * This code may be freely used and modified for any purpose
 * providing that this copyright notice is included with it.
 * SoftSurfer makes no warranty for this code, and cannot be held
 * liable for any real or imagined damage resulting from its use.
 * Users of this code must verify correctness for their application.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} poi Output param. Null if there is no intersection.
 * @param {LineSegment} segment
 * @param {vec3} triangleVertex1
 * @param {vec3} triangleVertex2
 * @param {vec3} triangleVertex3
 * @returns {boolean} True if there is an intersection.
 */
function findPoiBetweenSegmentAndTriangle(poi, segment, triangleVertex1, triangleVertex2,
                                          triangleVertex3) {
  //
  // Find the point of intersection between the segment and the triangle's plane.
  //

  // First triangle edge.
  vec3.subtract(_tmpVec1, triangleVertex2, triangleVertex1);
  // Second triangle edge.
  vec3.subtract(_tmpVec2, triangleVertex3, triangleVertex1);
  // Triangle normal.
  vec3.cross(_tmpVec3, _tmpVec1, _tmpVec2);
  // Triangle to segment.
  vec3.subtract(_tmpVec4, segment.start, triangleVertex1);

  const normalToSegmentProj = vec3.dot(_tmpVec3, segment.dir);

  if (normalToSegmentProj < EPSILON && normalToSegmentProj > -EPSILON) {
    // The line segment is parallel to the triangle.
    return false;
  }

  const normalToDiffProj = -vec3.dot(_tmpVec3, _tmpVec4);
  const segmentNormalizedDistance = normalToDiffProj / normalToSegmentProj;

  if (segmentNormalizedDistance < 0 || segmentNormalizedDistance > 1) {
    // The line segment ends before intersecting the plane.
    return false;
  }

  vec3.scaleAndAdd(poi, segment.start, segment.dir, segmentNormalizedDistance);

  //
  // Determine whether the point of intersection lies within the triangle.
  //

  const edge1DotEdge1 = vec3.dot(_tmpVec1, _tmpVec1);
  const edge1DotEdge2 = vec3.dot(_tmpVec1, _tmpVec2);
  const edge2DotEdge2 = vec3.dot(_tmpVec2, _tmpVec2);
  // Triangle to point of intersection.
  vec3.subtract(_tmpVec3, poi, triangleVertex1);
  const diffDotEdge1 = vec3.dot(_tmpVec3, _tmpVec1);
  const diffDotEdge2 = vec3.dot(_tmpVec3, _tmpVec2);
  const denominator = edge1DotEdge2 * edge1DotEdge2 - edge1DotEdge1 * edge2DotEdge2;

  // Check the triangle's parametric coordinates.
  const s = (edge1DotEdge2 * diffDotEdge2 - edge2DotEdge2 * diffDotEdge1) / denominator;
  if (s < 0 || s > 1) {
    return false;
  }
  const t = (edge1DotEdge2 * diffDotEdge1 - edge1DotEdge1 * diffDotEdge2) / denominator;
  if (t < 0 || s + t > 1) {
    return false;
  }

  return true;
}

/**
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/1093e39d91def7ff6905fb7489893190d7d81353/src/Geometry/OBB.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} outputPoint Output parameter.
 * @param {Obb} obb
 * @param {vec3} targetPoint
 */
function findClosestPointFromObbToPoint(outputPoint, obb, targetPoint) {
  vec3.subtract(_tmpVec1, targetPoint, obb.centerOfVolume);
  vec3.copy(outputPoint, obb.centerOfVolume);
  for (let i = 0; i < 3; i++) {
    // Compute the displacement along this axis.
    let projection = vec3.dot(obb.axes[i], _tmpVec1);
    projection = projection > obb.halfSideLengths[i] ? obb.halfSideLengths[i] :
        (projection < -obb.halfSideLengths[i] ? -obb.halfSideLengths[i] : projection);
    vec3.scaleAndAdd(outputPoint, outputPoint, obb.axes[i], projection);
  }
}

/**
 * Finds the closest position on one line segment to the other line segment, and vice versa.
 *
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/ff2d348a167008c831ae304483b824647f71fbf6/src/Geometry/LineSegment.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} closestA Output param.
 * @param {vec3} closestB Output param.
 * @param {LineSegment} segmentA
 * @param {LineSegment} segmentB
 */
function findClosestPointsFromSegmentToSegment(closestA, closestB, segmentA, segmentB) {
  const {distA, distB} = findClosestPointsFromLineToLine(
      segmentA.start, segmentA.dir, segmentB.start, segmentB.dir);

  const isDistAInBounds = distA >= 0 && distA <= 1;
  const isDistBInBounds = distB >= 0 && distB <= 1;

  if (isDistAInBounds) {
    if (isDistBInBounds) {
      // The distances along both line segments are within bounds.
      vec3.scaleAndAdd(closestA, segmentA.start, segmentA.dir, distA);
      vec3.scaleAndAdd(closestB, segmentB.start, segmentB.dir, distB);
    } else {
      // Only the distance along the first line segment is within bounds.
      if (distB < 0) {
        vec3.copy(closestB, segmentB.start);
      } else {
        vec3.copy(closestB, segmentB.end);
      }
      findClosestPointOnSegmentToPoint(closestA, segmentA, closestB);
    }
  } else {
    if (isDistBInBounds) {
      // Only the distance along the second line segment is within bounds.
      if (distA < 0) {
        vec3.copy(closestA, segmentA.start);
      } else {
        vec3.copy(closestA, segmentA.end);
      }
      findClosestPointOnSegmentToPoint(closestB, segmentB, closestA);
    } else {
      // Neither of the distances along either line segment are within bounds.
      if (distA < 0) {
        vec3.copy(closestA, segmentA.start);
      } else {
        vec3.copy(closestA, segmentA.end);
      }

      if (distB < 0) {
        vec3.copy(closestB, segmentB.start);
      } else {
        vec3.copy(closestB, segmentB.end);
      }

      const altClosestA = vec3.create();
      const altClosestB = vec3.create();

      findClosestPointOnSegmentToPoint(altClosestA, segmentA, closestB);
      findClosestPointOnSegmentToPoint(altClosestB, segmentB, closestA);

      if (vec3.squaredDistance(altClosestA, closestB) <
          vec3.squaredDistance(altClosestB, closestA)) {
        vec3.copy(closestA, altClosestA);
      } else {
        vec3.copy(closestB, altClosestB);
      }
    }
  }
}

/**
 * Finds the closest position on a line segment to a point.
 *
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/ff2d348a167008c831ae304483b824647f71fbf6/src/Geometry/LineSegment.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} closestPoint Output param.
 * @param {LineSegment} segment
 * @param {vec3} point
 * @private
 */
function findClosestPointOnSegmentToPoint(closestPoint, segment, point) {
  const dirSquaredLength = vec3.squaredLength(segment.dir);

  if (!dirSquaredLength) {
    // The point is at the segment start.
    vec3.copy(closestPoint, segment.start);
  } else {
    // Calculate the projection of the point onto the line extending through the segment.
    vec3.subtract(_tmpVec1, point, segment.start);
    const t = vec3.dot(_tmpVec1, segment.dir) / dirSquaredLength;

    if (t < 0) {
      // The point projects beyond the segment start.
      vec3.copy(closestPoint, segment.start);
    } else if (t > 1) {
      // The point projects beyond the segment end.
      vec3.copy(closestPoint, segment.end);
    } else {
      // The point projects between the start and end of the segment.
      vec3.scaleAndAdd(closestPoint, segment.start, segment.dir, t);
    }
  }
}

/**
 * Finds the closest position on one line to the other line, and vice versa.
 *
 * The positions are represented as scalar-value distances from the "start" positions of each line.
 * These are scaled according to the given direction vectors.
 *
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/ff2d348a167008c831ae304483b824647f71fbf6/src/Geometry/Line.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} startA The start position of line A.
 * @param {vec3} dirA The (unnormalized) direction of line A. Cannot be zero.
 * @param {vec3} startB The start position of line B.
 * @param {vec3} dirB The (unnormalized) direction of line B. Cannot be zero.
 * @returns {{distA: Number, distB: Number}}
 */
function findClosestPointsFromLineToLine(startA, dirA, startB, dirB) {
  vec3.subtract(_tmpVec1, startA, startB);
  const dirBDotDirAToB = vec3.dot(dirB, _tmpVec1);
  const dirADotDirAToB = vec3.dot(dirA, _tmpVec1);

  const sqrLenDirB = vec3.squaredLength(dirB);
  const sqrLenDirA = vec3.squaredLength(dirA);

  const dirADotDirB = vec3.dot(dirA, dirB);

  const denominator = sqrLenDirA * sqrLenDirB - dirADotDirB * dirADotDirB;

  const distA = denominator < EPSILON
      ? 0
      : (dirADotDirB * dirBDotDirAToB - sqrLenDirB * dirADotDirAToB) / denominator;
  const distB = (dirBDotDirAToB + dirADotDirB * distA) / sqrLenDirB;

  return {
    distA: distA,
    distB: distB
  };
}

/**
 * A good description of why we need these special operations for rotating tensors can be found
 * here: http://www.randygaul.net/2014/04/09/transformations-change-of-basis-matrix/.
 *
 * @param {mat3} output Output param.
 * @param {mat3} tensor
 * @param {quat} rotation
 */
function rotateTensor(output, tensor, rotation) {// TODO: Test this somehow...
  mat3.fromQuat(_tmpMat, rotation);
  mat3.multiply(output, _tmpMat, tensor);
  mat3.invert(_tmpMat, _tmpMat);
  mat3.multiply(output, output, _tmpMat);
}

/**
 * @param {Aabb} aabb
 * @param {vec3} point
 * @returns {boolean}
 */
function aabbVsPoint(aabb, point) {
  return point[0] >= aabb.minX && point[0] <= aabb.maxX &&
      point[1] >= aabb.minY && point[1] <= aabb.maxY &&
      point[2] >= aabb.minZ && point[2] <= aabb.maxZ
}

/**
 * @param {quat} out
 * @param {quat} a
 * @param {quat} b
 * @param {number} scale
 * @returns {quat}
 */
function scaleAndAddQuat(out, a, b, scale) {
  return quat.set(out,
      a[0] + b[0] * scale,
      a[1] + b[1] * scale,
      a[2] + b[2] * scale,
      a[3] + b[3] * scale);
}

/**
 * @param {vec3} a
 * @param {vec3} b
 * @returns {boolean}
 */
function areVec3sClose(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] - b[i] > EPSILON || b[i] - a[i] > EPSILON) {
      return false;
    }
  }
  return true;
}

// Re-used across the geometry utility functions, so we don't instantiate as many vec3 objects.
const _tmpVec1 = vec3.create();
const _tmpVec2 = vec3.create();
const _tmpVec3 = vec3.create();
const _tmpVec4 = vec3.create();
const _tmpMat = mat3.create();

// Exposed to consumers, so they don't have to instantiate as many vec3 objects.
const tmpVec1 = vec3.create();
const tmpVec2 = vec3.create();
const tmpVec3 = vec3.create();
const tmpVec4 = vec3.create();

const _geometry = {
  EPSILON,
  HALF_PI,
  TWO_PI,
  scaleAndAddQuat,
};

export {
  _geometry,
  tmpVec1,
  tmpVec2,
  tmpVec3,
  tmpVec4,
  findSquaredDistanceBetweenSegments,
  findSquaredDistanceFromSegmentToPoint,
  findClosestPointFromAabbToPoint,
  findClosestPointFromAabbSurfaceToPoint,
  findPoiBetweenSegmentAndTriangle,
  findPoiBetweenSegmentAndPlaneRegion,
  findClosestPointFromObbToPoint,
  findClosestPointsFromSegmentToSegment,
  findClosestPointOnSegmentToPoint,
  findClosestPointsFromLineToLine,
  rotateTensor,
  aabbVsPoint,
  areVec3sClose,
};
