import {
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
} from '../src/geometry';
import * as testing from '../testing/testing-utils';
import {
  Aabb,
  LineSegment,
} from '../../collisions/collidables';

describe('geometry', () => {
  describe('findSquaredDistanceBetweenSegments', () => {
    it('one segment points into the middle of the other', () => {
      const segmentA = new LineSegment(
          vec3.fromValues(0, 4, 0),
          vec3.fromValues(0, 0, 4));
      const segmentB = new LineSegment(
          vec3.fromValues(0, 0, 0),
          vec3.fromValues(-8, -1, -3));
      expect(findSquaredDistanceBetweenSegments(segmentA, segmentB)).toBeCloseTo(8);
    });

    it('one segment points into the middle of the other (reversed)', () => {
      const segmentA = new LineSegment(
          vec3.fromValues(0, 4, 0),
          vec3.fromValues(0, 0, 4));
      const segmentB = new LineSegment(
          vec3.fromValues(-8, -1, -3),
          vec3.fromValues(0, 0, 0));
      expect(findSquaredDistanceBetweenSegments(segmentA, segmentB)).toBeCloseTo(8);
    });

    it('the segments ends are closest', () => {
      const segmentA = new LineSegment(
          vec3.fromValues(0, 4, 0),
          vec3.fromValues(0, 0, 4));
      const segmentB = new LineSegment(
          vec3.fromValues(-18, -2, -3),
          vec3.fromValues(0, -1, 4));
      expect(findSquaredDistanceBetweenSegments(segmentA, segmentB)).toBeCloseTo(1);
    });

    it('the segments ends are closest (reversed)', () => {
      const segmentA = new LineSegment(
          vec3.fromValues(0, 0, 4),
          vec3.fromValues(0, 4, 0));
      const segmentB = new LineSegment(
          vec3.fromValues(0, -1, 4),
          vec3.fromValues(-18, -2, -3));
      expect(findSquaredDistanceBetweenSegments(segmentA, segmentB)).toBeCloseTo(1);
    });

    it('the segments are parallel, with a small perpendicular overlap', () => {
      const segmentA = new LineSegment(
          vec3.fromValues(0, 0, 4),
          vec3.fromValues(0, 4, 0));
      const segmentB = new LineSegment(
          vec3.fromValues(-3, 1, 3),
          vec3.fromValues(-3, 5, -1));
      expect(findSquaredDistanceBetweenSegments(segmentA, segmentB)).toBeCloseTo(9);
    });

    it('the segments are collinear', () => {
      const segmentA = new LineSegment(
          vec3.fromValues(0, 0, 4),
          vec3.fromValues(0, 4, 0));
      const segmentB = new LineSegment(
          vec3.fromValues(0, 1, 3),
          vec3.fromValues(0, 5, -1));
      expect(findSquaredDistanceBetweenSegments(segmentA, segmentB)).toBeCloseTo(0);
    });

    it('the segments are identical', () => {
      const segmentA = new LineSegment(
          vec3.fromValues(0, 0, 4),
          vec3.fromValues(0, 4, 0));
      const segmentB = new LineSegment(
          vec3.fromValues(0, 0, 4),
          vec3.fromValues(0, 4, 0));
      expect(findSquaredDistanceBetweenSegments(segmentA, segmentB)).toBeCloseTo(0);
    });
  });

  it('findSquaredDistanceFromSegmentToPoint', () => {
    const segment = new LineSegment(
        vec3.fromValues(0, 4, 0),
        vec3.fromValues(0, 0, 4));
    const point = vec3.fromValues(0, 0, 0);
    const distance = findSquaredDistanceFromSegmentToPoint(segment, point);
    expect(distance).toBeCloseTo(8, 5);
  });

  describe('findClosestPointFromAabbToPoint', () => {
    let aabb;
    let outputPoint;

    beforeEach(() => {
      aabb = new Aabb(-10, -20, -30, 10, 20, 30);
      outputPoint = vec3.create();
    });

    it('target point is outside AABB', () => {
      const targetPoint = vec3.fromValues(0, -50, 40);
      const expectedOutput = vec3.fromValues(0, -20, 30);
      findClosestPointFromAabbToPoint(outputPoint, aabb, targetPoint);
      testing.checkVec3(outputPoint, expectedOutput);
    });

    it('target point is inside AABB', () => {
      const targetPoint = vec3.fromValues(0, 0, 0);
      const expectedOutput = vec3.fromValues(0, 0, 0);
      findClosestPointFromAabbToPoint(outputPoint, aabb, targetPoint);
      testing.checkVec3(outputPoint, expectedOutput);
    });
  });

  describe('findClosestPointFromAabbSurfaceToPoint', () => {
    let aabb;
    let outputPoint;

    beforeEach(() => {
      aabb = new Aabb(-10, -20, -30, 10, 20, 30);
      outputPoint = vec3.create();
    });

    it('target point is outside AABB', () => {
      const targetPoint = vec3.fromValues(0, -50, 40);
      const expectedOutput = vec3.fromValues(0, -20, 30);
      findClosestPointFromAabbSurfaceToPoint(outputPoint, aabb, targetPoint);
      testing.checkVec3(outputPoint, expectedOutput);
    });

    it('target point is inside AABB', () => {
      const targetPoint = vec3.fromValues(1, 1, 1);
      const expectedOutput = vec3.fromValues(10, 1, 1);
      findClosestPointFromAabbSurfaceToPoint(outputPoint, aabb, targetPoint);
      testing.checkVec3(outputPoint, expectedOutput);
    });
  });

  describe('findPoiBetweenSegmentAndTriangle', () => {
    it('segment intersects triangle at oblique angle', () => {
      const start = vec3.fromValues(88.37643432617188, -106.05095672607422, 168.69427490234375);
      const end = vec3.fromValues(78.28089141845703, -107.23725891113281, 166.57643127441406);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(78.00701141357422, -105.4713363647461, 171.17198181152344);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);
      const expectedPoi = vec3.fromValues(80.30000305175781, -107, 167);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(true);
      testing.checkVec3(poi, expectedPoi);
    });

    it('the segment intersects the triangle at a perpendicular angle', () => {
      const start = vec3.fromValues(87.38280487060547, -106.38853454589844, 170.66879272460938);
      const end = vec3.fromValues(78.52930450439453, -107.15286254882812, 166.0828094482422);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(78.00701141357422, -105.4713363647461, 171.17198181152344);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);
      const expectedPoi = vec3.fromValues(80.30000305175781, -107, 167);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(true);
      testing.checkVec3(poi, expectedPoi);
    });

    it('the segment does not intersect the triangle', () => {
      const start = vec3.fromValues(126.59300231933594, -51.52866744995117, 85.82801818847656);
      const end = vec3.fromValues(104.26815032958984, -204.56210327148438, 132.6273956298828);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(78.00701141357422, -105.4713363647461, 171.17198181152344);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(false);
    });

    it('the segment does intersect the plane of the triangle but not within the bounds of the ' +
        'triangle', () => {
      const start = vec3.fromValues(88.98789978027344, -98.45860290527344, 166.2484130859375);
      const end = vec3.fromValues(76.92420959472656, -124.08280181884766, 172.00318908691406);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(78.00701141357422, -105.4713363647461, 171.17198181152344);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(false);
    });

    it('the segment end point is coplanar within the triangle', () => {
      const start = vec3.fromValues(88.37643432617188, -106.05095672607422, 168.69427490234375);
      const end = vec3.fromValues(80.30000305175781, -107, 167);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(78.00701141357422, -105.4713363647461, 171.17198181152344);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);
      const expectedPoi = vec3.fromValues(80.30000305175781, -107, 167);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(true);
      testing.checkVec3(poi, expectedPoi);
    });

    it('a segment end point is a triangle point', () => {
      const start = vec3.fromValues(80.30000305175781, -107, 167);
      const end = vec3.fromValues(78.28089141845703, -107.23725891113281, 166.57643127441406);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(80.30000305175781,-107,167);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);
      const expectedPoi = vec3.fromValues(80.30000305175781, -107, 167);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(true);
      testing.checkVec3(poi, expectedPoi);
    });

    it('the segment is coplanar within the triangle', () => {
      const start = vec3.fromValues(80.30000305175781, -107, 167);
      const end = vec3.fromValues(81.82866668701172, -100.01911163330078, 162.88534545898438);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(78.00701141357422, -105.4713363647461, 171.17198181152344);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(false);
    });

    it('the segment runs through a triangle point', () => {
      const start = vec3.fromValues(88.37643432617188, -106.05095672607422, 168.69427490234375);
      const end = vec3.fromValues(78.28089141845703, -107.23725891113281, 166.57643127441406);
      const a = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const b = vec3.fromValues(78.00701141357422, -105.4713363647461, 171.17198181152344);
      const c = vec3.fromValues(83.58662414550781, -102.19108581542969, 159.85350036621094);
      const expectedPoi = vec3.fromValues(80.30000305175781, -107, 167);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndTriangle(poi, segment, a, b, c);

      expect(wasIntersectionFound).toBe(true);
      testing.checkVec3(poi, expectedPoi);
    });
  });

  describe('findPoiBetweenSegmentAndPlaneRegion', () => {
    it('segment intersects plane at oblique angle', () => {
      const start = vec3.fromValues(88.37643432617188, -106.05095672607422, 168.69427490234375);
      const end = vec3.fromValues(78.28089141845703, -107.23725891113281, 166.57643127441406);
      const a = vec3.fromValues(76.55477905273438, -111.50318145751953, 174.98089599609375);
      const b = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const c = vec3.fromValues(84.04522705078125, -102.49681854248047, 159.01910400390625);
      const d = vec3.fromValues(77.62484741210938, -98.21656036376953, 170.7006378173828);
      const expectedPoi = vec3.fromValues(80.30000305175781, -107, 167);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndPlaneRegion(poi, segment, a, b, c,
          d);

      expect(wasIntersectionFound).toBe(true);
      testing.checkVec3(poi, expectedPoi);
    });

    it('the segment does not intersect the plane region', () => {
      const start = vec3.fromValues(96.78408813476562, -1.6560516357421875, 135.06369018554688);
      const end = vec3.fromValues(86.78408813476562, -1.6560516357421875, 132.56369018554688);
      const a = vec3.fromValues(76.55477905273438, -111.50318145751953, 174.98089599609375);
      const b = vec3.fromValues(82.97515869140625, -115.78343963623047, 163.2993621826172);
      const c = vec3.fromValues(84.04522705078125, -102.49681854248047, 159.01910400390625);
      const d = vec3.fromValues(77.62484741210938, -98.21656036376953, 170.7006378173828);

      const segment = new LineSegment(start, end);
      const poi = vec3.create();

      const wasIntersectionFound = findPoiBetweenSegmentAndPlaneRegion(poi, segment, a, b, c,
          d);

      expect(wasIntersectionFound).toBe(false);
    });
  });

  describe('findClosestPointFromObbToPoint', () => {
    it('they intersect and the closest point is a corner of the OBB', () => {
      const obb = testing.createObb(10, 10, 10, 0, 18, 0);
      const targetPoint = vec3.fromValues(0, -100, 0);
      const outputPoint = vec3.create();
      const expectedPoint = vec3.fromValues(2.9289321899414062, 0.9289340972900391, 0);
      findClosestPointFromObbToPoint(outputPoint, obb, targetPoint);
      testing.checkVec3(outputPoint, expectedPoint);
    });

    it('they intersect and the closest point is on a face of the OBB', () => {
      const obb = testing.createObb(10, 10, 10, 0, 0, 0, false);
      const targetPoint = vec3.fromValues(0, 15, 0);
      const outputPoint = vec3.create();
      const expectedPoint = vec3.fromValues(0, 10, 0);
      findClosestPointFromObbToPoint(outputPoint, obb, targetPoint);
      testing.checkVec3(outputPoint, expectedPoint);
    });

    it('they do not intersect and the closest point is a corner of the OBB', () => {
      const obb = testing.createObb(10, 10, 10, 0, 25, 0);
      const targetPoint = vec3.fromValues(0, 0, 0);
      const outputPoint = vec3.create();
      const expectedPoint = vec3.fromValues(2.9289321899414062, 7.9289340972900391, 0);
      findClosestPointFromObbToPoint(outputPoint, obb, targetPoint);
      testing.checkVec3(outputPoint, expectedPoint);
    });
  });

  describe('findClosestPointsFromSegmentToSegment', () => {
    it('closest point is within bounds of both segments', () => {
      const startA = vec3.fromValues(5.24267578125, 3.0382165908813477, 60.22929763793945);
      const endA = vec3.fromValues(14.41464900970459, -27.076433181762695, 47.54140090942383);
      const segmentA = new LineSegment(startA, endA);

      const startB = vec3.fromValues(16.96879005432129, -7.445859909057617, 63.3248405456543);
      const endB = vec3.fromValues(22.854141235351562, -0.3694276809692383, 50.78343963623047);
      const segmentB = new LineSegment(startB, endB);

      const closestA = vec3.create();
      const closestB = vec3.create();
      const expectedClosestPointA = vec3.fromValues(8.3, -7, 56);
      const expectedClosestPointB = vec3.fromValues(18.03885269165039, -6.159235954284668,
          61.044586181640625);

      findClosestPointsFromSegmentToSegment(closestA, closestB, segmentA, segmentB);

      testing.checkVec3(closestA, expectedClosestPointA);
      testing.checkVec3(closestB, expectedClosestPointB);
    });

    it('closest point would be out of bounds of both segments', () => {
      const startA = vec3.fromValues(10.59299373626709, -14.52866268157959, 52.828025817871094);
      const endA = vec3.fromValues(9.828662872314453, -12.019107818603516, 53.88534927368164);
      const segmentA = new LineSegment(startA, endA);

      const startB = vec3.fromValues(119.28726196289062, 2.6751575469970703, 117.05095672607422);
      const endB = vec3.fromValues(117.83503723144531, 2.643310546875, 119.85987091064453);
      const segmentB = new LineSegment(startB, endB);

      const closestA = vec3.create();
      const closestB = vec3.create();
      const expectedClosestPointA = vec3.fromValues(9.828662872314453, -12.019107818603516,
          53.88534927368164);
      const expectedClosestPointB = vec3.fromValues(119.28726196289062, 2.6751575469970703,
          117.05095672607422);

      findClosestPointsFromSegmentToSegment(closestA, closestB, segmentA, segmentB);

      testing.checkVec3(closestA, expectedClosestPointA);
      testing.checkVec3(closestB, expectedClosestPointB);
    });

    it('closest point would be out of bounds of the first segment', () => {
      const startA = vec3.fromValues(5.24267578125, 3.0382165908813477, 60.22929763793945);
      const endA = vec3.fromValues(2.1853513717651367, 13.076433181762695, 64.4585952758789);
      const segmentA = new LineSegment(startA, endA);

      const startB = vec3.fromValues(16.96879005432129, -7.445859909057617, 63.3248405456543);
      const endB = vec3.fromValues(22.854141235351562, -0.3694276809692383, 50.78343963623047);
      const segmentB = new LineSegment(startB, endB);

      const closestA = vec3.create();
      const closestB = vec3.create();
      const expectedClosestPointA = vec3.fromValues(5.24267578125, 3.0382165908813477,
          60.22929763793945);
      const expectedClosestPointB = vec3.fromValues(18.03885269165039, -6.159235954284668,
          61.044586181640625);

      findClosestPointsFromSegmentToSegment(closestA, closestB, segmentA, segmentB);

      testing.checkVec3(closestA, expectedClosestPointA);
      testing.checkVec3(closestB, expectedClosestPointB);

    });

    it('closest point would be out of bounds of the second segment', () => {
      const startA = vec3.fromValues(5.24267578125, 3.0382165908813477, 60.22929763793945);
      const endA = vec3.fromValues(14.41464900970459, -27.076433181762695, 47.54140090942383);
      const segmentA = new LineSegment(startA, endA);

      const startB = vec3.fromValues(19.108917236328125, -4.872611999511719, 58.76433181762695);
      const endB = vec3.fromValues(22.854141235351562, -0.3694276809692383, 50.78343963623047);
      const segmentB = new LineSegment(startB, endB);

      const closestA = vec3.create();
      const closestB = vec3.create();
      const expectedClosestPointA = vec3.fromValues(8.3, -7, 56);
      const expectedClosestPointB = vec3.fromValues(19.108917236328125,-4.872611999511719,58.76433181762695);

      findClosestPointsFromSegmentToSegment(closestA, closestB, segmentA, segmentB);

      testing.checkVec3(closestA, expectedClosestPointA);
      testing.checkVec3(closestB, expectedClosestPointB);
    });

    it('closest point would be at the start point of one segment and out of bounds of the other',
        () => {
          const startA = vec3.fromValues(-49.5738525390625, -13.761798858642578, 53.62818908691406);
          const endA = vec3.fromValues(-34.28862380981445, -24.25415802001953, 58.753822326660156);
          const segmentA = new LineSegment(startA, endA);

          const startB = vec3.fromValues(-10.7504243850708, 26.01918601989746, 8.359931945800781);
          const endB = vec3.fromValues(-10.679117202758789, 28.396095275878906, 9.891341209411621);
          const segmentB = new LineSegment(startB, endB);

          const closestA = vec3.create();
          const closestB = vec3.create();
          const expectedClosestPointA = vec3.fromValues(-49.5738525390625, -13.761798858642578,
              53.62818908691406);
          const expectedClosestPointB = vec3.fromValues(-10.7504243850708, 26.01918601989746,
              8.359931945800781);

          findClosestPointsFromSegmentToSegment(closestA, closestB, segmentA, segmentB);

          testing.checkVec3(closestA, expectedClosestPointA);
          testing.checkVec3(closestB, expectedClosestPointB);
        });
  });

  describe('findClosestPointOnSegmentToPoint', () => {
    it('point is closest to the middle of the segment', () => {
      const segment = new LineSegment(
          vec3.fromValues(0, 4, 0),
          vec3.fromValues(0, 0, 4));
      const point = vec3.fromValues(0, 0, 0);
      const result = vec3.create();
      findClosestPointOnSegmentToPoint(result, segment, point);
      testing.checkVec3(result, vec3.fromValues(0, 2, 2));
    });

    it('point is closest to the middle of the segment (reversed)', () => {
      const segment = new LineSegment(
          vec3.fromValues(0, 0, 4),
          vec3.fromValues(0, 4, 0));
      const point = vec3.fromValues(0, 0, 0);
      const result = vec3.create();
      findClosestPointOnSegmentToPoint(result, segment, point);
      testing.checkVec3(result, vec3.fromValues(0, 2, 2));
    });

    it('point is closest to the end of the segment', () => {
      const segment = new LineSegment(
          vec3.fromValues(0, 4, 0),
          vec3.fromValues(0, 0, 4));
      const point = vec3.fromValues(0, -1, 4);
      const result = vec3.create();
      findClosestPointOnSegmentToPoint(result, segment, point);
      testing.checkVec3(result, vec3.fromValues(0, 0, 4));
    });

    it('point is closest to the end of the segment (reversed)', () => {
      const segment = new LineSegment(
          vec3.fromValues(0, 0, 4),
          vec3.fromValues(0, 4, 0));
      const point = vec3.fromValues(0, -1, 4);
      const result = vec3.create();
      findClosestPointOnSegmentToPoint(result, segment, point);
      testing.checkVec3(result, vec3.fromValues(0, 0, 4));
    });
  });

  describe('findClosestPointsFromLineToLine', () => {
    it('overlap with normalized line distances between 0 and 1', () => {
      const startA = vec3.fromValues(5.24267578125, 3.0382165908813477, 60.22929763793945);
      const endA = vec3.fromValues(14.41464900970459, -27.076433181762695, 47.54140090942383);
      const dirA = vec3.create();
      vec3.subtract(dirA, endA, startA);

      const startB = vec3.fromValues(16.96879005432129, -7.445859909057617, 63.3248405456543);
      const endB = vec3.fromValues(22.854141235351562, -0.3694276809692383, 50.78343963623047);
      const dirB = vec3.create();
      vec3.subtract(dirB, endB, startB);

      const expectedDistA = 0.33333333333333;
      const expectedDistB = 0.18181818181818;

      const result = findClosestPointsFromLineToLine(startA, dirA, startB, dirB);

      expect(result.distA).toBeCloseTo(expectedDistA, 5);
      expect(result.distB).toBeCloseTo(expectedDistB, 5);
    });

    it('overlap with normalized line distances of 0 and negative', () => {
      const startA = vec3.fromValues(-49.5738525390625, -13.761798858642578, 53.62818908691406);
      const endA = vec3.fromValues(-34.28862380981445, -24.25415802001953, 58.753822326660156);
      const dirA = vec3.create();
      vec3.subtract(dirA, endA, startA);

      const startB = vec3.fromValues(-10.7504243850708, 26.01918601989746, 8.359931945800781);
      const endB = vec3.fromValues(-10.679117202758789, 28.396095275878906, 9.891341209411621);
      const dirB = vec3.create();
      vec3.subtract(dirB, endB, startB);

      const expectedDistA = 0;
      const expectedDistB = -3.5;

      const result = findClosestPointsFromLineToLine(startA, dirA, startB, dirB);

      expect(result.distA).toBeCloseTo(expectedDistA, 5);
      expect(result.distB).toBeCloseTo(expectedDistB, 5);
    });
  });

  // TODO: Test areVec3sClose
});
