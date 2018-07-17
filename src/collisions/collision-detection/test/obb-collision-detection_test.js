import * as obbCollisionDetection from '../src/obb-collision-detection';
import {
  Aabb,
  Sphere,
} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

describe('obb-collision-detection', () => {
  let obb;

  const maxYVertex = vec3.fromValues(-2.928931713104248, 17.07106590270996, 0);

  function configureObbAsAlmostAxiallyAligned() {
    obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
    const orientation = quat.create();
    quat.rotateZ(orientation, orientation, Math.PI / 60);
    quat.rotateX(orientation, orientation, Math.PI / 60);
    obb.orientation = orientation;
  }

  function configureObbAsVeryRotated() {
    obb = testing.createObb(10, 10, 10, 0, 0, 0, false);
    const orientation = quat.create();
    quat.rotateZ(orientation, orientation, Math.PI / 4);
    quat.rotateX(orientation, orientation, Math.PI / 4);
    obb.orientation = orientation;
  }

  beforeEach(() => {
    configureObbAsAlmostAxiallyAligned();
  });

  describe('obbVsPoint', () => {
    it('should detect intersection of point in OBB', () => {
      const point = vec3.fromValues(0, 0, 0);
      expect(obbCollisionDetection.obbVsPoint(obb, point)).toBe(true);
    });

    it('should detect intersection of point on edge of OBB', () => {
      obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
      const point = vec3.fromValues(10, -20, 30);
      expect(obbCollisionDetection.obbVsPoint(obb, point)).toBe(true);
    });

    it('should not detect intersection of point outside OBB', () => {
      const point = vec3.fromValues(0, 0, 40);
      expect(obbCollisionDetection.obbVsPoint(obb, point)).toBe(false);
    });
  });

  describe('obbVsSphere', () => {
    it('should detect intersection of sphere contained in OBB', () => {
      const sphere = new Sphere(0, 0, 0, 1);
      expect(obbCollisionDetection.obbVsSphere(obb, sphere)).toBe(true);
    });

    it('should detect intersection of sphere containing OBB', () => {
      const sphere = new Sphere(0, 0, 0, 100);
      expect(obbCollisionDetection.obbVsSphere(obb, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds overlap with OBB face', () => {
      const sphere = new Sphere(11, 0, 0, 4);
      expect(obbCollisionDetection.obbVsSphere(obb, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds overlap with OBB vertex', () => {
      const sphere = new Sphere(12, -22, 32, 4);
      expect(obbCollisionDetection.obbVsSphere(obb, sphere)).toBe(true);
    });

    it('should detect intersection of sphere whose bounds touch OBB', () => {
      obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
      const sphere = new Sphere(15, 0, 0, 5);
      expect(obbCollisionDetection.obbVsSphere(obb, sphere)).toBe(true);
    });

    it('should not detect intersection of sphere outside of OBB', () => {
      const sphere = new Sphere(25, 0, 0, 5);
      expect(obbCollisionDetection.obbVsSphere(obb, sphere)).toBe(false);
    });
  });

  describe('obbVsAabb', () => {
    it('should detect intersection of AABB contained in OBB', () => {
      const aabb = new Aabb(-1, -1, -1, 1, 1, 1);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb)).toBe(true);
    });

    it('should detect intersection of AABB containing OBB', () => {
      const aabb = new Aabb(-100, -100, -100, 100, 100, 100);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose vertex penetrates OBB face', () => {
      configureObbAsVeryRotated();
      const aabb = new Aabb(maxYVertex[0] + 0.05, 14, maxYVertex[2] + 0.05, 15, 25, 15);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose face is penetrated by OBB vertex', () => {
      configureObbAsVeryRotated();
      const aabb = new Aabb(-8, 14, -8, 8, 20, 8);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb)).toBe(true);
    });

    it('should detect intersection of AABB whose vertex penetrates OBB vertex', () => {
      const aabb = new Aabb(9, 19, 29, 50, 50, 50);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb)).toBe(true);
    });

    it('should calculate intersection of AABB whose edge penetrates OBB edge', () => {
      configureObbAsVeryRotated();
      const aabb = new Aabb(-40, maxYVertex[1] - 4, -20, maxYVertex[0] - 0.05, 25, 20);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb), true);
    });

    it('should detect intersection of AABB whose bounds touch OBB', () => {
      obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
      const aabb = new Aabb(10, 10, 10, 20, 20, 20);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb)).toBe(true);
    });

    it('should not detect intersection of AABB outside of OBB', () => {
      const aabb = new Aabb(15, 15, 15, 30, 30, 30);
      expect(obbCollisionDetection.obbVsAabb(obb, aabb)).toBe(false);
    });
  });

  describe('obbVsObb', () => {
    it('should detect intersection of OBB contained in OBB', () => {
      const other = testing.createObb(1, 1, 1, 0, 0, 0);
      expect(obbCollisionDetection.obbVsObb(obb, other)).toBe(true);
      expect(obbCollisionDetection.obbVsObb(other, obb)).toBe(true);
    });

    it('should detect intersection of OBB whose vertex penetrates OBB face', () => {
      configureObbAsVeryRotated();
      const other = testing.createObb(10, 10, 10, maxYVertex[0] + 11, 24, maxYVertex[2] + 11, false);
      expect(obbCollisionDetection.obbVsObb(obb, other)).toBe(true);
    });

    it('should detect intersection of OBB whose vertex penetrates OBB vertex', () => {
      const other = testing.createObb(10, 10, 10, 18, 28, 38, false);
      expect(obbCollisionDetection.obbVsObb(obb, other)).toBe(true);
    });

    it('should calculate intersection of OBB whose edge penetrates OBB edge', () => {
      configureObbAsVeryRotated();
      const other = testing.createObb(40, 40, 40, maxYVertex[0] - 40.05, maxYVertex[1] + 36, 0,
          false);
      expect(obbCollisionDetection.obbVsObb(obb, other), true);
    });

    it('should not detect intersection of OBB outside of OBB', () => {
      const other = testing.createObb(10, 10, 10, 200, 0, 0);
      expect(obbCollisionDetection.obbVsObb(obb, other)).toBe(false);
    });
  });

  describe('obbVsCapsule', () => {
    it('should detect intersection of capsule contained in OBB', () => {
      const capsule = testing.createCapsule(1, 1, 0, 0, 0);
      expect(obbCollisionDetection.obbVsCapsule(obb, capsule)).toBe(true);
    });
    
    it('should detect intersection of capsule containing OBB', () => {
      const capsule = testing.createCapsule(100, 100, 0, 0, 0);
      expect(obbCollisionDetection.obbVsCapsule(obb, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds overlap with OBB face', () => {
      const capsule = testing.createCapsule(5, 5, 0, 0, 35);
      expect(obbCollisionDetection.obbVsCapsule(obb, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds overlap with OBB vertex', () => {
      configureObbAsVeryRotated();
      const capsule = testing.createCapsule(2, 2, maxYVertex[0], maxYVertex[1], maxYVertex[4]);
      expect(obbCollisionDetection.obbVsCapsule(obb, capsule)).toBe(true);
    });

    it('should detect intersection of capsule whose bounds touch OBB', () => {
      obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
      const capsule = testing.createCapsule(5, 5, 0, 5, 40);
      expect(obbCollisionDetection.obbVsCapsule(obb, capsule)).toBe(true);
    });

    it('should not detect intersection of capsule outside of OBB', () => {
      const capsule = testing.createCapsule(5, 5, 50, 50, 50);
      expect(obbCollisionDetection.obbVsCapsule(obb, capsule)).toBe(false);
    });
  });
});
