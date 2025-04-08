// deno test --allow-import ./test/user_test.mts

import {assertInstanceOf, assertEquals, assertNotEquals, assert } from "jsr:@std/assert@1";
import {RDF, QRM,  } from "../lib/util/rdf-prefixes.mjs";
import {rdf} from '../deps.mjs';
import {iri, IRI, IRL,  Password, User, UserId, bareuserid} from '../mod.mjs';


Deno.test('user is written to rdf dataset and read back', () => {
  // console.debug('[test]');
  const 
  userId     = bareuserid`1234`,
  passwordId = iri`${QRM}id/password/2345`;

  if(!(userId && passwordId))return;

  const
  passwordCleartext = 'a-password',
  password          = new Password(passwordId, passwordCleartext),
  userIn            = new User({userId, password}),
  dataset           = rdf.dataset();

  // console.debug('[test] userIn', userIn);
  userIn.writeTo(dataset);
  // console.debug('[test] dataset', dataset);

  const usersOut = User.readFrom(dataset);
  // console.debug('[test] usersOut', usersOut);
  assertInstanceOf(usersOut, Array);
  assertEquals(usersOut.length, 1);
  assertInstanceOf(usersOut[0], User);
  assertEquals(usersOut[0].userId, userId);
  assertInstanceOf(usersOut[0].password, Password);
  assertEquals(`${usersOut[0].password.passwordId}`, `${passwordId}`);
});
