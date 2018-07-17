import * as aabbCollisionDetection from '../src/aabb-collision-detection';
import {
  Aabb,
  Sphere,
} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

const minX = -10;
const minY = -10;
const minZ = -10;
const maxX = 10;
const maxY = 10;
const maxZ = 10;

describe('aabb-collision-detection', () => {
  let aabb;

  beforeEach(() => {
    aabb = new Aabb(minX, minY, minZ, maxX, maxY, maxZ);
  });

  describe('aabbVsPoint', () => {
    it('should detect intersection of point in AABB', () => {
      const point = vec3.fromValues(0, 0, 0);
      expect(aabbCollisionDetection.aabbVsPoint(aabb, point)).toBe(true);
    });

    it('should detect intersection of point on edge of AABB', () => {
      const point = vec3.fromValues(maxX, minY, maxZ);
      expect(aabbCollisionDetection.aabbVsPoint(aabb, point)).toBe(true);
    });

    it('should not detect intersection of point outside AABB', () => {
      const point = vec3.fromValues(0, 0, maxZ * 2);
      expect(aabbCollisionDetection.aabbVsPoint(aabb, point)).toBe(false);
    });
  });

  describe('aabbVsSphere', () => {
    it('should detect intersection of sphere contained in AABB', () => {
      const sphere = new Sphere(0, 0, 0, 1);
      expect(aabbCollisionDetection.aabbVsSphere(aabb, sphere)).toBe(true);
    });

    it('should detect intersection of sphere containing AABB', () => {
      const sphere = new Sphere(0, 0, 0, 100);
      expect(aabbCollisionDetection.aabbVsSphere(aabb, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds overlap with AABB', () => {
      const sphere = new Sphere(15, 15, -15, 10);
      expect(aabbCollisionDetection.aabbVsSphere(aabb, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds touch AABB', () => {
      const sphere = new Sphere(15, 0, 0, 5);
      expect(aabbCollisionDetection.aabbVsSphere(aabb, sphere)).toBe(true);
    });

    it('should not detect intersection of sphere outside of AABB', () => {
      const sphere = new Sphere(20, 0, 0, 5);
      expect(aabbCollisionDetection.aabbVsSphere(aabb, sphere)).toBe(false);
    });
  });

  describe('aabbVsAabb', () => {
    it('should detect intersection of AABB contained in AABB', () => {
      const other = new Aabb(-1, -1, -1, 1, 1, 1);
      expect(aabbCollisionDetection.aabbVsAabb(aabb, other)).toBe(true);
      expect(aabbCollisionDetection.aabbVsAabb(other, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose bounds overlap with AABB', () => {
      const other = new Aabb(5, 5, 5, 15, 15, 15);
      expect(aabbCollisionDetection.aabbVsAabb(aabb, other)).toBe(true);
    });

    it('should detect intersection of AABB whose bounds touch AABB', () => {
      const other = new Aabb(10, 10, 10, 20, 20, 20);
      expect(aabbCollisionDetection.aabbVsAabb(aabb, other)).toBe(true);
    });

    it('should not detect intersection of AABB outside of AABB', () => {
      const other = new Aabb(15, 15, 15, 30, 30, 30);
      expect(aabbCollisionDetection.aabbVsAabb(aabb, other)).toBe(false);
    });
  });

  describe('aabbVsObb', () => {
    it('should detect intersection of OBB contained in AABB', () => {
      const obb = testing.createObb(1, 1, 1, 0, 0, 0);
      expect(aabbCollisionDetection.aabbVsObb(aabb, obb)).toBe(true);
    });

    it('should detect intersection of OBB containing AABB', () => {
      const obb = testing.createObb(100, 100, 100, 0, 0, 0);
      expect(aabbCollisionDetection.aabbVsObb(aabb, obb)).toBe(true);
    });

    it('should detect intersection of OBB whose bounds overlap with AABB', () => {
      const obb = testing.createObb(10, 10, 10, 22, 0, 0);
      expect(aabbCollisionDetection.aabbVsObb(aabb, obb)).toBe(true);
    });

    it('should not detect intersection of OBB outside of AABB', () => {
      const obb = testing.createObb(10, 10, 10, 200, 0, 0);
      expect(aabbCollisionDetection.aabbVsObb(aabb, obb)).toBe(false);
    });
  });

  describe('aabbVsCapsule', () => {
    it('should detect intersection of capsule contained in AABB', () => {
      const capsule = testing.createCapsule(1, 1, 0, 0, 0);
      expect(aabbCollisionDetection.aabbVsCapsule(aabb, capsule)).toBe(true);
    });

    it('should detect intersection of capsule containing AABB', () => {
      const capsule = testing.createCapsule(50, 50, 0, 0, 0);
      expect(aabbCollisionDetection.aabbVsCapsule(aabb, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds overlap with AABB', () => {
      const capsule = testing.createCapsule(5, 5, 0, 5, 15);
      expect(aabbCollisionDetection.aabbVsCapsule(aabb, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds touch AABB', () => {
      const capsule = testing.createCapsule(5, 5, 0, 5, 20);
      expect(aabbCollisionDetection.aabbVsCapsule(aabb, capsule)).toBe(true);
    });

    it('should not detect intersection of capsule outside of AABB', () => {
      const capsule = testing.createCapsule(5, 5, 50, 50, 50);
      expect(aabbCollisionDetection.aabbVsCapsule(aabb, capsule)).toBe(false);
    });
  });
});
