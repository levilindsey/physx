import * as sphereCollisionDetection from '../src/sphere-collision-detection';
import {
  Aabb,
  Sphere,
} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

describe('sphere-collision-detection', () => {
  let sphere;

  beforeEach(() => {
    sphere = new Sphere(0, 0, 0, 10);
  });

  describe('sphereVsPoint', () => {
    it('should detect intersection of point in sphere', () => {
      const point = vec3.fromValues(1, 0, 0);
      expect(sphereCollisionDetection.sphereVsPoint(sphere, point)).toBe(true);
    });

    it('should detect intersection of point on edge of sphere', () => {
      const point = vec3.fromValues(10, 0, 0);
      expect(sphereCollisionDetection.sphereVsPoint(sphere, point)).toBe(true);
    });

    it('should not detect intersection of point outside sphere', () => {
      const point = vec3.fromValues(0, 1, 30);
      expect(sphereCollisionDetection.sphereVsPoint(sphere, point)).toBe(false);
    });
  });

  describe('sphereVsSphere', () => {
    it('should detect intersection of sphere contained in sphere', () => {
      const other = new Sphere(0, 0, 0, 1);
      expect(sphereCollisionDetection.sphereVsSphere(sphere, other)).toBe(true);
      expect(sphereCollisionDetection.sphereVsSphere(other, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds overlap with sphere', () => {
      const other = new Sphere(10, 10, -10, 10);
      expect(sphereCollisionDetection.sphereVsSphere(sphere, other)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds touch sphere', () => {
      const other = new Sphere(15, 0, 0, 5);
      expect(sphereCollisionDetection.sphereVsSphere(sphere, other)).toBe(true);
    });

    it('should not detect intersection of sphere outside of sphere', () => {
      const other = new Sphere(20, 0, 0, 5);
      expect(sphereCollisionDetection.sphereVsSphere(sphere, other)).toBe(false);
    });
  });

  describe('sphereVsAabb', () => {
    it('should detect intersection of AABB contained in sphere', () => {
      const aabb = new Aabb(-1, -1, -1, 1, 1, 1);
      expect(sphereCollisionDetection.sphereVsAabb(sphere, aabb)).toBe(true);
    });

    it('should detect intersection of AABB containing sphere', () => {
      const aabb = new Aabb(-100, -100, -100, 100, 100, 100);
      expect(sphereCollisionDetection.sphereVsAabb(sphere, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose bounds overlap with sphere', () => {
      const aabb = new Aabb(5, 5, 5, 15, 15, 15);
      expect(sphereCollisionDetection.sphereVsAabb(sphere, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose bounds touch sphere', () => {
      const aabb = new Aabb(10, 0, 0, 20, 10, 10);
      expect(sphereCollisionDetection.sphereVsAabb(sphere, aabb)).toBe(true);
    });

    it('should not detect intersection of AABB outside of sphere', () => {
      const aabb = new Aabb(15, 15, 15, 30, 30, 30);
      expect(sphereCollisionDetection.sphereVsAabb(sphere, aabb)).toBe(false);
    });
  });

  describe('sphereVsObb', () => {
    it('should detect intersection of OBB contained in sphere', () => {
      const obb = testing.createObb(1, 1, 1, 0, 0, 0);
      expect(sphereCollisionDetection.sphereVsObb(sphere, obb)).toBe(true);
    });
    
    it('should detect intersection of OBB containing sphere', () => {
      const obb = testing.createObb(100, 100, 100, 0, 0, 0);
      expect(sphereCollisionDetection.sphereVsObb(sphere, obb)).toBe(true);
    });

    it('should detect intersection of OBB whose bounds overlap with sphere', () => {
      const obb = testing.createObb(10, 10, 10, 15, 0, 0);
      expect(sphereCollisionDetection.sphereVsObb(sphere, obb)).toBe(true);
    });

    it('should not detect intersection of OBB outside of sphere', () => {
      const obb = testing.createObb(10, 10, 10, 200, 0, 0);
      expect(sphereCollisionDetection.sphereVsObb(sphere, obb)).toBe(false);
    });
  });

  describe('sphereVsCapsule', () => {
    it('should detect intersection of capsule contained in sphere', () => {
      const capsule = testing.createCapsule(1, 1, 0, 0, 0);
      expect(sphereCollisionDetection.sphereVsCapsule(sphere, capsule)).toBe(true);
    });
    
    it('should detect intersection of capsule containing sphere', () => {
      const capsule = testing.createCapsule(50, 50, 0, 0, 0);
      expect(sphereCollisionDetection.sphereVsCapsule(sphere, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds overlap with sphere', () => {
      const capsule = testing.createCapsule(5, 5, 0, 0, 15);
      expect(sphereCollisionDetection.sphereVsCapsule(sphere, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds touch sphere', () => {
      const capsule = testing.createCapsule(5, 5, 0, 0, 20);
      expect(sphereCollisionDetection.sphereVsCapsule(sphere, capsule)).toBe(true);
    });

    it('should not detect intersection of capsule outside of sphere', () => {
      const capsule = testing.createCapsule(5, 5, 50, 50, 50);
      expect(sphereCollisionDetection.sphereVsCapsule(sphere, capsule)).toBe(false);
    });
  });
});
