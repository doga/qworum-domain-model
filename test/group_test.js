// deno test --allow-import ./test/group_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert, assertExists,
} from 'jsr:@std/assert@1';


import { 
  Group, PersonalGroup, GroupId, 
  UserId, user_id,
  Org, OrgId, 
  PartnershipId,
} from '../mod.mjs';


Deno.test('org can be written as rdf and then read back', () => {
  const
  ownerIds = [UserId.uuid()],
  orgId    = OrgId.uuid();

  assertInstanceOf(orgId, OrgId);

  const
  orgIn   = new Org({orgId, ownerIds, rootGroupsManagerIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds}),
  dataset = orgIn.toDataset();
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
  groupId       = GroupId.uuid(),
  partnershipId = PartnershipId.uuid(),
  ownerId       = UserId.uuid();

  assertInstanceOf(groupId, GroupId);
  assertInstanceOf(ownerId, UserId);
  
  const
  groupIn = new PersonalGroup({ 
    groupId, ownerId, partnershipId,
  } ),

  dataset = groupIn.toDataset(),
  groupsOut = PersonalGroup.readFrom(dataset);
  // console.debug('read groups from dataset');
  // console.debug(groupsOut);

  assertInstanceOf(groupsOut, Array);
  assertEquals(groupsOut.length, 1);
  
  const groupOut = groupsOut[0];
  assertInstanceOf(groupOut, Group);
  assertInstanceOf(groupOut, PersonalGroup);
  assert(groupIn.equals(groupOut));
  assert(groupIn.groupId.equals(groupOut.groupId));

  // console.debug(`[test] partnershipId`,partnershipId);
  // console.debug(`[test] group.partnershipId`,groupOut.partnershipId);

  // partnershipId
  assert(partnershipId.equals(groupOut.partnershipId));
});



Deno.test('new personal group can be created', () => {
  const
  ownerId       = UserId.uuid(),
  group         = PersonalGroup.create({ ownerId });

  assertInstanceOf(group, Group);
  assertInstanceOf(group, PersonalGroup);

  // groupId
  assertInstanceOf(group.groupId, GroupId);
  
  // isPersonalGroup
  assertEquals(group.isPersonalGroup, true);

  // orgId
  assertFalse(group.orgId ?? false);

  // parentGroupId
  assertFalse(group.parentGroupId ?? false);

  // ownerIds
  assertEquals(group.ownerIds.length,1);
  assert(group.ownerIds[0].equals(ownerId));
  assertEquals(group.ownerIds[0].bareId, group.groupId.bareId);
  
  // subgroupsManagerIds
  assertEquals(group.subgroupsManagerIds.length,0);

  // partnershipsManagerIds
  assertEquals(group.partnershipsManagerIds.length,1);
  assert(group.partnershipsManagerIds[0].equals(ownerId));

  // membershipsManagerIds
  assertEquals(group.membershipsManagerIds.length,1);
  assert(group.membershipsManagerIds[0].equals(ownerId));

  // memberIds
  assertEquals(group.memberIds.length,1);
  assert(group.memberIds[0].equals(ownerId));
  
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
  groupIn = new Group({groupId, orgId, isPersonalGroup, parentGroupId, ownerIds, subgroupsManagerIds: ownerIds, partnershipsManagersIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds} ),
  // groupIn = new Group({groupId, orgId, isPersonalGroup, parentGroupId, ownerIds, subgroupsManagerIds: ownerIds, collabManagerIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds} as GroupType),
  dataset = groupIn.toDataset();
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


