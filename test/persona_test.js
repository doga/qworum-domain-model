// deno test --allow-import ./test/persona_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert, assertArrayIncludes,
} from 'jsr:@std/assert@1';

// import { rdf } from '../deps.mjs';

import { 
  GroupId, GroupIdSet,
  Role, defaultRoleset, IRL, 
  UserId, Persona, 
  IndividualVcard, GroupVcard,
} from '../mod.mjs';

// type PersonaType = {
//   personaId  : any,
//   groupId    : any,
//   userId     : any,
//   memberRoles: any,
// };

const
groupId         = GroupId.uuid(),
userId          = UserId.uuid(),
groupVcard      = new GroupVcard(groupId, {formattedName: 'a group'}),
userVcard       = new IndividualVcard(userId, {formattedName: 'a user'}),
partnerGroupIds = new GroupIdSet().add(GroupId.uuid()).add(GroupId.uuid()),

userRoleIds = [defaultRoleset.findRole(/\/reader$/).roleId],
persona  = new Persona({groupId, userId, groupVcard, userVcard, userRoleIds, partnerGroupIds});


Deno.test('persona can be written to a dataset and read back', () => {
  const
  personaDs  = persona.toDataset(),
  personaOut = Persona.readFrom(personaDs);

  // console.debug(persona);
  // console.debug(personaDs._quads);
  // console.debug(personaOut);

  assert(persona.groupId.equals(personaOut.groupId));
  assert(persona.userId.equals(personaOut.userId));
  assertEquals(persona.partnerGroupIds.length, personaOut.partnerGroupIds.length);
  assert(persona.partnerGroupIds.isSameAs(personaOut.partnerGroupIds));

  assertEquals(persona.userRoleIds.length, 1);
  assertEquals(persona.userRoleIds.length, personaOut.userRoleIds.length);
  assertInstanceOf(personaOut.userRoleIds[0], IRL);
  assert(persona.userRoleIds[0].equals(personaOut.userRoleIds[0]));

  assertThrows(() => personaOut.hasRole([]));
  assertThrows(() => personaOut.hasRole(defaultRoleset.findRole(/\/top$/).roleId));
  assert(personaOut.hasRole(defaultRoleset.findRole(/\/reader$/).roleId));
  assert(personaOut.hasRole(new URL(`${defaultRoleset.findRole(/\/reader$/).roleId}`)));
});

