// deno test --allow-import --allow-read ./test/vcard_test.mts

import {assertInstanceOf, assertEquals, assertGreaterOrEqual, assertThrows, assertNotEquals, assert } from "jsr:@std/assert@1";
import { 
  rdfTerm as t, rdf,
  ICAL, IRI, URN, iri 
} from "../deps.mjs";
import { 
  OrgVcard, GroupVcard, IndividualVcard, 
  Email, PhoneUrl, Photo, 
  Id, OrgId, GroupId, UserId,
} from '../mod.mjs';

const 
individualVcardFiles = [
  'user1-vcard3.vcard', 'user2-vcard3.vcard', 
],
orgVcardFiles = [
  'org1-vcard3.vcard', 'org2-vcard3.vcard', 
  'org-vcard4.vcard',
],
groupVcardFiles = [
  'group-vcard4.vcard'
],
vcardFiles = [...individualVcardFiles, ...orgVcardFiles, ...groupVcardFiles];


Deno.test("ical can parse vcard string", async () => {
  for (const vcardFile of vcardFiles) {
    const
    vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
    vcard    = ICAL.parse(vcardStr);
    // console.debug(vcard);

    assertInstanceOf(vcard, Array);
    assertGreaterOrEqual(vcard.length, 2);
    assertEquals(vcard[0], 'vcard');
    assertInstanceOf(vcard[1], Array);
    for (const item of vcard[1]) {
      assertInstanceOf(item, Array);
      assertEquals(item.length, 4);
      assert(typeof item[0] === 'string');
      assert(typeof item[1] === 'object' && !(item[1] instanceof Array));
      assert(typeof item[2] === 'string');
    }
  }
});


Deno.test("individual vcard objects can be created from vcard strings", async () => {
  for (const vcardFile of individualVcardFiles) {
    const
    userId   = UserId.create('1234'),
    vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
    vcard    = IndividualVcard.fromString(userId, vcardStr);

    (vcard as {ownerId: any}).ownerId = iri`urn:qworum:vcard:1234`;

    // console.debug(`[test] vcard:`, vcard);

    assertInstanceOf(vcard, IndividualVcard);
    assertInstanceOf(vcard.ownerId, IRI);
    assertInstanceOf(vcard.ownerId, URN);
    assert(typeof vcard?.formattedName === 'string');
    if(vcard?.org) assert(typeof vcard?.org === 'string');
    if(vcard?.nickname) assert(typeof vcard?.nickname === 'string');
    assertInstanceOf(vcard?.emails, Array);
    for (const email of vcard?.emails) {
      assertInstanceOf(email, Email);
    }
    if(vcard?.photo) {
      assertInstanceOf(vcard?.photo, Photo);
      assert(`${vcard?.photo?.imageMimeType}`, 'image/jpeg');
    }
  }
});


Deno.test("org vcard objects can be created from vcard strings", async () => {
  for (const vcardFile of orgVcardFiles) {
    // console.debug(`[test] vcardFile: ${vcardFile}`);
    const
    orgId    = OrgId.create('5678'),
    vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
    vcard    = OrgVcard.fromString(orgId, vcardStr);

    assertInstanceOf(vcard, OrgVcard);
    assert(typeof vcard?.formattedName === 'string');
    assert(typeof vcard?.org === 'string');
    if(vcard?.nickname) assert(typeof vcard?.nickname === 'string');
    assertInstanceOf(vcard?.emails, Array);
    for (const email of vcard?.emails) {
      assertInstanceOf(email, Email);
    }
    if(vcard?.photo) {
      assertInstanceOf(vcard?.photo, Photo);
      assert(`${vcard?.photo?.imageMimeType}`, 'image/jpeg');
    }
  }
});


