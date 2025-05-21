// deno test --allow-import ./test/user_test.js

import { assertInstanceOf, assertEquals, assertNotEquals, assert } from 'jsr:@std/assert@1';

import { 
  UserId, GroupId, OrgId, UserExtras,
} from '../mod.mjs';

Deno.test('user extra is written to rdf dataset and read back', () => {
  const
  userId  = UserId.uuid(),
  groupId = GroupId.uuid(),
  orgId   = OrgId.uuid(),
  ueIn    = new UserExtras({
    userId,
    groupIds: [groupId],
    orgIds  : [orgId],
  }),
  ds    = ueIn.toDataset(),
  uesOut = UserExtras.readFrom(ds),
  ueOut = UserExtras.readOneFrom(ds);

  console.debug(`[test] ds`,ds);
  assertInstanceOf(ueIn, UserExtras);
  assert(ueIn.userId.equals(ueIn.userId));
  assertEquals(ueIn.groupIds.length,1);
  assertEquals(ueIn.orgIds.length,1);
  assert(ueIn.orgIds[0].equals(ueIn.orgIds[0]));
  assert(ueIn.groupIds[0].equals(ueIn.groupIds[0]));

  assertEquals(uesOut.length,1);
  assertInstanceOf(ueOut, UserExtras);
  assert(ueOut.userId.equals(ueIn.userId));
  assertEquals(ueOut.groupIds.length,1);
  assertEquals(ueOut.orgIds.length,1);
  assert(ueOut.orgIds[0].equals(ueIn.orgIds[0]));
  assert(ueOut.groupIds[0].equals(ueIn.groupIds[0]));

});
