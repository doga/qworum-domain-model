// deno test --allow-import ./test/persona_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert, assertArrayIncludes,
} from 'jsr:@std/assert@1';

// import { rdf } from '../deps.mjs';

import { 
  GroupId, GroupIdSet,
  Role, defaultRoleset, IRL, irl,
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

downloaderRoleId          = defaultRoleset.findRole(/\/downloader$/).roleId,
uploaderRoleId            = defaultRoleset.findRole(/\/uploader$/).roleId,
transferrerRoleId         = defaultRoleset.findRole(/\/transferrer$/).roleId,
readerRoleId              = defaultRoleset.findRole(/\/reader$/).roleId,
upserterRoleId            = defaultRoleset.findRole(/\/upserter$/).roleId,
writerRoleId              = defaultRoleset.findRole(/\/writer$/).roleId,
xRoleId                   = irl`http://x.example/roles/1`,
yRoleId                   = irl`http://y.example/roles/1`,
userRoleIds               = [upserterRoleId, uploaderRoleId, xRoleId],           // user has all roles in defaultRoleset, plus another role in another roleset
groupRoleIds              = [upserterRoleId],                                   // group only has reader role in defaultRoleset
userHasAllRolesByDefault  = false,
groupHasAllRolesByDefault = false,
persona                   = new Persona({
  groupId, userId, groupVcard, userVcard, 
  partnerGroupIds,
  userRoleIds, 
  groupRoleIds, 
  userHasAllRolesByDefault,
  groupHasAllRolesByDefault,
});


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

  assertEquals(persona.userRoleIds.length, userRoleIds.length);
  assertEquals(persona.userRoleIds.length, personaOut.userRoleIds.length);
  assertInstanceOf(personaOut.userRoleIds[0], IRL);
  assert(persona.userRoleIds[0].equals(personaOut.userRoleIds[0]));

  assertThrows(() => personaOut.hasRole(1));
  assert(personaOut.hasRole(readerRoleId, upserterRoleId, writerRoleId));
  assert(personaOut.hasRole(new URL(`${readerRoleId}`), upserterRoleId, writerRoleId));
  assertFalse(personaOut.hasRole(uploaderRoleId));
  assert(personaOut.hasRole(irl`http://site.example/roles/1`));
});



Deno.test('persona can decide if user+group has a certain role', () => {
  const
  personas = {
    closedPartnership: {
      closedGroup: new Persona({
        groupId, userId, groupVcard, userVcard, 
        partnerGroupIds,
        userRoleIds, 
        groupRoleIds, 
        userHasAllRolesByDefault: false, // user in group
        groupHasAllRolesByDefault: false, // group in partnership
      }),
      openGroup: new Persona({
        groupId, userId, groupVcard, userVcard, 
        partnerGroupIds,
        userRoleIds, 
        groupRoleIds, 
        userHasAllRolesByDefault: true,
        groupHasAllRolesByDefault: false,
      }),
    },
    openPartnership: {
      closedGroup: new Persona({
        groupId, userId, groupVcard, userVcard, 
        partnerGroupIds,
        userRoleIds, 
        groupRoleIds, 
        userHasAllRolesByDefault: false, // user in group
        groupHasAllRolesByDefault: true, // group in partnership
      }),
      openGroup: new Persona({
        groupId, userId, groupVcard, userVcard, 
        partnerGroupIds,
        userRoleIds, 
        groupRoleIds, 
        userHasAllRolesByDefault: true,
        groupHasAllRolesByDefault: true,
      }),
    },
  };

  /** @type {Persona} */
  let persona = personas.closedPartnership.closedGroup;

  // partnership closed, group closed
  persona = personas.closedPartnership.closedGroup;
  assert(persona.hasRole(readerRoleId, defaultRoleset.getSuperRolesOf(readerRoleId)));
  assertFalse(persona.hasRole(uploaderRoleId, defaultRoleset.getSuperRolesOf(uploaderRoleId)));
  assertFalse(persona.hasRole(writerRoleId, defaultRoleset.getSuperRolesOf(writerRoleId)));
  assertFalse(persona.hasRole(xRoleId));
  assertFalse(persona.hasRole(yRoleId));

  // partnership closed, group open
  persona = personas.closedPartnership.openGroup;
  assert(persona.hasRole(readerRoleId, defaultRoleset.getSuperRolesOf(readerRoleId)));
  assertFalse(persona.hasRole(uploaderRoleId, defaultRoleset.getSuperRolesOf(uploaderRoleId)));
  assertFalse(persona.hasRole(writerRoleId, defaultRoleset.getSuperRolesOf(writerRoleId)));
  assertFalse(persona.hasRole(xRoleId));
  assertFalse(persona.hasRole(yRoleId));

  // partnership open, group closed
  persona = personas.openPartnership.closedGroup;
  assert(persona.hasRole(readerRoleId, defaultRoleset.getSuperRolesOf(readerRoleId)));
  assertFalse(persona.hasRole(uploaderRoleId, defaultRoleset.getSuperRolesOf(uploaderRoleId)));
  assertFalse(persona.hasRole(writerRoleId, defaultRoleset.getSuperRolesOf(writerRoleId)));
  assert(persona.hasRole(xRoleId));
  assertFalse(persona.hasRole(yRoleId));

  // partnership open, group open
  persona = personas.openPartnership.openGroup;
  assert(persona.hasRole(readerRoleId, defaultRoleset.getSuperRolesOf(readerRoleId)));
  assertFalse(persona.hasRole(uploaderRoleId, defaultRoleset.getSuperRolesOf(uploaderRoleId)));
  assertFalse(persona.hasRole(writerRoleId, defaultRoleset.getSuperRolesOf(writerRoleId)));
  assert(persona.hasRole(xRoleId));
  assert(persona.hasRole(yRoleId));

});

