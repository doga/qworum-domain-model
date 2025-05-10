// deno test --allow-import ./test/mp_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { 
  Id, baregroup_id, UserId, GroupId,
  Partnership, PartnershipId, PartnershipMembership, PartnershipMembershipId,
  Role, RoleId, platformRoleset
} from '../mod.mjs';


Deno.test('partnership membership can be written as rdf and then read back', () => {
  const
  partnershipId = PartnershipId.uuid(),
  groupId       = GroupId.uuid(),
  roleIds       = [platformRoleset.findRole(/unrestricted/).roleId],

  mpIn    = new PartnershipMembership({partnershipId, groupId, roleIds}),
  dataset = mpIn.toDataset(),
  mpOut   = PartnershipMembership.readOneFrom(dataset);

  // console.debug(`dataset`, dataset);
  // console.debug(`mpOut`, mpOut);

  [mpIn, mpOut].forEach(m => {
    assertInstanceOf(m, PartnershipMembership);
    assertEquals(m.roleIds.length, 1);
    assertInstanceOf(m.roleIds[0], RoleId);
  });

  assert(mpIn.partnershipMembershipId.equals(mpOut.partnershipMembershipId));
  assert(mpIn.partnershipId.equals(mpOut.partnershipId));
  assert(mpIn.groupId.equals(mpOut.groupId));
  assert(mpIn.roleIds[0].equals(mpOut.roleIds[0]));

});


