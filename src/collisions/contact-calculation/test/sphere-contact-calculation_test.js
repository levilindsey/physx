import * as sphereContactCalculation from '../src/sphere-contact-calculation';
import {
  Aabb,
  Sphere,
} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

describe('sphere-contact-calculation', () => {
  let contactPoint;
  let contactNormal;
  let sphere;

  beforeEach(() => {
    contactPoint = vec3.create();
    contactNormal = vec3.create();
    sphere = new Sphere(0, 0, 0, 10);
  });

  describe('sphereVsPoint', () => {
    it('should calculate intersection of point in sphere', () => {
      const point = vec3.fromValues(2, 0, 0);
      const expectedContactPoint = vec3.fromValues(2, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      sphereContactCalculation.sphereVsPoint(contactPoint, contactNormal, sphere, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of point on edge of sphere', () => {
      const point = vec3.fromValues(10, 0, 0);
      const expectedContactPoint = vec3.fromValues(10, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      sphereContactCalculation.sphereVsPoint(contactPoint, contactNormal, sphere, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('sphereVsSphere', () => {
    it('should calculate intersection of sphere contained in sphere', () => {
      const other = new Sphere(0, 0, 1, 1);
      const expectedContactPoint = vec3.fromValues(0, 0, 10);
      const expectedNormal = vec3.fromValues(0, 0, 1);
      sphereContactCalculation.sphereVsSphere(contactPoint, contactNormal, sphere, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of sphere whose bounds overlap with sphere', () => {
      const other = new Sphere(0, 0, -15, 10);
      const expectedContactPoint = vec3.fromValues(0, 0, -10);
      const expectedNormal = vec3.fromValues(0, 0, -1);
      sphereContactCalculation.sphereVsSphere(contactPoint, contactNormal, sphere, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of sphere whose bounds touch sphere', () => {
      const other = new Sphere(15, 0, 0, 5);
      const expectedContactPoint = vec3.fromValues(10, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      sphereContactCalculation.sphereVsSphere(contactPoint, contactNormal, sphere, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('sphereVsAabb', () => {
    it('should calculate intersection of AABB contained in sphere', () => {
      const aabb = new Aabb(1, 1, 1, 2, 2, 2);
      const expectedContactPoint = vec3.fromValues(1, 1, 1);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, sphere, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB containing sphere', () => {
      const aabb = new Aabb(-100, -100, -100, 100, 100, 20);
      const expectedContactPoint = vec3.fromValues(0, 0, 20);
      const expectedNormal = vec3.fromValues(0, 0, -1);
      sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, sphere, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB whose bounds overlap with sphere', () => {
      const aabb = new Aabb(5, 5, 5, 15, 15, 15);
      const expectedContactPoint = vec3.fromValues(5, 5, 5);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, sphere, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB whose bounds overlap with sphere center', () => {
      const aabb = new Aabb(-1, -15, -15, 15, 15, 15);
      const expectedContactPoint = vec3.fromValues(-1, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, sphere, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB whose bounds touch sphere', () => {
      const aabb = new Aabb(10, 0, 0, 20, 10, 10);
      const expectedContactPoint = vec3.fromValues(10, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, sphere, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  // sphereVsObb is covered in obb-contact-calculation_test.js

  // sphereVsCapsule is covered in capsule-contact-calculation_test.js
});
