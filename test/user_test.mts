// deno test --allow-import ./test/user_test.mts

import { assertInstanceOf, assertEquals, assertNotEquals, assert } from 'jsr:@std/assert@1';
import { QRM, } from '../lib/util/rdf-prefixes.mjs';
import { rdf } from '../deps.mjs';
import { iri, Password, User, bareuserid, baregroupid } from '../mod.mjs';


Deno.test('user is written to rdf dataset and read back', () => {
  // console.debug('[test]');
  const 
  userId          = bareuserid`1234`,
  personalGroupId = baregroupid`1234`,
  passwordId      = iri`${QRM}id/password/1234`;

  if(!(userId && passwordId && personalGroupId)) return;

  const
  passwordCleartext = 'a-password',
  password          = new Password(passwordId, passwordCleartext),
  userIn            = new User({userId, personalGroupId, password}),
  dataset           = rdf.dataset();

  // console.debug('[test] userIn', userIn);
  userIn.writeTo(dataset);
  // console.debug('[test] dataset', dataset);

  const usersOut = User.readFrom(dataset);
  // console.debug('[test] usersOut', usersOut);
  assertInstanceOf(usersOut, Array);
  assertEquals(usersOut.length, 1);

  const userOut = usersOut[0];
  assertInstanceOf(userOut, User);
  assert(userOut.userId.equals(userId));
  assertInstanceOf(userOut.password, Password);
  assert(userOut.password.equals(password));
  assertEquals(`${userOut.password.passwordId}`, `${passwordId}`);
});
