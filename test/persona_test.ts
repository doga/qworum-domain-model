// deno test --allow-import ./test/persona_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  OrgId,
  GroupId, 

  OrgPersona, GroupPersona,
  MemberRole, memberrole,
  UserId,
} from '../mod.mjs';

type PersonaType = {
  personaId  : any,
  orgId      : any,
  groupId    : any,
  userId     : any,
  memberRoles: any,
};


Deno.test('org persona can be written as rdf and then read back', () => {
  const
  orgId       = OrgId.uuid(),
  userId      = UserId.uuid(),
  memberRoles = [MemberRole.reader],
  orgPersona  = new OrgPersona({orgId, userId, memberRoles} as PersonaType),
  dataset     = rdf.dataset();

  orgPersona.writeTo(dataset);
  // console.debug(dataset);

  const orgPersonas = OrgPersona.readFrom(dataset);

  // // console.debug(orgPersonas);
  // assertInstanceOf(orgPersonas, Array);
  // assertEquals(orgPersonas.length, 1);
  // assertInstanceOf(orgPersonas[0], OrgPersona);
  // assert((orgId as OrgId).equals(orgPersonas[0].orgId));
});

