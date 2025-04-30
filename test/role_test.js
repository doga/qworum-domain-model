// deno test --allow-import ./test/membership_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { 
  Role, RoleId, role_id, I18nText, Language,
} from '../mod.mjs';


Deno.test('role can be written as rdf and then read back', () => {
  const
  en     = Language.fromCode('en'),
  roleIn = new Role({
    roleId     : role_id`https://vocab.qworum.net/id/role/unrestricted`,
    description: new I18nText().setTextForLang('The user can perform all actions in Qworum services.', en)
  }),
  dataset = roleIn.toDataset(),
  roleOut = Role.readOneFrom(dataset);

  // console.debug(`roleIn`, roleIn);
  // console.debug(`dataset`, dataset);
  // console.debug(`roleOut`, roleOut);
  
  assert(roleIn.roleId.equals(roleOut.roleId));
  
  // console.debug(`roleIn`);
  assertInstanceOf(roleIn, Role);
  assertInstanceOf(roleIn.roleId, RoleId);
  assertInstanceOf(roleIn.description, I18nText);
  let langs = roleIn.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);
  
  // console.debug(`roleOut`);
  assertInstanceOf(roleOut, Role);
  assertInstanceOf(roleOut.roleId, RoleId);
  assertInstanceOf(roleOut.description, I18nText);
  langs = roleOut.description.getLangs();
  // console.debug(`langs`, langs);
  assertEquals(langs.length, 1);
  assertEquals(en.iso639_1, langs[0].iso639_1);

});


