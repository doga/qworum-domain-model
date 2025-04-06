// deno test --allow-import ./test/id_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from "jsr:@std/assert@1";

import {rdf} from '../deps.mjs';

import { 
  OrgId, GroupId, UserId,
  OrgPersona, GroupPersona,
} from '../mod.mjs';


type PersonaType = {
  orgId: OrgId | undefined, groupId: GroupId | undefined, 
  userId: UserId, userRoles: string[]
};


Deno.test('org persona can be written as rdf and then read back', () => {
  const
  orgId      = OrgId.create('5678'),
  userId     = UserId.create('1234'),
  userRoles  = ['owner', 'root groups manager', 'memberships manager', 'member'],
  orgPersona = new OrgPersona({orgId, userId, userRoles} as PersonaType),
  dataset    = rdf.dataset();

  orgPersona.writeTo(dataset);
  // console.debug(dataset);
  const orgPersonas = OrgPersona.readFrom(dataset);

  console.debug(orgPersonas);
  assertInstanceOf(orgPersonas, Array);
  assertEquals(orgPersonas.length, 1);
  assertInstanceOf(orgPersonas[0], OrgPersona);
  assert(orgPersonas[0].orgId?.equals(orgId));
});


Deno.test('group persona can be written as rdf and then read back', () => {
  const
  groupId      = GroupId.create('5678'),
  userId       = UserId.create('1234'),
  userRoles    = ['owner', 'collabs manager', 'subgroups manager', 'memberships manager', 'member'],
  groupPersona = new GroupPersona({groupId, userId, userRoles} as PersonaType),
  dataset      = rdf.dataset();

  groupPersona.writeTo(dataset);
  // console.debug(dataset);
  const groupPersonas = GroupPersona.readFrom(dataset);

  console.debug(groupPersonas);
  assertInstanceOf(groupPersonas, Array);
  assertEquals(groupPersonas.length, 1);
  assertInstanceOf(groupPersonas[0], GroupPersona);
  assert(groupPersonas[0].groupId?.equals(groupId));
});

