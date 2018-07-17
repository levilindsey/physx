/**
 * This module defines a collection of static utility functions for calculating inertia tensors.
 */

import {_geometry, rotateTensor} from './geometry';

/**
 * @param {number} radius
 * @param {number} mass
 * @returns {mat3}
 */
function createSphereInertiaTensor(radius, mass) {// TODO: Test this somehow...
  const tensor = mat3.create();
  const moment = 2 / 5 * mass * radius * radius;
  tensor[0] = moment;
  tensor[4] = moment;
  tensor[8] = moment;
  return tensor;
}

/**
 * @param {number} rangeX
 * @param {number} rangeY
 * @param {number} rangeZ
 * @param {number} mass
 * @returns {mat3}
 */
function createBoxInertiaTensor(rangeX, rangeY, rangeZ, mass) {// TODO: Test this somehow...
  const tensor = mat3.create();
  const tmp = mass / 12;
  const xRangeSquared = rangeX * rangeX;
  const yRangeSquared = rangeY * rangeY;
  const zRangeSquared = rangeZ * rangeZ;
  tensor[0] = tmp * (yRangeSquared + zRangeSquared);
  tensor[4] = tmp * (xRangeSquared + yRangeSquared);
  tensor[8] = tmp * (xRangeSquared + zRangeSquared);
  return tensor;
}

/**
 * ----------------------------------------------------------------------------
 * Originally based on Bojan Lovrovic's algorithm at
 * http://www.gamedev.net/page/resources/_/technical/math-and-physics/capsule-inertia-tensor-r3856.
 *
 * Copyright 2014 Bojan Lovrovic
 *
 * GameDev.net Open License
 * (http://www.gamedev.net/page/resources/_/gdnethelp/gamedevnet-open-license-r2956)
 *
 * TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION
 *
 * 1. Definitions.
 *
 * "Article" shall refer to any body of text written by Author which describes and documents the use
 * and/or operation of Source. It specifically does not refer to any accompanying Source either
 * embedded within the body of text or attached to the article as a file.
 *
 * "Author" means the individual or entity that offers the Work under the terms of this License.
 *
 * "License" shall mean the terms and conditions for use, reproduction, and distribution as defined
 * by Sections 1 through 9 of this document.
 *
 * "Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is
 * granting the License.
 *
 * "You" (or "Your") shall mean an individual or entity exercising permissions granted by this
 * License.
 *
 * "Source" shall include all software text source code and configuration files used to create
 * executable software
 *
 * "Object" shall mean any Source which has been converted into a machine executable software
 *
 * "Work" consists of both the Article and Source
 *
 * "Publisher" refers to GameDev.net LLC
 *
 * This agreement is between You and Author, the owner and creator of the Work located at
 * Gamedev.net.
 *
 * 2. Fair Dealing Rights.
 *
 * Nothing in this License is intended to reduce, limit, or restrict any uses free from copyright or
 * rights arising from limitations or exceptions that are provided for in connection with the
 * copyright protection under copyright law or other applicable laws.
 *
 * 3. Grant of Copyright License.
 *
 * Subject to the terms and conditions of this License, the Author hereby grants to You a perpetual,
 * worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to the Work
 * under the following stated terms:
 * You may not reproduce the Article on any other website outside of Gamedev.net without express
 * written permission from the Author
 * You may use, copy, link, modify and distribute under Your own terms, binary Object code versions
 * based on the Work in your own software
 * You may reproduce, prepare derivative Works of, publicly display, publicly perform, sublicense,
 * and distribute the Source and such derivative Source in Source form only as part of a larger
 * software distribution and provided that attribution to the original Author is granted.
 * The origin of this Work must not be misrepresented; you must not claim that you wrote the
 * original Source. If you use this Source in a product, an acknowledgment of the Author name would
 * be appreciated but is not required.
 *
 * 4. Restrictions.
 *
 * The license granted in Section 3 above is expressly made subject to and limited by the following
 * restrictions:
 * Altered Source versions must be plainly marked as such, and must not be misrepresented as being
 * the original software.
 * This License must be visibly linked to from any online distribution of the Article by URI and
 * using the descriptive text "Licensed under the GameDev.net Open License"
 * Neither the name of the Author of this Work, nor any of their trademarks or service marks, may be
 * used to endorse or promote products derived from this Work without express prior permission of
 * the Author
 * Except as expressly stated herein, nothing in this License grants any license to Author's
 * trademarks, copyrights, patents, trade secrets or any other intellectual property. No license is
 * granted to the trademarks of Author even if such marks are included in the Work. Nothing in this
 * License shall be interpreted to prohibit Author from licensing under terms different from this
 * License any Work that Author otherwise would have a right to license.
 *
 * 5. Grant of Patent License.
 *
 * Subject to the terms and conditions of this License, each Contributor hereby grants to You a
 * perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in
 * this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise
 * transfer the Work, where such license applies only to those patent claims licensable by such
 * Contributor that are necessarily infringed by their Contribution(s) alone or by combination of
 * their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute
 * patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit)
 * alleging that the Work or Source incorporated within the Work constitutes direct or contributory
 * patent infringement, then any patent licenses granted to You under this License for that Work
 * shall terminate as of the date such litigation is filed.
 *
 * 6. Limitation of Liability.
 *
 * In no event and under no legal theory, whether in tort (including negligence), contract, or
 * otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or
 * agreed to in writing, shall any Author or Publisher be liable to You for damages, including any
 * direct, indirect, special, incidental, or consequential damages of any character arising as a
 * result of this License or out of the use or inability to use the Work (including but not limited
 * to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all
 * other commercial damages or losses), even if such Author has been advised of the possibility of
 * such damages.
 *
 * 7. DISCLAIMER OF WARRANTY
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * 8. Publisher.
 *
 * The parties hereby confirm that the Publisher shall not, under any circumstances, be responsible
 * for and shall not have any liability in respect of the subject matter of this License. The
 * Publisher makes no warranty whatsoever in connection with the Work and shall not be liable to You
 * or any party on any legal theory for any damages whatsoever, including without limitation any
 * general, special, incidental or consequential damages arising in connection to this license. The
 * Publisher reserves the right to cease making the Work available to You at any time without notice
 *
 * 9. Termination
 *
 * This License and the rights granted hereunder will terminate automatically upon any breach by You
 * of the terms of this License. Individuals or entities who have received Deriviative Works from
 * You under this License, however, will not have their licenses terminated provided such
 * individuals or entities remain in full compliance with those licenses. Sections 1, 2, 6, 7, 8 and
 * 9 will survive any termination of this License.
 * Subject to the above terms and conditions, the license granted here is perpetual (for the
 * duration of the applicable copyright in the Work). Notwithstanding the above, Licensor reserves
 * the right to release the Work under different license terms or to stop distributing the Work at
 * any time; provided, however that any such election will not serve to withdraw this License (or
 * any other license that has been, or is required to be, granted under the terms of this License),
 * and this License will continue in full force and effect unless terminated as stated above.
 * ----------------------------------------------------------------------------
 *
 * @param {number} halfDistance
 * @param {number} radius
 * @param {number} mass
 * @returns {mat3}
 */
