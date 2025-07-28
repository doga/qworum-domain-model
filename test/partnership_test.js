// deno test --allow-import ./test/partnership_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { 
  Id, baregroup_id, 
  GroupId, PartnershipId,  
  Partnership, GroupIdSet
} from '../mod.mjs';


Deno.test('partnership can be written as rdf and then read back', () => {
  const
  partnershipId = PartnershipId.uuid(),
  ownerId       = baregroup_id`g-6kjh`,
  memberId1     = baregroup_id`mdfgh765`,
  memberId2     = baregroup_id`m-rbc-443`,
  memberIds     = new GroupIdSet().add([ memberId1, memberId2 ]);

  if(!(partnershipId && ownerId && memberId1 && memberId2))return;

  assertInstanceOf(partnershipId, PartnershipId);
  assertInstanceOf(ownerId, Id);
  assertInstanceOf(memberIds, GroupIdSet);
  assert(memberIds.members.every(id => id instanceof GroupId));

  const
  partnershipIn   = new Partnership({partnershipId, ownerId, memberIds: memberIds }),
  // partnershipIn   = new Partnership({partnershipId, ownerId, memberIds: memberIds as Id[]}),
  dataset    = partnershipIn.toDataset(),
  partnershipsOut = Partnership.readFrom(dataset),
  partnershipOut  = Partnership.readOneFrom(dataset);

  console.debug(dataset._quads);
  assertInstanceOf(partnershipsOut, Array);
  assertEquals(partnershipsOut.length, 1);

  assertInstanceOf(partnershipsOut[0], Partnership);
  assertInstanceOf(partnershipOut, Partnership);
  assertEquals(partnershipOut, partnershipsOut[0]);
  assert(partnershipOut.equals(partnershipIn));
  assert(partnershipOut.ownerId.equals(partnershipIn.ownerId));
  assertEquals(partnershipOut.memberIds.size, partnershipIn.memberIds.size);
  assert(partnershipOut.memberIds.isSubsetOf(partnershipIn.memberIds));
  assert(partnershipOut.memberIds.isSupersetOf(partnershipIn.memberIds));
});


