// deno test --allow-import ./test/membership_test.js

import {
  assertInstanceOf, assertEquals, assertNotEquals, 
  assertThrows, assertFalse, assert,
} from 'jsr:@std/assert@1';

import {DataUrl} from '../mod.mjs';
// import {DataUrl} from '../../build/assets/js/pulled-in/doga/qworum-domain-model-0.11.0/mod.mjs';


Deno.test('data can be converted to url and then read back', () => {
  const
  
  contentType   = 'image/png',
  base64Content = 'iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAIAAAC0Ujn1AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEDSURBVEhLtZJBEoMwDAP7lr6nn+0LqUGChsVOwoGdvTSSNRz6Wh7jxvT7+wn9Y4LZae0e+rXLeBqjh45rBtOYgy4V9KYxlOpqRjmNiY4+uJBP41gOI5BM40w620AknTVwGgfSWQMK0tnOaRpV6ewCatLZxn8aJemsAGXp7JhGLBX1wYlUtE4jkIpnwKGM9xeepG7mwblMpl2/CUbCJ7+6CnQzAw5lvD/8DxGIpbMClKWzdjpASTq7gJp0tnGaDlCVzhpQkM52OB3gQDrbQCSdNSTTAc7kMAL5dIDjjj64UE4HmEh1NaM3HWAIulQwmA4wd+i4ZjwdYDR00GqWsyPrizLD76QCPOHqP2cAAAAAElFTkSuQmCC',
  urlStr       = `data:${contentType};base64,${base64Content}`,
  url           = new DataUrl(urlStr);

  assertEquals(url.contentType, contentType);
  assertEquals(url.base64Content, base64Content);
  assertEquals(`${url}`, urlStr);
});


