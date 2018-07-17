import {Capsule} from '../index';
import * as testing from '../../../util/testing/testing-utils';

describe('capsule', () => {
  let capsule;

  beforeEach(() => {
    capsule = new Capsule(10, 5);
  });

  it('constructor', () => {
    expect(capsule.segment.start[0]).toEqual(0);
    expect(capsule.segment.start[1]).toEqual(0);
    expect(capsule.segment.start[2]).toEqual(-10);
    expect(capsule.segment.end[0]).toEqual(0);
    expect(capsule.segment.end[1]).toEqual(0);
    expect(capsule.segment.end[2]).toEqual(10);
    expect(capsule.radius).toEqual(5);
  });

  it('centerOfVolume', () => {
    expect(capsule.centerOfVolume).toEqual(vec3.fromValues(0, 0, 0));
  });

  it('set position', () => {
    capsule.position = vec3.fromValues(4, 5, 6);
    const expectedStart = vec3.fromValues(4, 5, -4);
    const expectedEnd = vec3.fromValues(4, 5, 16);
    testing.checkSegment(capsule.segment, expectedStart, expectedEnd);
  });

  it('set orientation', () => {
    const orientation = quat.create();
    quat.rotateY(orientation, orientation, Math.PI / 2);
    capsule.orientation = orientation;
    const expectedStart = vec3.fromValues(-10, 0, 0);
    const expectedEnd = vec3.fromValues(10, 0, 0);
    testing.checkSegment(capsule.segment, expectedStart, expectedEnd);
  });
});
