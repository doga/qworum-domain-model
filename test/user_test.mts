// deno test --allow-import ./test/user_test.mts

import {assertInstanceOf, assertEquals, assertNotEquals, assert } from "jsr:@std/assert@1";
import {RDF, QRM,  } from "../lib/util/rdf-prefixes.mjs";
// import t from 'https://esm.sh/gh/rdfjs/data-model@v2.1.0';
// import rdf from 'https://esm.sh/gh/rdfjs/dataset@v2.0.2';
import {rdf} from '../deps.mjs';
import {iri, IRI, IRL,  Password, User, UserId} from '../mod.mjs';

/* 
TypeScript+JavaScript compatibility error:

TS2322 [ERROR]: Type 'e | h | null' is not assignable to type 'typeof n'.
  Type 'null' is not assignable to type 'typeof n'.
  passwordId: typeof IRI = iri`${QRM}id/password/2345`,
  ~~~~~~~~~~
    at file:///Users/da/home/work/ArmangilSoftware2/code/qworum/qworum-domain-model/test/user_test.mts:13:3

TS2345 [ERROR]: Argument of type 'typeof n' is not assignable to parameter of type 'n'.
  Property '#r' is missing in type 'typeof n' but required in type 'n'.
  password   = new Password(passwordId, 'a-password'),
                            ~~~~~~~~~~
    at file:///Users/da/home/work/ArmangilSoftware2/code/qworum/qworum-domain-model/test/user_test.mts:14:29

    '#r' is declared here.
        at https://esm.sh/gh/doga/IRI@3.1.2/denonext/mod.mjs:2:13    Did you mean to use 'new' with this expression?
      password   = new Password(passwordId, 'a-password'),
                                ~~~~~~~~~~
        at file:///Users/da/home/work/ArmangilSoftware2/code/qworum/qworum-domain-model/test/user_test.mts:14:29

Found 2 errors.
*/

Deno.test('user is written to dataset and read back', () => {
  // console.debug('[test]');
  // const 
  // userId     = new UserId(`urn:qworum:user:1234`),
  // passwordId: typeof IRI = iri`${QRM}id/password/2345`,
  // password   = new Password(passwordId, 'a-password'),
  // userIn     = new User({userId, password}),
  // dataset    = rdf.dataset();

  // // console.debug('userIn', userIn);
  // userIn.writeTo(dataset);
  // console.debug('[test] dataset', dataset);

  // const usersOut = User.readFrom(dataset);
  // console.debug('[test] usersOut', usersOut);
  // assertInstanceOf(usersOut, Array);
  // assertEquals(usersOut.length, 1);
  // assertInstanceOf(usersOut[0], User);
  // assertEquals(usersOut[0].userId, userId);
  // assertInstanceOf(usersOut[0].password, Password);
  // assertEquals(`${usersOut[0].password.passwordId}`, `${passwordId}`);
});
