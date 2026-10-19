import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile } from 'node:fs/promises';

test('every HTML page has a complete, unique document shell', async () => {
  const htmlPages = (await readdir('.')).filter((file) => file.endsWith('.html')).sort();
  const pages = await Promise.all(htmlPages.map((page) => readFile(page, 'utf8')));
  const titles = pages.map((page) => page.match(/<title>([^<]+)<\/title>/)?.[1]);

  assert.ok(htmlPages.length > 0);
  pages.forEach((page) => {
    assert.match(page, /^<!doctype html>\r?\n<html lang="en">/i);
    assert.match(page, /<meta charset="utf-8"/);
    assert.match(page, /<meta name="viewport" content="width=device-width, initial-scale=1"/);
  });
  assert.ok(titles.every(Boolean));
  assert.equal(new Set(titles).size, titles.length);
});
