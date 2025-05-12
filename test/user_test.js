// deno test --allow-import ./test/user_test.js

import { assertInstanceOf, assertEquals, assertNotEquals, assert } from 'jsr:@std/assert@1';
import dataflow from 'https://esm.sh/gh/doga/rdf-dataflow@1.1.2/mod.mjs';

import { QRM, } from '../lib/util/rdf-prefixes.mjs';
import { iri, Password, User, bareuser_id, baregroup_id, UserId } from '../mod.mjs';
import { PasswordId } from '../lib/id.mjs';


Deno.test('user is written to rdf dataset and read back', () => {
  // console.debug('[test]');
  const 
  userId          = bareuser_id`1234`,
  personalGroupId = baregroup_id`1234`;
  if(!(userId && personalGroupId)) return;

  const
  passwordId      = PasswordId.forUser(userId);

  if(!passwordId) return;

  const
  passwordCleartext = 'a-password',
  password          = new Password(passwordId, passwordCleartext),
  userIn            = new User({userId, personalGroupId, password}),
  dataset           = userIn.toDataset();
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



Deno.test('user is read from rdf dataflow', () => {
  const 
  rdfDataflowValue = `
  {"head":{"terms":["s","p","o","g"]},"dataset":[{"s":{"type":"uri","value":"urn:qworum:user:63948b93-841f-4732-af1b-9ca22614395f"},"p":{"type":"uri","value":"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"},"o":{"type":"uri","value":"https://vocab.qworum.net/User"}},{"s":{"type":"uri","value":"urn:qworum:user:63948b93-841f-4732-af1b-9ca22614395f"},"p":{"type":"uri","value":"https://vocab.qworum.net/auth"},"o":{"type":"uri","value":"urn:qworum:password:63948b93-841f-4732-af1b-9ca22614395f"}},{"s":{"type":"uri","value":"urn:qworum:user:63948b93-841f-4732-af1b-9ca22614395f"},"p":{"type":"uri","value":"https://vocab.qworum.net/personalGroup"},"o":{"type":"uri","value":"urn:qworum:group:63948b93-841f-4732-af1b-9ca22614395f"}},{"s":{"type":"uri","value":"urn:qworum:password:63948b93-841f-4732-af1b-9ca22614395f"},"p":{"type":"uri","value":"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"},"o":{"type":"uri","value":"https://vocab.qworum.net/Password"}},{"s":{"type":"uri","value":"urn:qworum:password:63948b93-841f-4732-af1b-9ca22614395f"},"p":{"type":"uri","value":"https://vocab.qworum.net/passwordSha256"},"o":{"type":"literal","value":"b393b2bf9bca9a685cfeafaf5ba9e21da583a4f787bc211cd7501bee9ef3b4cc","datatype":"http://www.w3.org/2001/XMLSchema#string"}}]}`,
  rdfDataflowObject = JSON.parse(rdfDataflowValue),
  dataset = dataflow.toDataset(rdfDataflowObject),
  user = User.readOneFrom(dataset);

  assertInstanceOf(user, User);
  
});


