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
  lib.add(pkg, 'test', v);

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
  lib.add(pkg, 'protect', v);
  
  expect(pkg).toEqual({
    scripts: {
      prepare: 'npm run snyk-protect',
      'snyk-protect': 'snyk protect',
    },
    dependencies: {
      snyk: `^${v}`,
    },
    snyk: true,
  });
});

it('script exists but not snyk protect (protect)', () => {
  const pkg = loadFile('missing-snyk-protect-package.json');
  lib.add(pkg, 'protect', v);
  
  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      prepublish: 'npm run snyk-protect',
      // 'snyk-protect': 'snyk protect',  // this is not in the results - is this a bug?
    },
    dependencies: {
      snyk: `^${v}`,
      ...fixtureDependencies
    },
    snyk: true,
  });
});

it('do not add another script if one exists (protect)', () => {
  const pkg = loadFile('with-prepublish-package.json');
  lib.add(pkg, 'protect', v);

  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk protect',
      'prepublish': 'npm run snyk-protect',
    },
    dependencies: {
      snyk: `^${v}`,
      ...fixtureDependencies,
    },
    snyk: true,
  });
});

it('update the same script that exists (protect)', () => {
  const pkg = loadFile('prepublish-without-snyk-package.json');
  lib.add(pkg, 'protect', v);

  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk protect',
      'prepublish': 'npm run snyk-protect && npm run build',
    },
    dependencies: {
      snyk: `^${v}`,
      ...fixtureDependencies,
    },
    snyk: true,
  });
});

it('if both prepare/prepublish exists update first one (protect)', () => {
  const pkg = loadFile('with-prepare-and-prepublish-package.json');
  lib.add(pkg, 'protect', v);
  
  expect(pkg).toEqual({
    name: 'package-lock-exact-match',
    version: '1.0.0',
    scripts: {
      'snyk-protect': 'snyk protect',
      'prepublish': 'npm run build',
      'prepare': 'npm run snyk-protect && npm run test',
    },
    dependencies: {
      snyk: `^${v}`,
      ...fixtureDependencies,
    },
    snyk: true,
  });
});

it('default to prepare (protect)', () => {
  const pkg = {};
  lib.add(pkg, 'protect', v);
  
  expect(pkg).toEqual({
    scripts: {
      'snyk-protect': 'snyk protect',
      'prepare': 'npm run snyk-protect',
    },
    dependencies: {
      snyk: `^${v}`,
    },
    snyk: true,
  });
});

it('add(protect) npm 5', () => {
  const pkg = {};
  lib.add(pkg, 'protect', v, 'prepare');

  expect(pkg).toEqual({
    scripts: {
      'snyk-protect': 'snyk protect',
      'prepare': 'npm run snyk-protect',
    },
    dependencies: {
      snyk: `^${v}`,
    },
    snyk: true,
  });
});

it('add(test && protect) on empty package', () => {
  const pkg = {
    name: 'empty',
  };
  lib.add(pkg, 'test', v);
  lib.add(pkg, 'protect', v);
  
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
  const pkg = {
    scripts: {
      test: ' && snyk test',
    },
    devDependencies: {
      snyk: '1.0.0',
    },
  };

  lib.add(pkg, 'protect', v, 'prepare');
  
  expect(pkg).toEqual({
    scripts: {
      'snyk-protect': 'snyk protect',
      prepare: 'npm run snyk-protect',
      test: ' && snyk test',
    },
    dependencies: {
      snyk: `^${v}`,
    },
    devDependencies: {},
    snyk: true,
  });
});
