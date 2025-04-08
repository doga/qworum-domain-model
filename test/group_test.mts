// deno test --allow-import ./test/group_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  baregroupid, bareorgid, Org, Group, 
} from '../mod.mjs';

type GroupType = {
  groupId        : any,
  orgId          : any,
  isPersonalGroup: any,
  parentGroupId  : any,
  collabId       : any,
};


Deno.test('org can be written as rdf and then read back', () => {
  const
  orgId = bareorgid`5678`;

  if(!orgId)return;

  const
  orgIn   = new Org(orgId),
  dataset = rdf.dataset();

  orgIn.writeTo(dataset);
  // console.debug(dataset);
  const orgsOut = Org.readFrom(dataset);

  // console.debug(orgsOut);
  assertInstanceOf(orgsOut, Array);
  assertEquals(orgsOut.length, 1);

  const orgOut = orgsOut[0];
  assertInstanceOf(orgOut, Org);
  assert(orgIn.equals(orgOut));
  assert(orgIn.orgId.equals(orgOut.orgId));
});


Deno.test('group can be written as rdf and then read back', () => {
  const
  isPersonalGroup = false,
  groupId         = baregroupid`5678`,
  orgId           = bareorgid`lkj-456`,
  parentGroupId   = baregroupid`98769`;

  if(!(groupId && orgId && parentGroupId))return;

  const
  groupIn   = new Group({groupId, orgId, isPersonalGroup, parentGroupId} as GroupType),
  dataset = rdf.dataset();

  groupIn.writeTo(dataset);
  // console.debug(dataset);
  const groupsOut = Group.readFrom(dataset);

  // console.debug(groupsOut);
  assertInstanceOf(groupsOut, Array);
  assertEquals(groupsOut.length, 1);

  const groupOut = groupsOut[0];
  assertInstanceOf(groupOut, Group);
  assert(groupIn.equals(groupOut));
  assert(groupIn.groupId.equals(groupOut.groupId));
});


