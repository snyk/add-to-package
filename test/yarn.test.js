const { test } = require('tap');
const lib = require('../lib');
const fs = require('fs');
const v = '2.0.0';

function getPkg() {
  return JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));
}

function loadFile(fileName) {
  return JSON.parse(fs.readFileSync(__dirname + '/fixtures/' + fileName, 'utf8'));
}

test('add(test)', t => {
  const pkg = getPkg();

  lib.add(pkg, 'test', v, undefined, 'yarn');
  t.match(pkg.scripts.test, 'snyk test', 'contains test command');
  t.equal(pkg.devDependencies.snyk, '^' + v, 'includes snyk and latest');

  t.end();
});

test('add(protect)', t => {
  const pkg = getPkg();
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.match(pkg.scripts.prepare, 'yarn run snyk-protect', 'contains protect command');
  t.ok(!pkg.scripts.prepublish, 'does not contain prepublish');

  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('script exists but not snyk protect (protect)', t => {
  const pkg = loadFile('missing-snyk-protect-package-yarn.json');

  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.match(pkg.scripts.prepublish, 'yarn run snyk-protect', 'prepublish preserved');
  t.ok(!pkg.scripts.prepare, 'prepare not added');
  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('do not add another script if one exists (protect)', t => {
  const pkg = loadFile('with-prepublish-package-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.equal(pkg.scripts.prepublish, 'yarn run snyk-protect', 'contains protect command');
  t.ok(!pkg.scripts.prepare, 'prepare not added');

  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('update the same script that exists (protect)', t => {
  const pkg = loadFile('prepublish-without-snyk-package-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.equal(pkg.scripts.prepublish, 'yarn run snyk-protect && yarn run build', 'contains protect command');
  t.ok(!pkg.scripts.prepare, 'prepare not added');

  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('if both prepare/prepublish exists update first one (protect)', t => {
  const pkg = loadFile('with-prepare-and-prepublish-package-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.equal(pkg.scripts.prepare, 'yarn run snyk-protect && yarn run test', 'contains protect command');
  t.equal(pkg.scripts.prepublish, 'yarn run build', 'prepublish not changed');

  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('default to prepare (protect)', t => {
  const pkg = getPkg();
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.equal(pkg.scripts.prepare, 'yarn run snyk-protect', 'contains protect command');
  t.ok(!pkg.scripts.prepublish, 'prepublish not added');

  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('add(test && protect) on empty package', t => {
  const pkg = {
    name: 'empty',
  };

  lib.add(pkg, 'test', v, undefined, 'yarn');
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.match(pkg.scripts.test, 'snyk test', 'contains test command');
  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');

  t.deepEqual(pkg, {
    name: 'empty',
    scripts: {
      'snyk-protect': 'snyk protect',
      prepare: 'yarn run snyk-protect',
      test: 'snyk test',
    },
    devDependencies: {},
    dependencies: {
      snyk: `^${v}`,
    },
    snyk: true,
  }, 'structured as expected');

  t.end();
});


test('already testing moves to prod deps when protect', t => {
  const pkg = getPkg();
  const oldVersion = '1.0.0';
  pkg.devDependencies.snyk = oldVersion;
  pkg.scripts.test = ' && snyk test';

  lib.add(pkg, 'protect', v, 'prepare', 'yarn');
  t.match(pkg.scripts.prepare, 'yarn run snyk-protect', 'contains protect command');
  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.isa(pkg.devDependencies.snyk, undefined, 'snyk stripped from devDeps');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('update the same script that exists (protect with extra commands) from npm to yarn', t => {
  const pkg = loadFile('with-prepublish-npm-but-now-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.equal(pkg.scripts.prepublish, 'yarn run snyk-protect && yarn run build', 'contains protect command');
  t.ok(!pkg.scripts.prepare, 'prepare not added');

  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});

test('update the same script that exists (protect) from npm to yarn', t => {
  const pkg = loadFile('npm-with-prepublish-simple-now-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  t.equal(pkg.scripts.prepublish, 'yarn run snyk-protect', 'contains protect command');
  t.ok(!pkg.scripts.prepare, 'prepare not added');

  t.equal(pkg.dependencies.snyk, '^' + v, 'includes snyk and latest');
  t.equal(pkg.snyk, true, 'flagged as snyk');

  t.end();
});
