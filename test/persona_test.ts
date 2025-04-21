// deno test --allow-import ./test/persona_test.mts

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { rdf } from '../deps.mjs';

import { 
  GroupId, MemberRole, memberrole,
  UserId, Persona, PersonaId,
} from '../mod.mjs';

type PersonaType = {
  personaId  : any,
  groupId    : any,
  userId     : any,
  memberRoles: any,
};


Deno.test('persona without id cannot be written as rdf', () => {
  const
  groupId     = GroupId.uuid(),
  userId      = UserId.uuid(),
  memberRoles = [MemberRole.reader],
  persona     = new Persona({groupId, userId, memberRoles} as PersonaType),
  dataset     = rdf.dataset();

  assertThrows(
    () => persona.writeTo(dataset)
  );

});


Deno.test('persona with id can be written as rdf and then read back', () => {
  const
  personaId   = PersonaId.uuid(),
  groupId     = GroupId.uuid(),
  userId      = UserId.uuid(),
  memberRoles = [MemberRole.reader],
  persona     = new Persona({personaId, groupId, userId, memberRoles} as PersonaType),
  dataset     = rdf.dataset();

  persona.writeTo(dataset);
  // console.debug(dataset);

  const personas = Persona.readFrom(dataset);

  // // console.debug(personas);
  // assertInstanceOf(personas, Array);
  // assertEquals(personas.length, 1);
  // assertInstanceOf(personas[0], Persona);
  // assert((groupId as OrgId).equals(personas[0].groupId));
});

