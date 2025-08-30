// deno test --allow-import ./test/group_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert, assertExists,
} from 'jsr:@std/assert@1';


import { 
  Group, PersonalGroup, GroupId, 
  UserId, user_id, UserIdSet,
  Org, OrgId, 
  PartnershipId,
} from '../mod.mjs';


Deno.test('org can be written as rdf and then read back', () => {
  const
  ownerIds = new UserIdSet().add(UserId.uuid()),
  orgId    = OrgId.uuid();

  assertInstanceOf(orgId, OrgId);

  const
  orgIn   = new Org({orgId, ownerIds, groupsManagerIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds}),
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
  assertInstanceOf(partnershipId, PartnershipId);
  
  const
  groupIn = new PersonalGroup({ 
    groupId, ownerId, partnershipId,
  } ),

  dataset = groupIn.toDataset(),
  groupsOut = PersonalGroup.readFrom(dataset);
  // console.debug(dataset._quads);
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
  // console.debug(`[test] groupOut.partnershipId`,groupOut.partnershipId);

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
  assertEquals(group.ownerIds.size,1);
  assert(group.ownerIds.members[0].equals(ownerId));
  assertEquals(group.ownerIds.members[0].bareId, group.groupId.bareId);
  
  // subgroupsManagerIds
  assert(group.subgroupsManagerIds.isEmpty);

  // partnershipsManagerIds
  assertEquals(group.partnershipsManagerIds.size,1);
  assert(group.partnershipsManagerIds.members[0].equals(ownerId));

  // membershipsManagerIds
  assertEquals(group.membershipsManagerIds.size,1);
  assert(group.membershipsManagerIds.members[0].equals(ownerId));

  // memberIds
  assertEquals(group.memberIds.size,1);
  assert(group.memberIds.members[0].equals(ownerId));
  
});


Deno.test('group must have owners', () => {
  assertThrows(
    () => {
      new Group({});
    }
  );
  assertInstanceOf(
    new Group({ownerIds: new UserIdSet().add(UserId.uuid())}),
    Group
  )
});

Deno.test('org must have owners', () => {
  assertThrows(
    () => {
      new Org({});
    }
  );
  assertInstanceOf(
    new Org({ownerIds: new UserIdSet().add(UserId.uuid())}),
    Org
  )
});


Deno.test('group can be written as rdf and then read back', () => {
  const
  isPersonalGroup = false,
  ownerIds        = new UserIdSet().add(UserId.uuid()),
  orgId           = OrgId.uuid(),
  groupId         = GroupId.uuid(),
  parentGroupId   = GroupId.uuid(),
  membersHaveAllRolesByDefault = false;

  assertInstanceOf(orgId, OrgId);
  assertInstanceOf(groupId, GroupId);
  assertInstanceOf(parentGroupId, GroupId);
  assertInstanceOf(ownerIds, UserIdSet);
  assertInstanceOf(ownerIds.members[0], UserId);

  const
  groupIn = new Group({
    groupId, orgId, isPersonalGroup, parentGroupId, ownerIds, 
    subgroupsManagerIds    : ownerIds,
    partnershipsManagersIds: ownerIds,
    membershipsManagerIds  : ownerIds,
    memberIds              : ownerIds,
    membersHaveAllRolesByDefault
  } ),
  // groupIn = new Group({groupId, orgId, isPersonalGroup, parentGroupId, ownerIds, subgroupsManagerIds: ownerIds, collabManagerIds: ownerIds, membershipsManagerIds: ownerIds, memberIds: ownerIds} as GroupType),
  dataset = groupIn.toDataset();
  // console.debug(dataset._quads);
  const groupsOut = Group.readFrom(dataset);

  // console.debug(groupsOut);
  assertInstanceOf(groupsOut, Array);
  assertEquals(groupsOut.length, 1);

  const groupOut = groupsOut[0];
  assertInstanceOf(groupOut, Group);
  assert(groupIn.equals(groupOut));
  assert(groupIn.groupId.equals(groupOut.groupId));
  assertEquals(groupIn.membersHaveAllRolesByDefault, groupOut.membersHaveAllRolesByDefault)
});


