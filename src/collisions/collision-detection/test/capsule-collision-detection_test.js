import * as capsuleCollisionDetection from '../src/capsule-collision-detection';
import {
  Aabb,
  Sphere,
} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

describe('capsule-collision-detection', () => {
  let capsule;

  beforeEach(() => {
    capsule = testing.createCapsule(10, 10, 0, 0, 0);
  });

  describe('capsuleVsPoint', () => {
    it('should detect intersection of point in capsule', () => {
      const point = vec3.fromValues(0, 0, 0);
      expect(capsuleCollisionDetection.capsuleVsPoint(capsule, point)).toBe(true);
    });

    it('should detect intersection of point on edge of capsule', () => {
      const point = vec3.fromValues(0, 0, -20);
      expect(capsuleCollisionDetection.capsuleVsPoint(capsule, point)).toBe(true);
    });

    it('should not detect intersection of point outside capsule', () => {
      const point = vec3.fromValues(0, 0, -21);
      expect(capsuleCollisionDetection.capsuleVsPoint(capsule, point)).toBe(false);
    });
  });

  describe('capsuleVsSphere', () => {
    it('should detect intersection of sphere contained in capsule', () => {
      const sphere = new Sphere(0, 0, 0, 1);
      expect(capsuleCollisionDetection.capsuleVsSphere(capsule, sphere)).toBe(true);
    });

    it('should detect intersection of sphere containing capsule', () => {
      const sphere = new Sphere(0, 0, 0, 30);
      expect(capsuleCollisionDetection.capsuleVsSphere(capsule, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds overlap with capsule', () => {
      const sphere = new Sphere(15, 0, 0, 10);
      expect(capsuleCollisionDetection.capsuleVsSphere(capsule, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds touch capsule', () => {
      const sphere = new Sphere(15, 0, 0, 5);
      expect(capsuleCollisionDetection.capsuleVsSphere(capsule, sphere)).toBe(true);
    });

    it('should not detect intersection of sphere outside of capsule', () => {
      const sphere = new Sphere(20, 0, 0, 5);
      expect(capsuleCollisionDetection.capsuleVsSphere(capsule, sphere)).toBe(false);
    });
  });

  describe('capsuleVsAabb', () => {
    it('should detect intersection of AABB contained in capsule', () => {
      const aabb = new Aabb(-1, -1, -1, 1, 1, 1);
      expect(capsuleCollisionDetection.capsuleVsAabb(capsule, aabb)).toBe(true);
    });

    it('should detect intersection of AABB containing capsule', () => {
      const aabb = new Aabb(-100, -100, -100, 100, 100, 100);
      expect(capsuleCollisionDetection.capsuleVsAabb(capsule, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose face overlaps with capsule', () => {
      const aabb = new Aabb(-70, -70, 18, 70, 70, 22);
      expect(capsuleCollisionDetection.capsuleVsAabb(capsule, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose vertex overlaps with capsule', () => {
      const aabb = new Aabb(1, 1, 1, 200, 200, 200);
      expect(capsuleCollisionDetection.capsuleVsAabb(capsule, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose bounds touch capsule', () => {
      let aabb = new Aabb(10, 0, 0, 20, 2, 2);
      expect(capsuleCollisionDetection.capsuleVsAabb(capsule, aabb)).toBe(true);
      aabb = new Aabb(-10, -10, 20, 20, 20, 40);
      expect(capsuleCollisionDetection.capsuleVsAabb(capsule, aabb)).toBe(true);
    });

    it('should not detect intersection of AABB outside of capsule', () => {
      const aabb = new Aabb(15, 15, 15, 30, 30, 30);
      expect(capsuleCollisionDetection.capsuleVsAabb(capsule, aabb)).toBe(false);
    });
  });

  describe('capsuleVsObb', () => {
    it('should detect intersection of OBB contained in capsule', () => {
      const obb = testing.createObb(1, 1, 1, 0, 0, 0);
      expect(capsuleCollisionDetection.capsuleVsObb(capsule, obb)).toBe(true);
    });
    
    it('should detect intersection of OBB containing capsule', () => {
      const obb = testing.createObb(100, 100, 100, 0, 0, 0);
      expect(capsuleCollisionDetection.capsuleVsObb(capsule, obb)).toBe(true);
    });

    it('should detect intersection of OBB whose bounds overlap with capsule', () => {
      const obb = testing.createObb(10, 10, 10, 0, 12, 0);
      expect(capsuleCollisionDetection.capsuleVsObb(capsule, obb)).toBe(true);
    });

    it('should not detect intersection of OBB outside of capsule', () => {
      const obb = testing.createObb(10, 10, 10, 200, 0, 0);
      expect(capsuleCollisionDetection.capsuleVsObb(capsule, obb)).toBe(false);
    });
  });

  describe('capsuleVsCapsule', () => {
    it('should detect intersection of capsule contained in capsule', () => {
      const other = testing.createCapsule(1, 1, 0, 0, 0);
      expect(capsuleCollisionDetection.capsuleVsCapsule(capsule, other)).toBe(true);
      expect(capsuleCollisionDetection.capsuleVsCapsule(other, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds overlap with capsule', () => {
      const other = testing.createCapsule(5, 15, 15, 15, 0);
      expect(capsuleCollisionDetection.capsuleVsCapsule(capsule, other)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds touch capsule', () => {
      const other = testing.createCapsule(10, 10, 0, 20, 0);
      expect(capsuleCollisionDetection.capsuleVsCapsule(capsule, other)).toBe(true);
    });

    it('should not detect intersection of capsule outside of capsule', () => {
      const other = testing.createCapsule(10, 10, 0, 21, 0);
      expect(capsuleCollisionDetection.capsuleVsCapsule(capsule, other)).toBe(false);
    });
  });
});
