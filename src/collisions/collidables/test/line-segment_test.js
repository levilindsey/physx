import {LineSegment} from '../index';
import * as testing from '../../../util/testing/testing-utils';

describe('line-segment', () => {
  function createLineSegment(startX, startY, startZ, endX, endY, endZ) {
    const start = vec3.fromValues(startX, startY, startZ);
    const end = vec3.fromValues(endX, endY, endZ);
    return new LineSegment(start, end);
  }

  it('constructor', () => {
    const segment = createLineSegment(0, 1, 2, 3, 4, 5);
    const expectedStart = vec3.fromValues(0, 1, 2);
    const expectedEnd = vec3.fromValues(3, 4, 5);
    expect(segment.start).toEqual(expectedStart);
    expect(segment.end).toEqual(expectedEnd);
  });

  it('reset', () => {
    const segment = createLineSegment(0, 1, 2, 3, 4, 5);
    const newStart = vec3.fromValues(6, 7, 8);
    const newEnd = vec3.fromValues(9, 10, 11);
    segment.reset(newStart, newEnd);
    const expectedStart = vec3.fromValues(6, 7, 8);
    const expectedEnd = vec3.fromValues(9, 10, 11);
    expect(segment.start).toEqual(expectedStart);
    expect(segment.end).toEqual(expectedEnd);
  });

  it('clone', () => {
    const segment = createLineSegment(0, 1, 2, 3, 4, 5).clone();
    const expectedStart = vec3.fromValues(0, 1, 2);
    const expectedEnd = vec3.fromValues(3, 4, 5);
    expect(segment.start).toEqual(expectedStart);
    expect(segment.end).toEqual(expectedEnd);
  });

  it('get dir', () => {
    const segment = createLineSegment(0, 1, 2, 3, 4, 5);
    const expected = vec3.fromValues(3, 3, 3);
    expect(segment.dir).toEqual(expected);
  });

  it('get center', () => {
    const segment = createLineSegment(0, 1, 2, 3, 4, 5);
    const expected = vec3.fromValues(1.5, 2.5, 3.5);
    expect(segment.center).toEqual(expected);
  });

  it('set center', () => {
    const segment = createLineSegment(0, 1, 2, 3, 4, 5);
    segment.center = vec3.fromValues(3.5, 4.5, 5.5);
    const expectedStart = vec3.fromValues(2, 3, 4);
    const expectedEnd = vec3.fromValues(5, 6, 7);
    testing.checkSegment(segment, expectedStart, expectedEnd);
  });

  it('set orientation', () => {
    const segment = createLineSegment(0, 0, 1, 0, 0, 5);
    const orientation = quat.create();
    quat.rotateX(orientation, orientation, Math.PI / 2);
    segment.orientation = orientation;
    const expectedStart = vec3.fromValues(0, 2, 3);
    const expectedEnd = vec3.fromValues(0, -2, 3);
    testing.checkSegment(segment, expectedStart, expectedEnd);
  });

  it('set orientation, reset, set orientation, set position, set orientation', () => {
    const segment = createLineSegment(0, 0, 1, 0, 0, 5);

    // Set orientation.

    let orientation = quat.create();
    quat.rotateX(orientation, orientation, Math.PI / 2);
    segment.orientation = orientation;

    let expectedStart = vec3.fromValues(0, 2, 3);
    let expectedEnd = vec3.fromValues(0, -2, 3);
    testing.checkSegment(segment, expectedStart, expectedEnd);

    // Reset.

    const newStart = vec3.fromValues(10, 0, 0);
    const newEnd = vec3.fromValues(30, 0, 0);
    segment.reset(newStart, newEnd);

    expectedStart = vec3.fromValues(10, 0, 0);
    expectedEnd = vec3.fromValues(30, 0, 0);
    testing.checkSegment(segment, expectedStart, expectedEnd);

    // Set orientation.

    orientation = quat.create();
    quat.rotateZ(orientation, orientation, Math.PI / 2);
    segment.orientation = orientation;

    expectedStart = vec3.fromValues(20, -10, 0);
    expectedEnd = vec3.fromValues(20, 10, 0);
    testing.checkSegment(segment, expectedStart, expectedEnd);

    // Set position.

    segment.center = vec3.fromValues(50, 0, 0);

    expectedStart = vec3.fromValues(50, -10, 0);
    expectedEnd = vec3.fromValues(50, 10, 0);
    testing.checkSegment(segment, expectedStart, expectedEnd);

    // Set orientation.

    orientation = quat.create();
    quat.rotateY(orientation, orientation, Math.PI / 2);
    segment.orientation = orientation;

    expectedStart = vec3.fromValues(50, 0, 10);
    expectedEnd = vec3.fromValues(50, 0, -10);
    testing.checkSegment(segment, expectedStart, expectedEnd);
  });
});
