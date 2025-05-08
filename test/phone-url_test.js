// deno test --allow-import ./test/membership_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import {PhoneUrl} from '../mod.mjs';


Deno.test('phone number can be converted to url and then read back', () => {
  const
  phoneNumber = '+41-76-749-86',
  urlStr      = `tel:${phoneNumber}`,
  url         = new PhoneUrl(urlStr);

  assertEquals(url.phoneNumber, phoneNumber);
  assertEquals(`${url}`, urlStr);
});
