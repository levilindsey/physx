import {
  LineSegment,
  Obb,
  Sphere
} from '../index';
import * as testing from '../../../util/testing/testing-utils';

describe('obb', () => {
  let obb;

  beforeEach(() => {
    obb = new Obb(1, 2, 3);
  });

  it('constructor', () => {
    expect(obb.halfSideLengthX).toEqual(1);
    expect(obb.halfSideLengthY).toEqual(2);
    expect(obb.halfSideLengthZ).toEqual(3);
    [
      vec3.fromValues(1, 0, 0),
      vec3.fromValues(0, 2, 0),
      vec3.fromValues(0, 0, 3),
    ].forEach((expectedExtent, i) => testing.checkVec3(obb.extents[i], expectedExtent));
  });

  it('centerOfVolume', () => {
    expect(obb.centerOfVolume).toEqual(vec3.fromValues(0, 0, 0));
  });

  it('boundingVolume', () => {
    const boundingVolume = obb.boundingVolume;
    expect(boundingVolume instanceof Sphere).toBe(true);
    expect(boundingVolume.radius).toBeCloseTo(vec3.length(vec3.fromValues(1, 2, 3)), 6);
  });

  it('setting orientation should update extents', () => {
    const orientation = quat.create();
    quat.rotateX(orientation, orientation, Math.PI / 2);
    obb.orientation = orientation;
    [
      vec3.fromValues(1, 0, 0),
      vec3.fromValues(0, 0, 2),
      vec3.fromValues(0, -3, 0),
    ].forEach((expectedExtent, i) => testing.checkVec3(obb.extents[i], expectedExtent));
  });

  it('setting halfSideLength(X|Y|Z) should update extents', () => {
    obb.halfSideLengthX = 4;
    testing.checkVec3(obb.extents[0], vec3.fromValues(4, 0, 0));
    obb.halfSideLengthY = 5;
    testing.checkVec3(obb.extents[1], vec3.fromValues(0, 5, 0));
    obb.halfSideLengthZ = 6;
    testing.checkVec3(obb.extents[2], vec3.fromValues(0, 0, 6));
  });

  describe('iterators', () => {
    const expectedVertices = [
      vec3.fromValues(12.071066856384277, 20.071067810058594, 35.3553352355957),
      vec3.fromValues(32.07106399536133, 0.07106971740722656, 7.0710673332214355),
      vec3.fromValues(17.928930282592773, -14.071063995361328, 7.071066856384277),
      vec3.fromValues(-2.0710678100585938, 5.928932189941406, 35.3553352355957),
      vec3.fromValues(-17.928930282592773, 50.07106399536133, -7.071066856384277),
      vec3.fromValues(2.0710678100585938, 30.071067810058594, -35.3553352355957),
      vec3.fromValues(-12.071066856384277, 15.928933143615723, -35.3553352355957),
      vec3.fromValues(-32.07106399536133, 35.928932189941406, -7.0710673332214355),
    ];

    beforeEach(() => {
      obb = new Obb(10, 20, 30);
      const orientation = quat.create();
      quat.rotateZ(orientation, orientation, Math.PI / 4);
      quat.rotateX(orientation, orientation, Math.PI / 4);
      obb.orientation = orientation;
      obb.position = vec3.fromValues(0, 18, 0);
    });

    it('someVertex', () => {
      // Check the vertices.
      const vertices = [];
      obb.someVertex(vertex => {
        vertices.push(vec3.clone(vertex));
        return false;
      });
      testing.checkUnsortedPoints(vertices, expectedVertices);

      // Check that it stops when the callback returns true.
      let count = 0;
      obb.someVertex(() => {
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
      obb.someEdge(edge => {
        edges.push(edge.clone());
        return false;
      });
      testing.checkUnsortedEdges(edges, expectedEdges);

      // Check that it stops when the callback returns true.
      let count = 0;
      obb.someEdge(() => {
        count++;
        return true;
      });
      expect(count).toEqual(1);
    });

    describe('someFace', () => {
      it('axially-aligned', () => {
        obb = new Obb(10, 20, 30);

        // Check the pushed-out faces.
        const expectedFaces = [
          [
            vec3.fromValues(10, -20, -30),
            vec3.fromValues(10, 20, -30),
            vec3.fromValues(10, 20, 30),
            vec3.fromValues(10, -20, 30)
          ],
          [
            vec3.fromValues(-10, -20, -30),
            vec3.fromValues(-10, 20, -30),
            vec3.fromValues(-10, 20, 30),
            vec3.fromValues(-10, -20, 30)
          ],
          [
            vec3.fromValues(10, -20, -30),
            vec3.fromValues(10, 20, -30),
            vec3.fromValues(-10, 20, -30),
            vec3.fromValues(-10, -20, -30)
          ],
          [
            vec3.fromValues(10, 20, -30),
            vec3.fromValues(10, 20, 30),
            vec3.fromValues(-10, 20, 30),
            vec3.fromValues(-10, 20, -30)
          ],
          [
            vec3.fromValues(10, 20, 30),
            vec3.fromValues(10, -20, 30),
            vec3.fromValues(-10, -20, 30),
            vec3.fromValues(-10, 20, 30)
          ],
          [
            vec3.fromValues(10, -20, 30),
            vec3.fromValues(10, -20, -30),
            vec3.fromValues(-10, -20, -30),
            vec3.fromValues(-10, -20, 30)
          ],
        ];

        // Check the faces.
        const faces = [];
        obb.someFace(face => {
          faces.push(face.map(vertex => vec3.clone(vertex)));
          return false;
        });
        testing.checkUnsortedPolylines(faces, expectedFaces);

        // Check that it stops when the callback returns true.
        let count = 0;
        obb.someFace(() => {
          count++;
          return true;
        });
        expect(count).toEqual(1);

        // Check that only one dimension changes between each consecutive vertex. This ensures the
        // face vertices are given in a correct order.
        obb.someFace(face => {
          let prevVertex = face[0];
          for (let i = 1; i < 4; i++) {
            let diffCount = 0;
            const vertex = face[i];
            for (let j = 0; j < 3; j++) {
              if (vertex[j] !== prevVertex[j]) diffCount++;
            }
            expect(diffCount)
                .toEqual(1, `Expected consecutive vertices of ${face} to differ by one dimension`);
            prevVertex = vertex;
          }
        });
      });

      it('rotated', () => {
        const expectedFaces = [
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [0, 1, 5, 4],
          [1, 2, 6, 5],
          [2, 3, 7, 6],
          [3, 0, 4, 7],
        ].map(face => face.map(index => expectedVertices[index]));

        // Check the faces.
        const faces = [];
        obb.someFace(face => {
          faces.push(face.map(vertex => vec3.clone(vertex)));
          return false;
        });
        testing.checkUnsortedPolylines(faces, expectedFaces);

        // Check that it stops when the callback returns true.
        let count = 0;
        obb.someFace(() => {
          count++;
          return true;
        });
        expect(count).toEqual(1);
      });
    });

    describe('somePushedOutFace', () => {
      it('axially-aligned', () => {
        obb = new Obb(10, 20, 30);

        // Check the pushed-out faces.
        const expectedFaces = [
          [
            vec3.fromValues(110, -20, -30),
            vec3.fromValues(110, 20, -30),
            vec3.fromValues(110, 20, 30),
            vec3.fromValues(110, -20, 30)
          ],
          [
            vec3.fromValues(-110, -20, -30),
            vec3.fromValues(-110, 20, -30),
            vec3.fromValues(-110, 20, 30),
            vec3.fromValues(-110, -20, 30)
          ],
          [
            vec3.fromValues(10, -20, -130),
            vec3.fromValues(10, 20, -130),
            vec3.fromValues(-10, 20, -130),
            vec3.fromValues(-10, -20, -130)
          ],
          [
            vec3.fromValues(10, 120, -30),
            vec3.fromValues(10, 120, 30),
            vec3.fromValues(-10, 120, 30),
            vec3.fromValues(-10, 120, -30)
          ],
          [
            vec3.fromValues(10, 20, 130),
            vec3.fromValues(10, -20, 130),
            vec3.fromValues(-10, -20, 130),
            vec3.fromValues(-10, 20, 130)
          ],
          [
            vec3.fromValues(10, -120, 30),
            vec3.fromValues(10, -120, -30),
            vec3.fromValues(-10, -120, -30),
            vec3.fromValues(-10, -120, 30)
          ],
        ];

        // Check the faces.
        const faces = [];
        obb.somePushedOutFace(face => {
          faces.push(face.map(vertex => vec3.clone(vertex)));
          return false;
        }, 100);
        testing.checkUnsortedPolylines(faces, expectedFaces);

        // Check that it stops when the callback returns true.
        let count = 0;
        obb.somePushedOutFace(() => {
          count++;
          return true;
        }, 100);
        expect(count).toEqual(1);

        // Check that only one dimension changes between each consecutive vertex. This ensures the
        // face vertices are given in a correct order.
        obb.somePushedOutFace(face => {
          let prevVertex = face[0];
          for (let i = 1; i < 4; i++) {
            let diffCount = 0;
            const vertex = face[i];
            for (let j = 0; j < 3; j++) {
              if (vertex[j] !== prevVertex[j]) diffCount++;
            }
            expect(diffCount)
                .toEqual(1, `Expected consecutive vertices of ${face} to differ by one dimension`);
            prevVertex = vertex;
          }
        }, 100);
      });

      it('rotated', () => {
        // Check the pushed-out faces.
        const expectedFaces = [
          [
            vec3.fromValues(72.78173828125, 100.78173828125, -35.3553352355957),
            vec3.fromValues(52.781742095947266, 120.78173828125, -7.0710649490356445),
            vec3.fromValues(82.78173828125, 90.78173828125, 35.35533905029297),
            vec3.fromValues(102.78173828125, 70.78173828125, 7.07106876373291)
          ],
          [
            vec3.fromValues(-82.78173828125, -54.78173828125, -35.35533905029297),
            vec3.fromValues(-102.78173828125, -34.781742095947266, -7.07106876373291),
            vec3.fromValues(-72.78173828125, -64.78173828125, 35.3553352355957),
            vec3.fromValues(-52.781742095947266, -84.78173828125, 7.0710649490356445)
          ],
          [
            vec3.fromValues(-47.92892837524414, 80.07106018066406, -106.06600952148438),
            vec3.fromValues(-67.92892456054688, 100.07106018066406, -77.78173828125),
            vec3.fromValues(-82.07106018066406, 85.92892456054688, -77.78173828125),
            vec3.fromValues(-62.07106399536133, 65.92892456054688, -106.06600952148438)
          ],
          [
            vec3.fromValues(-67.9289321899414, 100.07106018066406, 63.63960647583008),
            vec3.fromValues(-37.928932189941406, 70.07106018066406, 106.06600952148438),
            vec3.fromValues(-52.07106399536133, 55.92892837524414, 106.06600952148438),
            vec3.fromValues(-82.07106018066406, 85.92892456054688, 63.63960647583008)
          ],
          [
            vec3.fromValues(62.07106399536133, -29.92892837524414, 106.06600952148438),
            vec3.fromValues(82.07106018066406, -49.928924560546875, 77.78173828125),
            vec3.fromValues(67.92892456054688, -64.07106018066406, 77.78173828125),
            vec3.fromValues(47.92892837524414, -44.07106399536133, 106.06600952148438)
          ],
          [
            vec3.fromValues(82.07106018066406, -49.928924560546875, -63.63960647583008),
            vec3.fromValues(52.07106399536133, -19.92892837524414, -106.06600952148438),
            vec3.fromValues(37.928932189941406, -34.07106018066406, -106.06600952148438),
            vec3.fromValues(67.9289321899414, -64.07106018066406, -63.63960647583008)
          ],
        ];

        // Check the faces.
        const faces = [];
        obb.somePushedOutFace(face => {
          faces.push(face.map(vertex => vec3.clone(vertex)));
          return false;
        }, 100);
        testing.checkUnsortedPolylines(faces, expectedFaces);
      });
    });
  });
});
