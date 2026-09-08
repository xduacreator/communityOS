import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Exercise failure handling without connecting to Docker, SSH or production.
const sha = 'a'.repeat(40);
const mock = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const tool = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const text = args.join(' ');
fs.appendFileSync(process.env.TEST_LOG, JSON.stringify({tool, args, image: process.env.API_IMAGE})+'\\n');
if(tool === 'git') console.log('${sha}');
if(tool === 'docker') {
  if(args[0] === 'inspect') console.log('sha256:previous');
  if(args[0] === 'exec') console.log(process.env.TEST_FAILURE === 'schema' ? 'different' : 'schema');
  if(text.includes('--help')) console.log('--wait-timeout');
  const fail = process.env.TEST_FAILURE;
  if(fail === 'build' && args[1] === 'build') process.exit(1);
  if(fail === 'backup' && args.includes('backup')) process.exit(1);
  if(fail === 'up' && args[1] === 'up' && args.includes('api') && !process.env.API_IMAGE.includes('rollback')) process.exit(1);
}
if(tool === 'curl') {
  if(process.env.TEST_FAILURE === 'health') process.exit(22);
  console.log(process.env.TEST_FAILURE === 'redirect' ? '307' : '200');
}
`;

function run(failure = '') {
  const dir = mkdtempSync(join(tmpdir(), 'latih-deploy-test-'));
  try {
    mkdirSync(join(dir, 'scripts/operations'), { recursive: true });
    mkdirSync(join(dir, 'apps/api/prisma'), { recursive: true });
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'apps/api/prisma/schema.prisma'), 'schema\n');
    copyFileSync(new URL('./deploy.sh', import.meta.url), join(dir, 'scripts/operations/deploy.sh'));
    for (const tool of ['docker', 'git', 'curl', 'install', 'systemctl']) {
      writeFileSync(join(dir, 'bin', tool), mock, { mode: 0o755 });
    }
    // macOS has no flock; the real lock is held by the workflow, not this script.
    writeFileSync(join(dir, 'bin/flock'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    const result = spawnSync('bash', [join(dir, 'scripts/operations/deploy.sh'), sha], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, TEST_LOG: join(dir, 'log'), TEST_FAILURE: failure },
    });
    return { ...result, events: readFileSync(join(dir, 'log'), 'utf8').trim().split('\n').map(JSON.parse) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('healthy release backs up before replacement and enables the timer after checks', () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const backup = result.events.findIndex(e => e.args.includes('backup'));
  const replace = result.events.findIndex(e => e.args.includes('--no-build'));
  const health = result.events.findIndex(e => e.tool === 'curl');
  const timer = result.events.findIndex(e => e.tool === 'systemctl' && e.args.includes('enable'));
  assert.ok(backup >= 0 && backup < replace && replace < health && health < timer);
});

for (const failure of ['schema', 'build', 'backup']) {
  test(`${failure} failure stops before replacing running services`, () => {
    const result = run(failure);
    assert.notEqual(result.status, 0);
    assert.ok(!result.events.some(e => e.args.includes('--no-build')));
    assert.ok(!result.events.some(e => e.tool === 'systemctl'));
  });
}

for (const failure of ['up', 'health', 'redirect']) {
  test(`${failure} failure restores previous images and still fails the deployment`, () => {
    const result = run(failure);
    assert.notEqual(result.status, 0);
    assert.ok(result.events.some(e => e.args.includes('--no-build') && e.image?.includes('rollback')));
    assert.ok(!result.events.some(e => e.tool === 'systemctl'));
  });
}
