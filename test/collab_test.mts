// deno test --allow-import ./test/collab_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  GroupId, baregroupid, 
  CollabId, barecollabid, 
  Collab, 
} from '../mod.mjs';


Deno.test('collab can be written as rdf and then read back', () => {
  const
  collabId        = barecollabid`5678`,
  ownerGroupId    = baregroupid`g-6kjh`,
  invitedGroupId1 = baregroupid`mdfgh765`,
  invitedGroupId2 = baregroupid`m-rbc-443`,
  invitedGroupIds = [ invitedGroupId1, invitedGroupId2 ];

  if(!(collabId && ownerGroupId && invitedGroupId1 && invitedGroupId2))return;

  assertInstanceOf(collabId, CollabId);
  assertInstanceOf(ownerGroupId, GroupId);
  assertInstanceOf(invitedGroupIds, Array);
  assert(invitedGroupIds.every(id => id instanceof GroupId));

  const
  collabIn = new Collab(collabId, ownerGroupId, invitedGroupIds as GroupId[]),
  dataset  = rdf.dataset();

  collabIn.writeTo(dataset);
  // console.debug(dataset);
  const collabsOut = Collab.readFrom(dataset);

  // console.debug(collabsOut);
  assertInstanceOf(collabsOut, Array);
  assertEquals(collabsOut.length, 1);

  const collabOut = collabsOut[0];
  assertInstanceOf(collabOut, Collab);
  assert(collabOut.equals(collabIn));
  assert(collabOut.ownerGroupId.equals(collabIn.ownerGroupId));
  assertEquals(collabOut.invitedGroupIds.length, collabIn.invitedGroupIds.length);
  assert(collabOut.invitedGroupIds.every(groupId => collabIn.invitedGroupIds.find(id => groupId.equals(id))));
  assert(collabIn.invitedGroupIds.every(groupId => collabOut.invitedGroupIds.find(id => groupId.equals(id))));
});


