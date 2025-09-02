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
  drafter  = roleset.findRole('drafter'),

  /** @type {(Role | null)} */
  reader   = roleset.findRole('reader'),

  /** @type {(Role | null)} */
  upserter = roleset.findRole('upserter'),

  /** @type {(Role | null)} */
  writer   = roleset.findRole('writer'),
  
  /** @type {Role[]} */
  drafterDescendents  = roleset.getDescendentsOf(drafter),

  /** @type {Role[]} */
  readerDescendents   = roleset.getDescendentsOf(reader),

  /** @type {Role[]} */
  upserterDescendents = roleset.getDescendentsOf(upserter),

  /** @type {Role[]} */
  writerDescendents   = roleset.getDescendentsOf(writer);

  // console.debug(`writer ${writer.roleId}`,);

  assertEquals(drafterDescendents.length,  0, 'drafter does not have any descendents');
  assertEquals(readerDescendents.length,   2, 'reader has 2 descendents');
  assertEquals(upserterDescendents.length, 1, 'upserter has 1 descendent');
  assertEquals(writerDescendents.length,   0, 'writer does not have any descendents');

  assertInstanceOf(readerDescendents.find(r => r.equals(upserter)), Role);
  assertInstanceOf(readerDescendents.find(r => r.equals(writer)), Role);
  assertInstanceOf(upserterDescendents.find(r => r.equals(writer)), Role);

});



Deno.test(`roleset's general set seems valid`, () => {
  const
  /** @type {Roleset} */
  roleset = defaultRoleset,

  /** @type {Role[]} */
  generalSet = roleset.generalSet;

  // for (const generalRole of generalSet) {
  //   console.debug(`generalRole <${generalRole.roleId}>`);
  // }

  for (const role of roleset.roles) {
    if (!roleset.roles.find(r => role.roleId.equals(r.parentRoleId))) {
      assert(generalSet.find(r => r.roleId.equals(role.roleId)));
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
  drafter  = rsOut.findRole('drafter');

  assertInstanceOf(writer, Role);
  assertInstanceOf(upserter, Role);
  assertInstanceOf(reader, Role);
  assertInstanceOf(drafter, Role);

  assertFalse(reader.parentRoleId);
  assertFalse(drafter.parentRoleId);
  assert(writer.parentRoleId.equals(upserter.roleId));
  assert(upserter.parentRoleId.equals(reader.roleId));

  const
  langs = rsOut.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);

});

