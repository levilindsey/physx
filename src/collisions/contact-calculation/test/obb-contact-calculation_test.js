import * as obbContactCalculation from '../src/obb-contact-calculation';
import {
  Aabb,
  Sphere,
} from '../../collidables';
import * as testing from '../../../util/testing/testing-utils';

describe('obb-contact-calculation', () => {
  let contactPoint;
  let contactNormal;
  let obb;
  let orientation;

  const maxYVertex = vec3.fromValues(-2.928931713104248, 17.07106590270996, 0);

  let positiveXAxis;
  let positiveYAxis;
  let positiveZAxis;
  let negativeXAxis;
  let negativeYAxis;
  let negativeZAxis;

  function updateAxes() {
    positiveXAxis = vec3.fromValues(1, 0, 0);
    vec3.transformQuat(positiveXAxis, positiveXAxis, orientation);
    positiveYAxis = vec3.fromValues(0, 1, 0);
    vec3.transformQuat(positiveYAxis, positiveYAxis, orientation);
    positiveZAxis = vec3.fromValues(0, 0, 1);
    vec3.transformQuat(positiveZAxis, positiveZAxis, orientation);
    negativeXAxis = vec3.fromValues(-1, 0, 0);
    vec3.transformQuat(negativeXAxis, negativeXAxis, orientation);
    negativeYAxis = vec3.fromValues(0, -1, 0);
    vec3.transformQuat(negativeYAxis, negativeYAxis, orientation);
    negativeZAxis = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(negativeZAxis, negativeZAxis, orientation);
  }

  function configureObbAsAlmostAxiallyAligned() {
    obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
    orientation = quat.create();
    quat.rotateZ(orientation, orientation, Math.PI / 60);
    quat.rotateX(orientation, orientation, Math.PI / 60);
    obb.orientation = orientation;
    updateAxes();
  }

  function configureObbAsAxiallyAligned() {
    obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
    orientation = quat.create();
    updateAxes();
  }

  function configureObbAsVeryRotated() {
    obb = testing.createObb(10, 10, 10, 0, 0, 0, false);
    orientation = quat.create();
    quat.rotateZ(orientation, orientation, Math.PI / 4);
    quat.rotateX(orientation, orientation, Math.PI / 4);
    obb.orientation = orientation;
    updateAxes();
  }

  /**
   * @param {Collidable} collidable
   * @param {vec3} [expectedContactPoint]
   * @param {vec3} [expectedNormal]
   */
  function updatePositionAndOrientationToMatchObb(collidable, expectedContactPoint,
                                                  expectedNormal) {
    if (collidable) {
      const position = collidable.centerOfVolume;
      vec3.transformQuat(position, position, orientation);
      collidable.position = position;
      collidable.orientation = orientation;
    }

    if (expectedContactPoint) {
      vec3.transformQuat(expectedContactPoint, expectedContactPoint, orientation);
      if (expectedNormal) {
        vec3.transformQuat(expectedNormal, expectedNormal, orientation);
        vec3.normalize(expectedNormal, expectedNormal);
      }
    }
  }

  beforeEach(() => {
    contactPoint = vec3.create();
    contactNormal = vec3.create();
    configureObbAsAlmostAxiallyAligned();
  });

  describe('obbVsPoint', () => {
    it('should calculate intersection of point in OBB', () => {
      const point = vec3.fromValues(0, 0, 28);
      const expectedContactPoint = vec3.fromValues(0, 0, 28);
      const expectedNormal = positiveZAxis;
      obbContactCalculation.obbVsPoint(contactPoint, contactNormal, obb, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of point on edge of OBB', () => {
      obb = testing.createObb(10, 20, 30, 0, 0, 0, false);
      const point = vec3.fromValues(10, -20, 30);
      const expectedContactPoint = vec3.fromValues(10, -20, 30);
      const expectedNormal = vec3.fromValues(1, 0, 0);
      obbContactCalculation.obbVsPoint(contactPoint, contactNormal, obb, point);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('obbVsSphere', () => {
    it('should calculate intersection of sphere whose bounds overlap with OBB face', () => {
      const sphere = new Sphere(11, 0, 0, 2);
      const expectedContactPoint = vec3.fromValues(10, 0, 0);
      const expectedNormal = positiveXAxis;
      updatePositionAndOrientationToMatchObb(sphere, expectedContactPoint);
      obbContactCalculation.obbVsSphere(contactPoint, contactNormal, obb, sphere);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of sphere whose bounds overlap with OBB vertex', () => {
      const sphere = new Sphere(12, -22, 32, 4);
      const expectedContactPoint = vec3.fromValues(10, -20, 30);
      const expectedNormal = vec3.fromValues(1, -1, 1);
      updatePositionAndOrientationToMatchObb(sphere, expectedContactPoint, expectedNormal);
      obbContactCalculation.obbVsSphere(contactPoint, contactNormal, obb, sphere);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('obbVsAabb', () => {
    it('should calculate intersection of AABB whose vertex penetrates OBB face', () => {
      configureObbAsVeryRotated();
      const aabb = new Aabb(maxYVertex[0] + 0.05, 14, maxYVertex[2] + 0.05, 15, 25, 15);
      const expectedContactPoint = vec3.fromValues(maxYVertex[0] + 0.05, 14, maxYVertex[2] + 0.05);
      const expectedNormal1 = positiveXAxis;
      const expectedNormal2 = positiveYAxis;
      const expectedNormal3 = positiveZAxis;
      obbContactCalculation.obbVsAabb(contactPoint, contactNormal, obb, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal1, expectedNormal2, expectedNormal3);
    });

    it('should calculate intersection of AABB whose face is penetrated by OBB vertex', () => {
      configureObbAsVeryRotated();
      const aabb = new Aabb(-8, 14, -8, 8, 200, 8);
      const expectedContactPoint = maxYVertex;
      const expectedNormal = vec3.fromValues(0, 1, 0);
      obbContactCalculation.obbVsAabb(contactPoint, contactNormal, obb, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of AABB whose vertex penetrates OBB vertex', () => {
      const aabb = new Aabb(8, 18, 28, 50, 50, 50);
      const expectedContactPoint = vec3.fromValues(10, 20, 30);
      const expectedNormal1 = vec3.fromValues(1, 0, 0);
      const expectedNormal2 = vec3.fromValues(0, 1, 0);
      const expectedNormal3 = vec3.fromValues(0, 0, 1);
      updatePositionAndOrientationToMatchObb(null, expectedContactPoint);
      obbContactCalculation.obbVsAabb(contactPoint, contactNormal, obb, aabb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal1, expectedNormal2, expectedNormal3);
    });

    it('should calculate intersection of AABB whose edge penetrates OBB edge', () => {
      configureObbAsVeryRotated();
      const aabb = new Aabb(-40, maxYVertex[1] - 4, -20, maxYVertex[0] - 0.05, 25, 20);
      const expectedNormal1 = positiveYAxis;
      const expectedNormal2 = negativeZAxis;
      obbContactCalculation.obbVsAabb(contactPoint, contactNormal, obb, aabb);
      expect(contactPoint[0]).toBeCloseTo(maxYVertex[0] - 0.05, 5);
      expect(contactPoint[1]).toBeCloseTo(maxYVertex[1] - 4, 5);
      expect(contactPoint[2]).toBeCloseTo(2.79307222, 5);
      testing.checkVec3(contactNormal, expectedNormal1, expectedNormal2);
    });
  });

  describe('obbVsObb', () => {
    // TODO: Add this test. May need to also update collision detection or contact calculation logic
    // to support this. An easy extra step to support inclusion is to check if the center point of
    // one shape lies within the other shape.
    // it('should calculate intersection of OBB contained in OBB', () => {});

    it('should calculate intersection of OBB whose vertex penetrates OBB face', () => {
      configureObbAsVeryRotated();
      const other = testing.createObb(10, 10, 10, maxYVertex[0], maxYVertex[1] + 9, maxYVertex[2],
          false);
      const expectedContactPoint = maxYVertex;
      const expectedNormal = vec3.fromValues(0, 1, 0);

      obbContactCalculation.obbVsObb(contactPoint, contactNormal, obb, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);

      vec3.negate(expectedNormal, expectedNormal);

      obbContactCalculation.obbVsObb(contactPoint, contactNormal, other, obb);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of OBB whose vertex penetrates OBB vertex', () => {
      const other = testing.createObb(40, 40, 40, 48, 58, 68, false);
      const expectedContactPoint = vec3.fromValues(10, 20, 30);
      const expectedNormal1 = vec3.fromValues(1, 0, 0);
      const expectedNormal2 = vec3.fromValues(0, 1, 0);
      const expectedNormal3 = vec3.fromValues(0, 0, 1);
      updatePositionAndOrientationToMatchObb(null, expectedContactPoint);
      obbContactCalculation.obbVsObb(contactPoint, contactNormal, obb, other);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal1, expectedNormal2, expectedNormal3);
    });

    it('should calculate intersection of OBB whose edge penetrates OBB edge', () => {
      configureObbAsVeryRotated();
      const other = testing.createObb(40, 40, 40, maxYVertex[0] - 40.05, maxYVertex[1] + 36, 0,
          false);
      const expectedNormal1 = positiveYAxis;
      const expectedNormal2 = negativeZAxis;
      obbContactCalculation.obbVsObb(contactPoint, contactNormal, obb, other);
      expect(contactPoint[0]).toBeCloseTo(maxYVertex[0] - 0.05, 5);
      expect(contactPoint[1]).toBeCloseTo(maxYVertex[1] - 4, 5);
      expect(contactPoint[2]).toBeCloseTo(2.79307222, 5);
      testing.checkVec3(contactNormal, expectedNormal1, expectedNormal2);
    });
  });

  describe('obbVsCapsule', () => {
    beforeEach(() => {
      // TODO: For some reason, the capsule contact calculations aren't working when we rotate the
      // BB...
      configureObbAsAxiallyAligned();
    });

    // TODO: Add this test. May need to also update collision detection or contact calculation logic
    // to support this. An easy extra step to support inclusion is to check if the center point of
    // one shape lies within the other shape.
    // it('should calculate intersection of capsule contained in OBB', () => {});
    // it('should calculate intersection of capsule containing OBB', () => {});

    it('should calculate intersection of capsule whose bounds overlap with OBB face', () => {
      const capsule = testing.createCapsule(5, 1, 0, 0, 36);
      const expectedContactPoint = vec3.fromValues(0, 0, 30);
      const expectedNormal = positiveZAxis;
      updatePositionAndOrientationToMatchObb(capsule, expectedContactPoint);
      obbContactCalculation.obbVsCapsule(contactPoint, contactNormal, obb, capsule);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });

    it('should calculate intersection of capsule whose bounds overlap with OBB vertex', () => {
      const capsule = testing.createCapsule(2, 3, 10.5, 20.5, 32.5);
      const expectedContactPoint = vec3.fromValues(10, 20, 30);
      const expectedNormal = vec3.fromValues(1, 1, 1);
      updatePositionAndOrientationToMatchObb(capsule, expectedContactPoint, expectedNormal);
      obbContactCalculation.obbVsCapsule(contactPoint, contactNormal, obb, capsule);
      testing.checkVec3(contactPoint, expectedContactPoint);
      testing.checkVec3(contactNormal, expectedNormal);
    });
  });

  describe('findObbNormalFromContactPoint', () => {
    it('should handle a point along the positive x-axis', () => {
      const point = vec3.fromValues(9, -18, 27);
      vec3.transformQuat(point, point, orientation);
      obbContactCalculation.findObbNormalFromContactPoint(contactNormal, point, obb);
      testing.checkVec3(contactNormal, positiveXAxis);
    });

    it('should handle a point along the positive y-axis', () => {
      const point = vec3.fromValues(8, 19, 27);
      vec3.transformQuat(point, point, orientation);
      obbContactCalculation.findObbNormalFromContactPoint(contactNormal, point, obb);
      testing.checkVec3(contactNormal, positiveYAxis);
    });

    it('should handle a point along the positive z-axis', () => {
      const point = vec3.fromValues(2, 12, 28);
      vec3.transformQuat(point, point, orientation);
      obbContactCalculation.findObbNormalFromContactPoint(contactNormal, point, obb);
      testing.checkVec3(contactNormal, positiveZAxis);
    });

    it('should handle a point along a negative axis', () => {
      const point = vec3.fromValues(-1, 1, 1);
      vec3.transformQuat(point, point, orientation);
      obbContactCalculation.findObbNormalFromContactPoint(contactNormal, point, obb);
      testing.checkVec3(contactNormal, negativeXAxis);
    });

    it('should handle a point on a vertex', () => {
      const point = vec3.fromValues(10, 20, 30);
      vec3.transformQuat(point, point, orientation);
      obbContactCalculation.findObbNormalFromContactPoint(contactNormal, point, obb);
      testing.checkVec3(contactNormal, positiveXAxis, positiveYAxis, positiveZAxis);
    });
  });
});