function createCapsuleInertiaTensor(halfDistance, radius, mass) {// TODO: Test this somehow...
  const tensor = mat3.create();

  const cylinderHeight = halfDistance * 2;
  const radiusSquared = radius * radius;
  const cylinderVolume = Math.PI * radiusSquared * cylinderHeight;
  const hemisphereCombinedVolume = 4 / 3 * Math.PI * radiusSquared;
  const cylinderMass = cylinderVolume / (cylinderVolume * hemisphereCombinedVolume) * mass;
  const hemisphereMass = (mass - cylinderMass) / 2;

  // Contribution from the cylinder.
  tensor[4] = radiusSquared * cylinderMass / 2;
  tensor[0] = tensor[4] / 2 + cylinderMass * cylinderHeight * cylinderHeight / 12;
  tensor[8] = tensor[0];

  // Contributions from the hemispheres.
  const tmp1 = hemisphereMass * 2 * radiusSquared / 5;
  tensor[4] += tmp1 * 2;
  const tmp2 =
      (tmp1 + hemisphereMass * (halfDistance * halfDistance + 3 / 8 * cylinderHeight * radius)) * 2;
  tensor[0] += tmp2;
  tensor[8] += tmp2;

  // The above calculations assume the capsule is aligned along the y-axis. However, our default
  // capsule orientation is aligned along the z-axis.
  const rotation = quat.create();
  quat.rotateX(rotation, rotation, _geometry.HALF_PI);
  rotateTensor(tensor, tensor, rotation);

  return tensor;
}

/**
 * @param {Collidable} collidable
 * @param {number} mass
 * @returns {mat3}
 */
function createForCollidable(collidable, mass) {
  switch (collidable.constructor.name) {
    case 'Sphere':
      return createSphereInertiaTensor(collidable.radius, mass);
    case 'Aabb':
      return createBoxInertiaTensor(collidable.rangeX, collidable.rangeY, collidable.rangeZ, mass);
    case 'Capsule':
      return createCapsuleInertiaTensor(collidable.halfDistance, collidable.radius, mass);
    case 'Obb':
      return createBoxInertiaTensor(collidable.halfSideLengths[0] * 2,
          collidable.halfSideLengths[1] * 2, collidable.halfSideLengths[2] * 2, mass);
  }
}

export {
  createSphereInertiaTensor,
  createBoxInertiaTensor,
  createCapsuleInertiaTensor,
  createForCollidable,
};
