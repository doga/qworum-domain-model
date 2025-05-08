// deno test --allow-import ./test/membership_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import {EmailUrl} from '../mod.mjs';


Deno.test('email address can be converted to url and then read back', () => {
  const
  emailAddress = 'me@email.example',
  urlStr       = `mailto:${emailAddress}`,
  url          = new EmailUrl(urlStr);

  assertEquals(url.emailAddress, emailAddress);
  assertEquals(`${url}`, urlStr);
});


