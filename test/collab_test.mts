// deno test --allow-import ./test/collab_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  GroupId, baregroupid, 
  barecollabid, 
  Collab,
  CollabId, 
} from '../mod.mjs';


Deno.test('collab can be written as rdf and then read back', () => {
  const
  collabId       = barecollabid`5678`,
  ownerGroupId   = baregroupid`g-6kjh`,
  memberGroupIds = [ baregroupid`mdfgh765`, baregroupid`m-rbc-443` ];

  if(!(collabId && ownerGroupId && memberGroupIds))return;

  assertInstanceOf(collabId, CollabId);
  assertInstanceOf(ownerGroupId, GroupId);
  assertInstanceOf(memberGroupIds, Array);
  assert(memberGroupIds.every(id => id instanceof GroupId));

  const
  collabIn = new Collab(collabId, ownerGroupId, memberGroupIds),
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
  assertEquals(collabOut.memberGroupIds.length, collabIn.memberGroupIds.length);
  assert(collabOut.memberGroupIds.every(groupId => collabIn.memberGroupIds.find(id => groupId.equals(id))));
});


