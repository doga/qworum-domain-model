// deno test --allow-import ./test/id_test.mts

import {assertInstanceOf, assertEquals, assertNotEquals, assertThrows, assertFalse, assert } from "jsr:@std/assert@1";
import { Id, OrgId, GroupId, UserId, userid, orgid } from '../mod.mjs';

Deno.test('template generates org', () => {
  const id = orgid`urn:qworum:org:1234`;
  // console.debug(`[test] id: ${id}`, id);
  assertInstanceOf(id, OrgId); 
});

Deno.test('template generates user', () => {
  const id = userid`urn:qworum:user:1234`;
  // console.debug(`[test] id: ${id}`, id);
  assertInstanceOf(id, UserId); 
});

// Deno.test('org id', () => {
//   const
//   idType = 'org',
//   bareId = '1234',
//   orgId  = OrgId.create(bareId);

//   assertInstanceOf(orgId, OrgId);
//   assertEquals(orgId.idType, idType);
//   assertEquals(orgId.bareId, bareId);
//   assertEquals(orgId.toString(), `urn:qworum:${idType}:${bareId}`);
//   assert(orgId.equals(OrgId.create(bareId)));
//   assertFalse(orgId.equals(OrgId.create(`${bareId}${bareId}`)));

// });

Deno.test('non-conforming org id', () => {
  assertThrows(() => new OrgId('not an orgid'));
});
