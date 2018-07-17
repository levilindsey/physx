import {Sphere} from '../index';

describe('sphere', () => {
  let sphere;

  beforeEach(() => {
    sphere = new Sphere(1, 2, 3, 4);
  });

  it('constructor', () => {
    expect(sphere.centerX).toEqual(1);
    expect(sphere.centerY).toEqual(2);
    expect(sphere.centerZ).toEqual(3);
    expect(sphere.radius).toEqual(4);
  });

  it('centerOfVolume', () => {
    expect(sphere.centerOfVolume).toEqual(vec3.fromValues(1, 2, 3));
  });

  it('centerOfVolume', () => {
    sphere.position = vec3.fromValues(4, 5, 6);
    expect(sphere.centerX).toEqual(4);
    expect(sphere.centerY).toEqual(5);
    expect(sphere.centerZ).toEqual(6);
  });
});
