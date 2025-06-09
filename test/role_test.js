// deno test --allow-import ./test/role_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert, assertLessOrEqual, assertGreaterOrEqual,
} from 'jsr:@std/assert@1';

import { 
  iri, IRI,
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

  assert(rs.topRole instanceof Role);
  assertGreaterOrEqual(rs.roles.length, 1);
  // assert(rs.topRole.hasAncestor(rs.topRole));

  assert(writerRole instanceof Role);
  // assert(writerRole.hasAncestor(rs.topRole));

  assert(upserterRole instanceof Role);
  // assert(upserterRole.hasAncestor(writerRole));

  const topAsWriterAncestor = rs.findAncestorRole(writerRole, rs.topRole.roleId);
  assertInstanceOf(topAsWriterAncestor, Role);

});


Deno.test('role can be written as rdf and then read back', () => {
  const
  roleIn  = defaultRoleset.topRole,
  ds      = roleIn.toDataset(),
  roleOut = Role.readOneFrom(ds);

  // console.debug(`roleIn`, roleIn);
  // console.debug(`dataset`, ds);
  // console.debug(`roleOut`, roleOut);
  
  assert(roleIn.roleId.equals(roleOut.roleId));
  
  // console.debug(`roleIn`);
  assertInstanceOf(roleIn, Role);
  assertInstanceOf(roleIn.roleId, IRI);
  assertInstanceOf(roleIn.description, I18nText);
  let langs = roleIn.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);
  
  // console.debug(`roleOut`);
  assertInstanceOf(roleOut, Role);
  assertInstanceOf(roleOut.roleId, IRI);
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
  // console.debug(`dataset`, ds._quads);
  // console.debug(`rsOut`, rsOut);
  
  assertInstanceOf(rsOut, Roleset);
  assert(rsIn.rolesetId.equals(rsOut.rolesetId));
  
  // console.debug(`rsOut`);
  assertInstanceOf(rsOut.rolesetId, IRI);
  assertInstanceOf(rsOut.description, I18nText);
  assertInstanceOf(rsOut.topRole, Role);

  const
  writer   = rsOut.findRole('writer'),
  upserter = rsOut.findRole('upserter'),
  reader   = rsOut.findRole('reader'),
  drafter  = rsOut.findRole('drafter');

  assertInstanceOf(writer, Role);
  assertInstanceOf(upserter, Role);
  assertInstanceOf(reader, Role);
  assertInstanceOf(drafter, Role);

  assert(writer.parentRoleId.equals(rsOut.topRole.roleId));
  assert(upserter.parentRoleId.equals(writer.roleId));
  assert(reader.parentRoleId.equals(writer.roleId));
  assert(drafter.parentRoleId.equals(rsOut.topRole.roleId));

  const
  langs = rsOut.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);

});

