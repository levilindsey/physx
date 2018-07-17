import * as aabbContactCalculation from '../src/aabb-contact-calculation';
import {Aabb} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

const minX = -10;
const minY = -10;
const minZ = -10;
const maxX = 10;
const maxY = 10;
const maxZ = 10;

describe('aabb-contact-calculation', () => {
  let contactPoint
  let contactNormal;
  let aabb;

  beforeEach(() => {
    contactPoint = vec3.create();
    contactNormal = vec3.create();
    aabb = new Aabb(minX, minY, minZ, maxX, maxY, maxZ);
  });

  describe('aabbVsPoint', () => {
    it('should calculate intersection of point in AABB', () => {
      const point = vec3.fromValues(9, 7, -8);
      const expectedContactPoint = vec3.fromValues(9, 7, -8);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      aabbContactCalculation.aabbVsPoint(contactPoint, contactNormal, aabb, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of point on edge of AABB', () => {
      const point = vec3.fromValues(8, -10, 1);
      const expectedContactPoint = vec3.fromValues(8, -10, 1);
      const expectedNormal = vec3.fromValues(0, -1, 0);
      aabbContactCalculation.aabbVsPoint(contactPoint, contactNormal, aabb, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('aabbVsAabb', () => {
    it('should calculate intersection of AABB contained in AABB', () => {
      const other = new Aabb(-5, -4, -3, 2, 1, 0);
      const expectedContactPoint = vec3.fromValues(-5, -4, -3);
      const expectedNormal = vec3.fromValues(0, 0, -1);
      aabbContactCalculation.aabbVsAabb(contactPoint, contactNormal, aabb, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB whose bounds overlap with AABB', () => {
      const other = new Aabb(5, 6, 7, 15, 15, 15);
      const expectedContactPoint = vec3.fromValues(10, 10, 10);
      const expectedNormal = vec3.fromValues(0, 0, 1);
      aabbContactCalculation.aabbVsAabb(contactPoint, contactNormal, aabb, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB whose bounds touch AABB', () => {
      const other = new Aabb(10, 9, 7, 20, 20, 20);
      const expectedContactPoint = vec3.fromValues(10, 10, 10);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      aabbContactCalculation.aabbVsAabb(contactPoint, contactNormal, aabb, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  // aabbVsSphere is covered in sphere-contact-calculation_test.js

  // aabbVsObb is covered in obb-contact-calculation_test.js

  // aabbVsCapsule is covered in capsule-contact-calculation_test.js

  describe('findAabbNormalFromContactPoint', () => {
    it('should handle a point along the positive x-axis', () => {
      const point = vec3.fromValues(9, -8, 7);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      aabbContactCalculation.findAabbNormalFromContactPoint(contactNormal, point, aabb);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should handle a point along the positive y-axis', () => {
      const point = vec3.fromValues(-1, 10, -4);
      const expectedNormal = vec3.fromValues(0, 1, 0);
      aabbContactCalculation.findAabbNormalFromContactPoint(contactNormal, point, aabb);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should handle a point along the positive z-axis', () => {
      const point = vec3.fromValues(0.1, 0.2, 0.5);
      const expectedNormal = vec3.fromValues(0, 0, 1);
      aabbContactCalculation.findAabbNormalFromContactPoint(contactNormal, point, aabb);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should handle a point along a negative axis', () => {
      const point = vec3.fromValues(-9, 8, 7);
      const expectedNormal = vec3.fromValues(-1, 0, 0);
      aabbContactCalculation.findAabbNormalFromContactPoint(contactNormal, point, aabb);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should handle a point on a vertex', () => {
      const point = vec3.fromValues(10, 10, 10);
      const expectedNormal1 = vec3.fromValues(1, 0, 0);
      const expectedNormal2 = vec3.fromValues(0, 1, 0);
      const expectedNormal3 = vec3.fromValues(0, 0, 1);
      aabbContactCalculation.findAabbNormalFromContactPoint(contactNormal, point, aabb);
      testing.checkVec3(contactNormal, expectedNormal1, expectedNormal2, expectedNormal3);
    });
  });
});
