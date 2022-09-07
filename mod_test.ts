import { zshHistory } from "./mod.ts";

import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.144.0/testing/asserts.ts";

const fixture = "./fixture";
Deno.test("reads 5 lines from history", () => {
  zshHistory(fixture).then((items) => {
    assertEquals(items.length, 5);
  });
});

Deno.test("parses the command's time", () => {
  zshHistory(fixture).then((items) => {
    assert(items[0].time instanceof Date);
  });
});

Deno.test("parses the command", () => {
  zshHistory(fixture).then((items) => {
    assertEquals(items[2].command, "git push origin master");
  });
});

Deno.test("throws when unable to read history", () => {
  assertRejects(() => zshHistory("notafile"));
});
