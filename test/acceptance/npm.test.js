const lib = require('../../lib');
const fs = require('fs');
const path = require('path');
const v = '2.0.0';

function getPkg() {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
}

function loadFile(fileName) {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../fixtures/' + fileName), 'utf8'));
}

it('add(test)', () => {
  const pkg = getPkg();

  lib.add(pkg, 'test', v);
  expect(pkg.scripts.test).toContain('snyk test');
  expect(pkg.devDependencies.snyk).toBe('^' + v);
});

it('add(protect)', () => {
  const pkg = getPkg();

  lib.add(pkg, 'protect', v);
  expect(pkg.scripts.prepare).toContain('npm run snyk-protect');
  expect(pkg.scripts.prepublish).toBeUndefined();

  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.snyk).toBe(true);
});

it('script exists but not snyk protect (protect)', () => {
  const pkg = loadFile('missing-snyk-protect-package.json');

  lib.add(pkg, 'protect', v);
  expect(pkg.scripts.prepublish).toContain('npm run snyk-protect');
  expect(pkg.scripts.prepare).toBeUndefined();
  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.snyk).toBe(true);
});

it('do not add another script if one exists (protect)', () => {
  const pkg = loadFile('with-prepublish-package.json');
  lib.add(pkg, 'protect', v);
  expect(pkg.scripts.prepublish).toContain('npm run snyk-protect');
  expect(pkg.scripts.prepare).toBeUndefined();

  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.snyk).toBe(true);
});

it('update the same script that exists (protect)', () => {
  const pkg = loadFile('prepublish-without-snyk-package.json');
  lib.add(pkg, 'protect', v);
  expect(pkg.scripts.prepublish).toBe('npm run snyk-protect && npm run build');
  expect(pkg.scripts.prepare).toBeUndefined();

  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.snyk).toBe(true);
});

it('if both prepare/prepublish exists update first one (protect)', () => {
  const pkg = loadFile('with-prepare-and-prepublish-package.json');
  lib.add(pkg, 'protect', v);
  expect(pkg.scripts.prepare).toBe('npm run snyk-protect && npm run test');
  expect(pkg.scripts.prepublish).toBe('npm run build');

  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.snyk).toBe(true);
});

it('default to prepare (protect)', () => {
  const pkg = getPkg();
  lib.add(pkg, 'protect', v);
  expect(pkg.scripts.prepare).toBe('npm run snyk-protect');
  expect(pkg.scripts.prepublish).toBeUndefined();

  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.snyk).toBe(true);
});

it('add(protect) npm 5', () => {
  const pkg = getPkg();

  lib.add(pkg, 'protect', v, 'prepare');
  expect(pkg.scripts.prepare).toContain('npm run snyk-protect');
  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.snyk).toBe(true);
});

it('add(test && protect) on empty package', () => {
  const pkg = {
    name: 'empty',
  };

  lib.add(pkg, 'test', v);
  lib.add(pkg, 'protect', v);
  expect(pkg.scripts.test).toContain('snyk test');
  expect(pkg.dependencies.snyk).toBe('^' + v);

  expect(pkg).toEqual({
    name: 'empty',
    scripts: {
      'snyk-protect': 'snyk protect',
      prepare: 'npm run snyk-protect',
      test: 'snyk test',
    },
    devDependencies: {},
    dependencies: {
      snyk: `^${v}`,
    },
    snyk: true,
  });
});

it('already testing moves to prod deps when protect', () => {
  const pkg = getPkg();
  const oldVersion = '1.0.0';
  pkg.devDependencies.snyk = oldVersion;
  pkg.scripts.test = ' && snyk test';

  lib.add(pkg, 'protect', v, 'prepare');
  expect(pkg.scripts.prepare).toContain('npm run snyk-protect');
  expect(pkg.dependencies.snyk).toBe('^' + v);
  expect(pkg.devDependencies.snyk).toBeUndefined();
  expect(pkg.snyk).toBe(true);
});
