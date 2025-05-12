// deno test --allow-import ./test/role_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import { 
  Role, RoleId, role_id, I18nText, Language, platformRoleset, irl,
} from '../mod.mjs';


Deno.test('platform has a default roleset', () => {
  // console.group(`Platform roleset has base <${platformRoleset.base}>:`);
  // for (const role of platformRoleset.all) {
  //   console.group(`Role has ID <${role.roleId}>:`)
  //   console.group(`Description:`)
  //   for (const lang of role.description.getLangs()) {
  //     console.info(role.description.getText(lang));
  //   }
  //   console.groupEnd();
  //   console.groupEnd();
  // }
  // console.groupEnd();

  const 
  lastBaseChar = `${platformRoleset.base}`[`${platformRoleset.base}`.length];
  for (const role of platformRoleset.all) {
    const 
    roleIdMatcher    = `${role.roleId}`.split(lastBaseChar).pop(),
    platformPeerRole = platformRoleset.findRole(roleIdMatcher);

    assertInstanceOf(platformPeerRole, Role);
    for (const lang of role.description.getLangs()) {
      assertEquals(role.description.getText(lang), platformPeerRole.description.getText(lang));
    }
  }

});


Deno.test('roleset can be copied', () => {
  const
  rolesetBase = irl`https://site.example/id#`,
  roleset     = platformRoleset.copy(rolesetBase);

  // console.debug(`roleset`,JSON.stringify(roleset));
  assertEquals(platformRoleset.all.length, roleset.all.length);
  for (const role of roleset.all) {
    const 
    roleIdMatcher    = `${role.roleId}`.split('#').pop(),
    platformPeerRole = platformRoleset.findRole(roleIdMatcher);

    assertInstanceOf(platformPeerRole, Role);
    for (const lang of role.description.getLangs()) {
      assertEquals(role.description.getText(lang), platformPeerRole.description.getText(lang));
    }
  }

  // console.group(`Site roleset has base <${roleset.base}>:`);
  // for (const role of roleset.all) {
  //   console.group(`Role has ID <${role.roleId}>:`)
  //   console.group(`Description:`)
  //   for (const lang of role.description.getLangs()) {
  //     console.info(role.description.getText(lang));
  //   }
  //   console.groupEnd();
  //   console.groupEnd();
  // }
  // console.groupEnd();

});


Deno.test('role can be written as rdf and then read back', () => {
  const
  en     = Language.fromCode('en'),
  roleIn = new Role({
    roleId     : role_id`https://vocab.qworum.net/id/role/unrestricted`,
    description: new I18nText().setText('The user can perform all actions in Qworum services.', en)
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


