// deno test --allow-import ./test/role_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert, assertLessOrEqual, assertGreaterOrEqual,
} from 'jsr:@std/assert@1';

import { 
  iri, IRI, IRL,
  Role, Roleset, defaultRoleset, 
  I18nText, Language, 
} from '../mod.mjs';
// import { Language } from "../deps.mjs";
// import { Role, Roleset, defaultRoleset } from "../lib/membership-annotations/role.mjs";

const 
en = Language.fromCode('en');

Deno.test('platform has a default roleset', () => {
  const 
  rs           = defaultRoleset,
  writerRole   = rs.findRole('writer'),
  upserterRole = rs.findRole('upserter');

  assert(writerRole instanceof Role);

  assert(upserterRole instanceof Role);
  // assert(upserterRole.hasAncestor(writerRole));

});


Deno.test('role can be written as rdf and then read back', () => {
  const
  roleIn  = defaultRoleset.roles[0],
  ds      = roleIn.toDataset();

  // console.debug(`dataset`, ds?._quads);

  const
  roleOut = Role.readOneFrom(ds);

  // console.debug(`roleIn`, roleIn);
  // console.debug(`roleOut`, roleOut);
  
  assert(roleIn.roleId.equals(roleOut.roleId));
  
  // console.debug(`roleIn`);
  assertInstanceOf(roleIn, Role);
  assertInstanceOf(roleIn.roleId, IRL);
  assertInstanceOf(roleIn.description, I18nText);
  let langs = roleIn.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);
  
  // console.debug(`roleOut`);
  assertInstanceOf(roleOut, Role);
  assertInstanceOf(roleOut.roleId, IRL);
  assertInstanceOf(roleOut.description, I18nText);
  langs = roleOut.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);
});



Deno.test('roleset can be queried', () => {
  const
  /** @type {Roleset} */
  roleset  = defaultRoleset,
  
  /** @type {(Role | null)} */
  uploader  = roleset.findRole('uploader'),
  
  /** @type {(Role | null)} */
  downloader  = roleset.findRole('downloader'),
  
  /** @type {(Role | null)} */
  transferrer  = roleset.findRole('transferrer'),

  /** @type {(Role | null)} */
  reader   = roleset.findRole('reader'),

  /** @type {(Role | null)} */
  upserter = roleset.findRole('upserter'),

  /** @type {(Role | null)} */
  writer   = roleset.findRole('writer'),
  
  /** @type {Role[]} */
  downloaderSuperRoles  = roleset.getSuperRolesOf(downloader),
  
  /** @type {Role[]} */
  uploaderSuperRoles  = roleset.getSuperRolesOf(uploader),
  
  /** @type {Role[]} */
  transferrerSuperRoles  = roleset.getSuperRolesOf(transferrer),

  /** @type {Role[]} */
  readerSuperRoles   = roleset.getSuperRolesOf(reader),

  /** @type {Role[]} */
  upserterSuperRoles = roleset.getSuperRolesOf(upserter),

  /** @type {Role[]} */
  writerSuperRoles   = roleset.getSuperRolesOf(writer);

  // console.debug(`writer ${writer.roleId}`,);

  assertEquals(downloaderSuperRoles.length,  1, 'downloader has 1 descendent');
  assertEquals(uploaderSuperRoles.length,  0, 'uploader does not have any descendents');
  assertEquals(transferrerSuperRoles.length,  0, 'transferrer does not have any descendents');
  assertEquals(readerSuperRoles.length,   2, 'reader has 2 descendents');
  assertEquals(upserterSuperRoles.length, 1, 'upserter has 1 descendent');
  assertEquals(writerSuperRoles.length,   0, 'writer does not have any descendents');

  assertInstanceOf(readerSuperRoles.find(r => r.equals(upserter)), Role);
  assertInstanceOf(readerSuperRoles.find(r => r.equals(writer)), Role);
  assertInstanceOf(upserterSuperRoles.find(r => r.equals(writer)), Role);
});



Deno.test(`roleset's general set seems valid`, () => {
  const
  /** @type {Roleset} */
  roleset = defaultRoleset,

  /** @type {Role[]} */
  generalSet = roleset.generalSet;

  for (const role of roleset.roles) {
    // if role is no other role's parent, then it's in general set
    if (!roleset.roles.find(r => role.roleId.equals(r.parentRoleId))) {
      assert(generalSet.find(r => r.roleId.equals(role.roleId)));
    }

    // if role is not in general set, then it has a general role as descendent
    if (!generalSet.find(r => r.roleId.equals(role.roleId))) {
      /** @type {Role[]} */
      const superRoles = roleset.getSuperRolesOf(role);

      assert(superRoles.find(r => generalSet.find(r2 => r2.roleId.equals(r.roleId))));
    }
  }
});



Deno.test('roleset can be written as rdf and then read back', () => {
  const
  rsIn  = defaultRoleset,
  ds    = rsIn.toDataset(),
  rsOut = Roleset.readOneFrom(ds);

  // console.debug(`rsIn`, rsIn);
  // console.debug(`dataset`, ds._quads);
  // console.debug(`rsOut`, rsOut);

  assertInstanceOf(rsOut, Roleset);
  assert(rsIn.rolesetId.equals(rsOut.rolesetId));
  
  assertInstanceOf(rsOut.rolesetId, IRL);
  assertInstanceOf(rsOut.description, I18nText);

  const
  writer   = rsOut.findRole('writer'),
  upserter = rsOut.findRole('upserter'),
  reader   = rsOut.findRole('reader'),
  transferrer  = rsOut.findRole('transferrer');

  assertInstanceOf(writer, Role);
  assertInstanceOf(upserter, Role);
  assertInstanceOf(reader, Role);
  assertInstanceOf(transferrer, Role);

  assertFalse(reader.parentRoleId);
  assertFalse(transferrer.parentRoleId);
  assert(writer.parentRoleId.equals(upserter.roleId));
  assert(upserter.parentRoleId.equals(reader.roleId));

  const
  langs = rsOut.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);

});

