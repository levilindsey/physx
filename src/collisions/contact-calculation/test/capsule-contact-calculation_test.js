import * as capsuleContactCalculation from '../src/capsule-contact-calculation';
import {
  Aabb,
  Sphere,
} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

describe('capsule-contact-calculation', () => {
  let contactPoint;
  let contactNormal;
  let capsule;

  beforeEach(() => {
    contactPoint = vec3.create();
    contactNormal = vec3.create();
    capsule = testing.createCapsule(10, 10, 0, 0, 0);
  });

  describe('capsuleVsPoint', () => {
    it('should calculate intersection of point in capsule', () => {
      const point = vec3.fromValues(0, 2, 4);
      const expectedContactPoint = vec3.fromValues(0, 2, 4);
      const expectedNormal = vec3.fromValues(0, 1, 0);
      capsuleContactCalculation.capsuleVsPoint(contactPoint, contactNormal, capsule, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of point on edge of capsule', () => {
      const point = vec3.fromValues(0, 0, -20);
      const expectedContactPoint = vec3.fromValues(0, 0, -20);
      const expectedNormal = vec3.fromValues(0, 0, -1);
      capsuleContactCalculation.capsuleVsPoint(contactPoint, contactNormal, capsule, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('capsuleVsSphere', () => {
    it('should calculate intersection of sphere contained in capsule', () => {
      const sphere = new Sphere(0, 1, 0, 1);
      const expectedContactPoint = vec3.fromValues(0, 10, 0);
      const expectedNormal = vec3.fromValues(0, 1, 0);
      capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, capsule, sphere);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of sphere containing capsule', () => {
      const sphere = new Sphere(0, 0, 21, 100);
      const expectedContactPoint = vec3.fromValues(0, 0, 20);
      const expectedNormal = vec3.fromValues(0, 0, 1);
      capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, capsule, sphere);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of sphere whose bounds overlap with capsule', () => {
      const sphere = new Sphere(15, 0, 0, 10);
      const expectedContactPoint = vec3.fromValues(10, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, capsule, sphere);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of sphere whose bounds touch capsule', () => {
      const sphere = new Sphere(15, 0, 0, 5);
      const expectedContactPoint = vec3.fromValues(10, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, capsule, sphere);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('capsuleVsAabb', () => {
    // TODO: Add this test. May need to also update collision detection or contact calculation logic
    // to support this. An easy extra step to support inclusion is to check if the center point of
    // one shape lies within the other shape.
    // it('should calculate intersection of AABB contained in capsule', () => {});
    // it('should calculate intersection of AABB containing capsule', () => {});

    it('should calculate intersection of AABB whose bounds overlap with capsule', () => {
      const aabb = new Aabb(0, 5, 5, 15, 15, 15);
      const expectedContactPoint = vec3.fromValues(0, 10, 10);
      const expectedNormal = vec3.fromValues(0, 1, 0);
      capsuleContactCalculation.capsuleVsAabb(contactPoint, contactNormal, capsule, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB whose bounds touch capsule', () => {
      const aabb = new Aabb(10, 0, 0, 20, 2, 2);
      const expectedContactPoint = vec3.fromValues(10, 0, 0);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      capsuleContactCalculation.capsuleVsAabb(contactPoint, contactNormal, capsule, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('capsuleVsCapsule', () => {
    // TODO: Add this test. May need to also update collision detection or contact calculation logic
    // to support this. An easy extra step to support inclusion is to check if the center point of
    // one shape lies within the other shape.
    it('should calculate intersection of capsule contained in capsule', () => {
      // const other = testing.createCapsule(1, 1, 0, 0, 0);
      // const expectedContactPoint = vec3.fromValues(0, 10, 5);
      // const expectedNormal = vec3.fromValues(0, 1, 0);
      //
      // capsuleContactCalculation.capsuleVsCapsule(contactPoint, contactNormal, capsule, other);
      //
      // testing.checkVec3(contactPoint, expectedContactPoint);
      // testing.checkVec3(contactNormal, expectedNormal);
      //
      // expectedContactPoint = vec3.fromValues(0, 10, 5);
      // expectedNormal = vec3.fromValues(0, 1, 0);
      //
      // capsuleContactCalculation.capsuleVsCapsule(contactPoint, contactNormal, other, capsule);
      //
      // testing.checkVec3(contactPoint, expectedContactPoint);
      // testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of capsule whose bounds overlap with capsule', () => {
      const other = testing.createCapsule(5, 5, 0, 0, 16);
      const expectedContactPoint = vec3.fromValues(0, 0, 20);
      const expectedNormal = vec3.fromValues(0, 0, 1);
      capsuleContactCalculation.capsuleVsCapsule(contactPoint, contactNormal, capsule, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of capsule whose bounds touch capsule', () => {
      const other = testing.createCapsule(10, 10, 0, 0, 40);
      const expectedContactPoint = vec3.fromValues(0, 0, 20);
      const expectedNormal = vec3.fromValues(0, 0, 1);
      capsuleContactCalculation.capsuleVsCapsule(contactPoint, contactNormal, capsule, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  // capsuleVsObb is covered in obb-contact-calculation_test.js
});
