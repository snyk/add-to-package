const { test } = require('tap');
const lib = require('../');
const fs = require('fs');
const v = '2.0.0';

function getPkg() {
  return JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));
}

test('add(test)', t => {
  const pkg = getPkg();

  lib.add(pkg, 'test', v);
  t.match(pkg.scripts.test, 'snyk test', 'contains test command');
  t.equal(pkg.devDependencies.snyk, '^' + v, 'includes snyk and latest');

  t.end();
});

test('add(protect)', t => {
  const pkg = getPkg();

  lib.add(pkg, 'protect', v);
  t.match(pkg.scripts.prepublish, 'npm run snyk-protect', 'contains protect command');
  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('add(protect) npm 5', t => {
  const pkg = getPkg();

  lib.add(pkg, 'protect', v, 'prepare');
  t.match(pkg.scripts.prepare, 'npm run snyk-protect', 'contains protect command');
  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('add(test && protect) on empty package', t => {
  const pkg = {
    name: 'empty',
  };

  lib.add(pkg, 'test', v);
  lib.add(pkg, 'protect', v);
  t.match(pkg.scripts.test, 'snyk test', 'contains test command');
  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');

  t.deepEqual(pkg, {
    name: 'empty',
    scripts: {
      'snyk-protect': 'snyk protect',
      prepublish: 'npm run snyk-protect',
      test: 'snyk test',
    },
    devDependencies: {},
    dependencies: {
      snyk: `^${v}`,
    },
    snyk: true,
  }, 'strctured as expected');

  t.end();
});


test('already testing moves to prod deps when protect', t => {
  const pkg = getPkg();
  const oldVersion = '1.0.0';
  pkg.devDependencies.snyk = oldVersion;
  pkg.scripts.test = ' && snyk test';

  lib.add(pkg, 'protect', v, 'prepare');
  t.match(pkg.scripts.prepare, 'npm run snyk-protect', 'contains protect command');
  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.isa(pkg.devDependencies.snyk, undefined, 'snyk stripped from devDeps');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});
