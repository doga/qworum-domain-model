// deno test --allow-import ./test/membership_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { 
  Id, baregroup_id, UserId, GroupId,
  Membership, MembershipId,
  Role, RoleId, platformRoleset
} from '../mod.mjs';


Deno.test('membership can be written as rdf and then read back', () => {
  const
  userId  = UserId.uuid(),
  groupId = GroupId.uuid(),
  roleIds = [platformRoleset.findRole(/reader/).roleId],
  membershipIn  = new Membership({userId, groupId, roleIds}),
  dataset       = membershipIn.toDataset(),
  membershipOut = Membership.readOneFrom(dataset);

  // console.debug(`membershipIn`, membershipIn);
  // console.debug(`dataset`, dataset);
  // console.debug(`membershipOut`, membershipOut);

  [membershipIn, membershipOut].forEach(m => {
    assertInstanceOf(m, Membership);
    assertEquals(m.roleIds.length, 1);
    assertInstanceOf(m.roleIds[0], RoleId);
  });

  assert(membershipIn.membershipId.equals(membershipOut.membershipId));
  assert(membershipIn.userId.equals(membershipOut.userId));
  assert(membershipIn.groupId.equals(membershipOut.groupId));
  assert(membershipIn.roleIds[0].equals(membershipOut.roleIds[0]));

});


