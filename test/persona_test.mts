// deno test --allow-import ./test/persona_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  OrgId, bareorgid, 
  GroupId, baregroupid, 
  bareuserid,

  OrgPersona, GroupPersona,
  UserRole,
} from '../mod.mjs';

type PersonaType = {
  orgId    : any,
  groupId  : any,
  userId   : any,
  userRoles: any
};


Deno.test('org persona can be written as rdf and then read back', () => {
  const
  orgId      = bareorgid`5678`,
  userId     = bareuserid`1234`,
  userRoles  = [
    UserRole.orgOwner,
    UserRole.orgRootGroupsManager,
    UserRole.orgMembershipsManager,
    UserRole.member,
  ],
  orgPersona = new OrgPersona({orgId, userId, userRoles} as PersonaType),
  dataset    = rdf.dataset();

  orgPersona.writeTo(dataset);
  // console.debug(dataset);
  const orgPersonas = OrgPersona.readFrom(dataset);

  // console.debug(orgPersonas);
  assertInstanceOf(orgPersonas, Array);
  assertEquals(orgPersonas.length, 1);
  assertInstanceOf(orgPersonas[0], OrgPersona);
  assert((orgId as OrgId).equals(orgPersonas[0].orgId));
});


Deno.test('group persona can be written as rdf and then read back', () => {
  const
  groupId      = baregroupid`5678`,
  userId       = bareuserid`1234`,
  userRoles    = [
    UserRole.groupOwner, 
    UserRole.groupCollabManager, 
    UserRole.groupSubgroupsManager, 
    UserRole.groupMembershipsManager, 
    UserRole.member,
  ],
  groupPersonaIn = new GroupPersona({groupId, userId, userRoles} as PersonaType),
  dataset        = rdf.dataset();
  // console.debug(groupId);

  groupPersonaIn.writeTo(dataset);
  // console.debug(dataset);
  const groupPersonas = GroupPersona.readFrom(dataset);

  // console.debug(groupPersonas);
  assertInstanceOf(groupPersonas, Array);
  assertEquals(groupPersonas.length, 1);
  const groupPersona = groupPersonas[0];
  assertInstanceOf(groupPersonas[0], GroupPersona);
  assert((groupId as GroupId).equals(groupPersonas[0].groupId));
});