Deno.test("group vcard objects can be created from vcard strings", async () => {
  for (const vcardFile of groupVcardFiles) {
    // console.debug(`[test] vcardFile: ${vcardFile}`);
    const
    groupId  = GroupId.create('5678'),
    vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
    vcard    = GroupVcard.fromString(groupId, vcardStr);

    assertInstanceOf(vcard, GroupVcard);
    assert(typeof vcard?.formattedName === 'string');
    assert(typeof vcard?.org === 'string');
    if(vcard?.nickname) assert(typeof vcard?.nickname === 'string');
    assertInstanceOf(vcard?.emails, Array);
    for (const email of vcard?.emails) {
      assertInstanceOf(email, Email);
    }
    if(vcard?.photo) {
      assertInstanceOf(vcard?.photo, Photo);
      assert(`${vcard?.photo?.imageMimeType}`, 'image/jpeg');
    }
  }
});


Deno.test("Vcards are written to an RDF dataset and then read back", async () => {
  for (const vcardFile of groupVcardFiles) {
    // console.debug(`[test] reading vcard from file: ${vcardFile}`);
    const
    groupId  = GroupId.create('5678'),
    vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
    vcardIn  = GroupVcard.fromString(groupId, vcardStr),
    dataset  = rdf.dataset();

    vcardIn.writeTo(dataset);
    // console.debug(dataset);
    // console.debug(`[test] reading vcard from dataset`, dataset);

    const 
    vcards   = GroupVcard.readFrom(dataset),
    vcardOut = vcards[0];

    assertEquals(vcards.length, 1);
    assertInstanceOf(vcardOut, GroupVcard);
    assert(typeof vcardOut?.formattedName === 'string');
    assert(typeof vcardOut?.org === 'string');
    if(vcardOut?.nickname) assert(typeof vcardOut?.nickname === 'string');
    assertInstanceOf(vcardOut?.emails, Array);
    for (const email of vcardOut?.emails) {
      assertInstanceOf(email, Email);
    }
    if(vcardOut?.photo) {
      assertInstanceOf(vcardOut?.photo, Photo);
      assert(`${vcardOut?.photo?.imageMimeType}`, 'image/jpeg');
    }
  }
});


// Deno.test("person vcard can be transformed to rdf", async () => {
//   for (const vcardFile of individualVcardFiles) {
//     const
//     vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
//     vcard        = IndividualVcard.fromString(vcardStr);
//     assertInstanceOf(vcard, IndividualVcard);
    
//     const
//     vcardDataset = vcard?.toRdfDataset(UserId.create('1234')),
//     vcardRdfJson = serialiseToRdfJson(vcardDataset);

//     // console.debug(vcardRdfJson);

//     assert(typeof vcardRdfJson === 'object' && !(vcardDataset instanceof Array));
//   }
// });


// Deno.test("org vcard can be transformed to rdf", async () => {
//   for (const vcardFile of orgVcardFiles) {
//     const
//     vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
//     vcard    = OrgVcard.fromString(vcardStr);
//     assertInstanceOf(vcard, OrgVcard);
    
//     const
//     vcardDataset = vcard?.toRdfDataset(UserId.create('1234')),
//     vcardRdfJson = serialiseToRdfJson(vcardDataset);

//     // console.debug(vcardRdfJson);

//     assert(typeof vcardRdfJson === 'object' && !(vcardDataset instanceof Array));
//   }
// });


Deno.test("bad vcard string throws error", () => {
  assertThrows(() => IndividualVcard.fromString(UserId.create('1234'), 'vcardStr'));
});


// Deno.test("user can set vcard in Qworum's central database", async () => {
//   const 
//   user     = await User.create(),
//   userdata = new UserData(user.userId, user.password),
//   vcardStr = await Deno.readTextFile('./test/assets/user1.vcard'),
//   vcard    = IndividualVcard.fromString(vcardStr);

//   assertInstanceOf(user, User);
//   assertInstanceOf(userdata, UserData);
//   assertInstanceOf(vcard, Vcard);

//   await userdata.setVcard(vcard);
// });

Deno.test("tel url does not contains whitespace", async () => {
  const 
  tel = new PhoneUrl('+41 76 681 21 96');

  // console.debug(`${tel}`);

  assertInstanceOf(tel, PhoneUrl);
});


// Deno.test("template", async () => {

// });

