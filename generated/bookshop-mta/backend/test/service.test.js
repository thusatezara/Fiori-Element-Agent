import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const service = await readFile(new URL('../srv/service.cds', import.meta.url), 'utf8');
const domain = await readFile(new URL('../db/schema.cds', import.meta.url), 'utf8');
test('generated CAP contract files are traceable', async () => {
  assert.match(service, /service\s+[A-Za-z_]/);
  assert.match(domain, /entity\s+[A-Za-z_]/);
  for (const role of []) assert.ok(service.includes(role));

});

