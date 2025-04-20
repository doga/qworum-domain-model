// deno test --allow-import ./test/group_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  Org, Group, userid, PersonalGroup,
  OrgId, GroupId, UserId,
} from '../mod.mjs';

type GroupType = {
  groupId              : any,

  orgId                : any,
  isPersonalGroup      : any,
  parentGroupId        : any,
  collabId             : any,

  // managers
  ownerIds             : any,
  subgroupsManagerIds  : any,
  collabManagerIds     : any,
  membershipsManagerIds: any,

  memberIds            : any,
};

type OrgType = {
  orgId                : any,

  // managers
  ownerIds             : any,
  rootGroupsManagerIds : any,
  membershipsManagerIds: any,

  memberIds            : any,
};


Deno.test('org can be written as rdf and then read back', () => {
  const
  ownerIds = [UserId.uuid()],
  orgId    = OrgId.uuid();

  assertInstanceOf(orgId, OrgId);

  const
  orgIn   = new Org({orgId, ownerIds, rootGroupsManagerIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds}),
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


Deno.test('personal group can be written as rdf and then read back', () => {
  const
  groupId         = GroupId.uuid(),
  isPersonalGroup = true,
  ownerIds        = [UserId.uuid()];

  assertInstanceOf(groupId, GroupId);
  assertInstanceOf(ownerIds, Array);
  assertInstanceOf(ownerIds[0], UserId);
  
  const
  groupIn = new PersonalGroup({ groupId, isPersonalGroup, ownerIds, collabManagerIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds } as GroupType),
  dataset = rdf.dataset();
  
  groupIn.writeTo(dataset);
  // console.debug(dataset);
  // console.debug('reading groups from dataset');
  const groupsOut = PersonalGroup.readFrom(dataset);
  // console.debug('read groups from dataset');
  // console.debug(groupsOut);

  assertInstanceOf(groupsOut, Array);
  assertEquals(groupsOut.length, 1);
  
  const groupOut = groupsOut[0];
  assertInstanceOf(groupOut, Group);
  assertInstanceOf(groupOut, PersonalGroup);
  assert(groupIn.equals(groupOut));
  assert(groupIn.groupId.equals(groupOut.groupId));
});


Deno.test('group can be written as rdf and then read back', () => {
  const
  isPersonalGroup = false,
  ownerIds        = [UserId.uuid()],
  orgId           = OrgId.uuid(),
  groupId         = GroupId.uuid(),
  parentGroupId   = GroupId.uuid();

  assertInstanceOf(orgId, OrgId);
  assertInstanceOf(groupId, GroupId);
  assertInstanceOf(parentGroupId, GroupId);
  assertInstanceOf(ownerIds, Array);
  assertInstanceOf(ownerIds[0], UserId);

  const
  groupIn = new Group({groupId, orgId, isPersonalGroup, parentGroupId, ownerIds, subgroupsManagerIds: ownerIds, collabManagerIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds} as GroupType),
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


