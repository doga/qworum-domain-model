// deno test --allow-import ./test/id_test.mts

import {assertInstanceOf, assertEquals, assertNotEquals, assertThrows, assertFalse, assert } from "jsr:@std/assert@1";
import {IRI, iri, Id, PersonaId, CollabId, OrgId, GroupId, UserId, PasswordId, userid, orgid } from '../mod.mjs';


Deno.test('ids can be written as rdf and then read back', () => {
  [CollabId, OrgId, GroupId, UserId, PersonaId].forEach(
    idClass => {
      const
      id      = idClass.uuid(),
      dataset = id.toDataset(),
      ids     = idClass.readFrom(dataset),
      oneId   = idClass.readOneFrom(dataset);
    
      // console.debug(`id`,id);
      // console.debug(`dataset`,dataset);
      // console.debug(`ids`,ids);
    
      assertEquals(dataset.size, 1);
      assert(id.equals(ids[0]));
      assert(id.equals(oneId));
      assertEquals(`${id}`, `${ids[0]}`);
      assertEquals(`${id}`, `${oneId}`);
    }
  );

});


Deno.test('generate password id', () => {
  const id = new PasswordId('urn:qworum:password:1234');
  // console.debug(`[test] id: ${id}`, id);
  assertInstanceOf(id, PasswordId); 
});

Deno.test('generate org id', () => {
  const id = orgid`urn:qworum:org:1234`;
  // console.debug(`[test] id: ${id}`, id);
  assertInstanceOf(id, OrgId); 
});

Deno.test('generate user id', () => {
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
