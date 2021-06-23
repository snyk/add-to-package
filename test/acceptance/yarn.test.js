const lib = require('../../lib');
const fs = require('fs');
const path = require('path');
const v = '2.0.0';

function loadFile(fileName) {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../fixtures/' + fileName), 'utf8'));
}

// these are in each fixture package.json
const fixtureDependencies = {
  '@google-cloud/promisify': '^0.3.0',
  '@snyk/email-templates': '1.14.1',
  debug: '2.6.7',
  lodash: '^1.3.1',
  semver: '3.0.0'
}

it('add(test)', () => {
  const pkg = {};
  lib.add(pkg, 'test', v, undefined, 'yarn');

  expect(pkg).toEqual({
    scripts: {
      test: 'snyk test'
    },
    devDependencies: {
      snyk: `^${v}`,
    }
  });
});

it('add(protect)', () => {
  const pkg = {};
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    scripts: {
      prepare: 'yarn run snyk-protect',
      'snyk-protect': 'snyk-protect',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
    },
    snyk: true,
  });
});

it('script exists but not snyk protect (protect)', () => {
  const pkg = loadFile('missing-snyk-protect-package-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      prepublish: 'yarn run snyk-protect',
      'snyk-protect': 'snyk-protect',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
      ...fixtureDependencies
    },
    snyk: true,
  });
});

it('do not add another script if one exists (protect)', () => {
  const pkg = loadFile('with-prepublish-package-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk-protect',
      'prepublish': 'yarn run snyk-protect',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
      ...fixtureDependencies,
    },
    snyk: true,
  });
});

it('update the same script that exists (protect)', () => {
  const pkg = loadFile('prepublish-without-snyk-package-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk-protect',
      'prepublish': 'yarn run snyk-protect && yarn run build',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
      ...fixtureDependencies,
    },
    snyk: true,
  });
});

it('if both prepare/prepublish exists update first one (protect)', () => {
  const pkg = loadFile('with-prepare-and-prepublish-package-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');
  
  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk-protect',
      'prepublish': 'yarn run build',
      'prepare': 'yarn run snyk-protect && yarn run test',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
      ...fixtureDependencies,
    },
    snyk: true,
  });
});

it('default to prepare (protect)', () => {
  const pkg = {};
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    scripts: {
      'snyk-protect': 'snyk-protect',
      'prepare': 'yarn run snyk-protect',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
    },
    snyk: true,
  });
});

it('add(test && protect) on empty package', () => {
  const pkg = {
    name: 'empty',
  };
  lib.add(pkg, 'test', v, undefined, 'yarn');
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    name: 'empty',
    scripts: {
      'snyk-protect': 'snyk-protect',
      prepare: 'yarn run snyk-protect',
      test: 'snyk test',
    },
    devDependencies: {
      snyk: `^${v}`,
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
    },
    snyk: true,
  });
});

it('keeps `snyk` in devDependencies and adds `@snyk/protect` to dependencies if already testing and you add protect', () => {
  const pkg = {
    scripts: {
      test: ' && snyk test',
    },
    devDependencies: {
      snyk: '1.0.0',
    },
  };
  
  lib.add(pkg, 'protect', v, 'prepare', 'yarn');

  expect(pkg).toEqual({
    scripts: {
      'snyk-protect': 'snyk-protect',
      prepare: 'yarn run snyk-protect',
      test: ' && snyk test',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
    },
    devDependencies: {
      snyk: `^${v}`,
    },
    snyk: true,
  });
});

it('update the same script that exists (protect with extra commands) from npm to yarn', () => {
  const pkg = loadFile('with-prepublish-npm-but-now-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk-protect',
      prepublish: 'yarn run snyk-protect && yarn run build',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
      ...fixtureDependencies
    },
    snyk: true,
  });
});

it('update the same script that exists (protect) from npm to yarn', () => {
  const pkg = loadFile('npm-with-prepublish-simple-now-yarn.json');
  lib.add(pkg, 'protect', v, undefined, 'yarn');

  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk-protect',
      prepublish: 'yarn run snyk-protect',
    },
    dependencies: {
      '@snyk/protect': `^${v}`,
      ...fixtureDependencies
    },
    snyk: true,
  });
});
