// deno test --allow-import ./test/user_test.mts

import { assertInstanceOf, assertEquals, assertNotEquals, assert } from 'jsr:@std/assert@1';
import { QRM, } from '../lib/util/rdf-prefixes.mjs';
import { rdf } from '../deps.mjs';
import { iri, Password, User, bareuserid, baregroupid, UserId } from '../mod.mjs';
import { PasswordId } from '../lib/id.mjs';


Deno.test('user is written to rdf dataset and read back', () => {
  // console.debug('[test]');
  const 
  userId          = bareuserid`1234`,
  personalGroupId = baregroupid`1234`;
  if(!(userId && personalGroupId)) return;

  const
  passwordId      = PasswordId.forUser(userId);

  if(!passwordId) return;

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
  assertInstanceOf(userOut.password.passwordId, PasswordId);
  assert(userOut.password.equals(password));
  assertEquals(`${userOut.password.passwordId}`, `${passwordId}`);
});


Deno.test('user is created with random id and password', () => {
  const 
  user = User.create();
  // console.debug('[test] user', user);

  assertInstanceOf(user, User);
  assertInstanceOf(user.userId, UserId);
  assertInstanceOf(user.password, Password);
  assertInstanceOf(user.password.passwordId, PasswordId);
  
});
