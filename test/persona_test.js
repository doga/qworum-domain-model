// deno test --allow-import ./test/persona_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  GroupId, Role, platformRoleset,
  UserId, Persona, RoleId, 
} from '../mod.mjs';

// type PersonaType = {
//   personaId  : any,
//   groupId    : any,
//   userId     : any,
//   memberRoles: any,
// };


Deno.test('persona can be written as rdf', () => {
  const
  groupId     = GroupId.uuid(),
  userId      = UserId.uuid(),
  userRoleIds = [platformRoleset.findRole(/reader/).roleId],

  personaIn   = new Persona({groupId, userId, userRoleIds} ),
  personaDs   = personaIn.toDataset(),
  personaOut  = Persona.readFrom(personaDs);

  // console.debug(personaIn);
  // console.debug(personaDs);
  // console.debug(personaOut);
  assert(personaIn.groupId.equals(personaOut.groupId));
  assert(personaIn.userId.equals(personaOut.userId));
  assertEquals(personaIn.userRoleIds.length, 1);
  assertEquals(personaIn.userRoleIds.length, personaOut.userRoleIds.length);
  assertInstanceOf(personaOut.userRoleIds[0], RoleId);
  assert(personaIn.userRoleIds[0].equals(personaOut.userRoleIds[0]));
});

