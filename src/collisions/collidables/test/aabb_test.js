import {Aabb, LineSegment} from '../index';
import * as testing from '../../../util/testing/testing-utils';

describe('aabb', () => {
  let aabb;

  beforeEach(() => {
    aabb = new Aabb(-10, -20, -30, 10, 0, 30);
  });

  it('constructor', () => {
    expect(aabb.minX).toEqual(-10);
    expect(aabb.minY).toEqual(-20);
    expect(aabb.minZ).toEqual(-30);
    expect(aabb.maxX).toEqual(10);
    expect(aabb.maxY).toEqual(0);
    expect(aabb.maxZ).toEqual(30);
  });

  it('createAsUniformAroundCenter', () => {
    const center = vec3.fromValues(20, 30, 40);
    const aabb = Aabb.createAsUniformAroundCenter(center, 5);
    expect(aabb.minX).toEqual(15);
    expect(aabb.minY).toEqual(25);
    expect(aabb.minZ).toEqual(35);
    expect(aabb.maxX).toEqual(25);
    expect(aabb.maxY).toEqual(35);
    expect(aabb.maxZ).toEqual(45);
  });

  it('createAsUniformAroundCenter', () => {
    const center = vec3.fromValues(20, 30, 40);
    aabb.setAsUniformAroundCenter(center, 5);
    expect(aabb.minX).toEqual(15);
    expect(aabb.minY).toEqual(25);
    expect(aabb.minZ).toEqual(35);
    expect(aabb.maxX).toEqual(25);
    expect(aabb.maxY).toEqual(35);
    expect(aabb.maxZ).toEqual(45);
  });

  it('rangeX', () => {
    expect(aabb.rangeX).toEqual(20);
  });

  it('rangeY', () => {
    expect(aabb.rangeY).toEqual(20);
  });

  it('rangeZ', () => {
    expect(aabb.rangeZ).toEqual(60);
  });

  it('centerX', () => {
    expect(aabb.centerX).toEqual(0);
  });

  it('centerY', () => {
    expect(aabb.centerY).toEqual(-10);
  });

  it('centerZ', () => {
    expect(aabb.centerZ).toEqual(0);
  });

  it('centerOfVolume', () => {
    const expected = vec3.fromValues(0, -10, 0);
    expect(aabb.centerOfVolume).toEqual(expected);
  });

  it('set position', () => {
    aabb.position = vec3.fromValues(20, 30, 40);
    expect(aabb.minX).toEqual(10);
    expect(aabb.minY).toEqual(20);
    expect(aabb.minZ).toEqual(10);
    expect(aabb.maxX).toEqual(30);
    expect(aabb.maxY).toEqual(40);
    expect(aabb.maxZ).toEqual(70);
  });

  describe('iterators', () => {
    const expectedVertices = [
      vec3.fromValues(-10, -20, -30),
      vec3.fromValues(10, -20, -30),
      vec3.fromValues(10, 0, -30),
      vec3.fromValues(-10, 0, -30),
      vec3.fromValues(-10, -20, 30),
      vec3.fromValues(10, -20, 30),
      vec3.fromValues(10, 0, 30),
      vec3.fromValues(-10, 0, 30),
    ];

    it('someVertex', () => {
      // Check the vertices.
      const vertices = [];
      aabb.someVertex(vertex => {
        vertices.push(vec3.clone(vertex));
        return false;
      });
      testing.checkUnsortedPoints(vertices, expectedVertices);

      // Check that it stops when the callback returns true.
      let count = 0;
      aabb.someVertex(() => {
        count++;
        return true;
      });
      expect(count).toEqual(1);
    });

    it('someEdge', () => {
      const expectedEdges = [
        // Front-face edges.
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        // Back-face edges.
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        // Front-to-back edges.
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ].map(pair => new LineSegment(expectedVertices[pair[0]], expectedVertices[pair[1]]));

      // Check the edges.
      const edges = [];
      aabb.someEdge(edge => {
        edges.push(edge.clone());
        return false;
      });
      testing.checkUnsortedEdges(edges, expectedEdges);

      // Check that it stops when the callback returns true.
      let count = 0;
      aabb.someEdge(() => {
        count++;
        return true;
      });
      expect(count).toEqual(1);
    });
  });
});
