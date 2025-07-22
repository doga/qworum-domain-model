// deno test --allow-import ./test/id_test.js

import {assertInstanceOf, assertNotInstanceOf, assertEquals, assertNotEquals, assertThrows, assertFalse, assert } from "jsr:@std/assert@1";
import {
  IRI, iri, Id, OrgId, GroupId, UserId, MembershipId, PartnershipId, partnership_id, PartnershipMembershipId, partnership_membership_id, PasswordId, user_id, org_id,
  UserIdSet, GroupIdSet,
} from '../mod.mjs';


Deno.test('ids can be written as rdf and then read back', () => {
  [OrgId, GroupId, UserId, MembershipId, PartnershipId, PartnershipMembershipId].forEach(
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


Deno.test('user id set', () => {
  // add, has
  const
  id1 = UserId.uuid(),
  id2 = UserId.uuid(),
  ids = new UserIdSet().add(id1).add(id2);

  // console.debug(`[test] id1: ${id1}`, id1);
  // console.debug(`[test] ids:`, ids.members);
  // console.debug(`[test] ids.size:`, ids.size);

  assert(ids.has(id1));
  assert(ids.has(id2));
  assertEquals(ids.size, 2);

  // remove
  ids.remove(id2);
  assertEquals(ids.size, 1);
  assert(ids.has(id1));
  assertFalse(ids.has(id2));

  // clone, isSameAs, isSubsetOf, isSupersetOf
  const
  idsClone = ids.clone();
  assertEquals(idsClone.size, ids.size);
  assert(idsClone.has(id1));
  assertFalse(idsClone.has(id2));
  assert(idsClone.isSameAs(ids));
  assert(idsClone.isSupersetOf(ids));
  assert(idsClone.isSubsetOf(ids));

  // clear
  const
  idsCleared = ids.clone();
  idsCleared.clear();
  assert(idsCleared.isEmpty);

  // set operations
  const
  id3  = UserId.uuid(),
  id4  = UserId.uuid(),
  ids2 = new UserIdSet().add(id3).add(id4),

  ids_ids2_intersection        = ids.intersection(ids2),
  ids_ids2_union               = ids.union(ids2),
  ids_ids2_symmetricDifference = ids.symmetricDifference(ids2);

  assert(
    ids_ids2_intersection.members.every(
      id => (
        ids.has(id) && ids2.has(id)
      )
    )
  );

  assert(
    ids_ids2_union.members.every(
      id => (
        ids.has(id) || ids2.has(id)
      )
    )
  );

  assertNotInstanceOf(
    ids_ids2_symmetricDifference.members.find(
      id => (
        ids.has(id) && ids2.has(id)
      )
    ),
    UserId
  );

  // no duplicates
  const
  ids3 = new UserIdSet().add([id1, id2, id3, id3, id1]);

  let idDuplicate = false;
  
  for (let i = 0; i < ids3.members.length; i++) {
    const idi = ids3.members[i];
    for (let j = 0; j < ids3.members.length; j++) {
      if(i === j)continue;
      const idj = ids3.members[j];
      assertFalse(idi.equals(idj));
    }
  }



});


Deno.test('generate password id', () => {
  const id = new PasswordId('urn:qworum:password:1234');
  // console.debug(`[test] id: ${id}`, id);
  assertInstanceOf(id, PasswordId); 
});

Deno.test('generate org id', () => {
  const id = org_id`urn:qworum:org:1234`;
  // console.debug(`[test] id: ${id}`, id);
  assertInstanceOf(id, OrgId); 
});

Deno.test('generate user id', () => {
  const id = user_id`urn:qworum:user:1234`;
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
  assertThrows(() => new OrgId('not an org_id'));
});
