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
  // assert(writerRole.hasAncestor(rs.topRole));

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



Deno.test('roleset can be written as rdf and then read back', () => {
  const
  rsIn  = defaultRoleset,
  ds    = rsIn.toDataset(),
  rsOut = Roleset.readOneFrom(ds);

  // console.debug(`rsIn`, rsIn);
  console.debug(`dataset`, ds._quads);
  // console.debug(`rsOut`, rsOut);
  
  assertInstanceOf(rsOut, Roleset);
  assert(rsIn.rolesetId.equals(rsOut.rolesetId));
  
  // console.debug(`rsOut`);
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
  assert(writer.parentRoleId.equals(reader.roleId));
  assert(upserter.parentRoleId.equals(reader.roleId));

  const
  langs = rsOut.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);

});

