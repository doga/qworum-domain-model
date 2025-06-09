// deno test --allow-import --allow-read ./test/vcard_test.js

import {
  assert,
  assertInstanceOf, assertNotInstanceOf,
  assertEquals, assertNotEquals, assertGreaterOrEqual, 
  assertThrows, 
  assertMatch,
} from "jsr:@std/assert@1";
import { 
  ICAL, IRI, URN, iri 
} from "../deps.mjs";
import { 
  OrgVcard, GroupVcard, IndividualVcard, Vcard,
  Email, PhoneUrl, Photo, 
  Id, OrgId, GroupId, UserId,
} from '../mod.mjs';

const 
individualVcardFiles = [
  'user1-vcard3.vcard', 'user2-vcard3.vcard', 'user3-vcard3.vcard'
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


Deno.test('case 1', async () => {
    const
    userId   = UserId.create('1234'),
    vcardData = Vcard.fromString(
`BEGIN:VCARD
VERSION:3.0
PRODID:-//Apple Inc.//macOS 12.7.6//EN
N:B;A;;;
FN:A B
EMAIL;type=INTERNET;type=HOME;type=pref:a.b@email.example
NOTE:Fake vcard for testing Qworum\\n\\n#fake\\n
END:VCARD`);
    // console.debug('vcard data', vcardData);
    
    const vcard = new Vcard(userId, vcardData);
    // console.debug('vcard', vcard);
    
    const ds = vcard.toDataset();
    // console.debug('vcard ds', ds);

});


Deno.test('vcard is read from file', async () => {
    const
    userId   = UserId.create('1234'),
    vcardStr = await Deno.readTextFile(`./test/assets/user3-vcard3.vcard`),
    vcard    = IndividualVcard.fromString(userId, vcardStr);

    assertInstanceOf(vcard, IndividualVcard);
    assertInstanceOf(vcard.ownerId, Id);
    assert(vcard.ownerId.equals(userId));
    
    assertEquals(vcard.formattedName, 'Aa Jasvvvajm');
    assertEquals(`${vcard.emails[0].emailUrl.emailAddress}`, 'a.b@email.example');
    assertMatch(`${vcard.phones[0].phoneUrl.phoneNumber}`, /^\+41\D*76\D*681\D*21\D*96$/);
    assertInstanceOf(vcard.photo, Photo);
});

Deno.test('vcard is read from dataset', async () => {
    const
    userId   = UserId.create('1234'),
    vcardStr = await Deno.readTextFile(`./test/assets/user3-vcard3.vcard`),
    vcard    = IndividualVcard.fromString(userId, vcardStr);
    // console.debug(`[test] vcard`,vcard);

    const
    dataset  = vcard.toDataset();
    // console.debug(`[test] dataset`,dataset._quads);

    const
    vcard2   = IndividualVcard.readOneFrom(dataset);

    // console.debug(`[test]`);
    // console.debug(`[test] dataset`,dataset);
    // console.debug(`[test] vcard2`,vcard2);

    assertInstanceOf(vcard2, IndividualVcard);
    assertInstanceOf(vcard2.ownerId, Id);
    assert(vcard2.ownerId.equals(userId));
    
    assertEquals(vcard2.formattedName, 'Aa Jasvvvajm');

    assertEquals(vcard2.emails.length,1);
    assertEquals(`${vcard2.emails[0].emailUrl.emailAddress}`, 'a.b@email.example');

    assertEquals(vcard2.phones.length,1);
    assertMatch(`${vcard2.phones[0].phoneUrl.phoneNumber}`, /^\+41\D*76\D*681\D*21\D*96$/);

    assertInstanceOf(vcard2.photo, Photo);
});


Deno.test("individual vcard can be created in-memory", async () => {
  const
  ownerId = UserId.uuid(),
  vcard   = new IndividualVcard(ownerId, { formattedName: 'Yglkjlut Aaaroiuy' });

  // console.debug(`[test] vcard`, vcard);

});

Deno.test("individual vcard objects can be created from vcard strings", async () => {
  for (const vcardFile of individualVcardFiles) {
    const
    userId   = UserId.create('1234'),
    vcardStr = await Deno.readTextFile(`./test/assets/${vcardFile}`),
    vcard    = IndividualVcard.fromString(userId, vcardStr);

    // vcard.ownerId = iri`urn:qworum:vcard:1234`;
    // (vcard as {ownerId: any}).ownerId = iri`urn:qworum:vcard:1234`;

    // console.debug(`[test] vcard:`, vcard);

    assertInstanceOf(vcard, IndividualVcard);
    assertInstanceOf(vcard.ownerId, Id);
    assert(typeof vcard.formattedName === 'string');
    if(vcard.org) assert(typeof vcard.org === 'string');
    if(vcard.nickname) assert(typeof vcard.nickname === 'string');
    assertInstanceOf(vcard.emails, Array);
    for (const email of vcard.emails) {
      assertInstanceOf(email, Email);
    }
    if(vcard.photo) {
      assertInstanceOf(vcard.photo, Photo);
      assertEquals(`${vcard.photo.dataUrl.contentType}`, 'image/jpeg');
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
    dataset  = vcardIn.toDataset();
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


Deno.test("bad vcard string throws error", () => {
  assertThrows(() => IndividualVcard.fromString(UserId.create('1234'), 'vcardStr'));
});

