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

describe('add(test)', () => {
  it('adds `snyk` dependency and `test` script', () => {
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
});

describe('add(protect)', () => {
  it('adds `@snyk/protect` dependency and `prepare` / `snyk-protect` scripts', () => {
    const pkg = {};
    lib.add(pkg, 'protect', v, undefined, 'yarn');

    expect(pkg).toEqual({
      scripts: {
        prepare: 'yarn run snyk-protect',
        'snyk-protect': 'snyk-protect',
      },
      dependencies: {
        '@snyk/protect': `latest`,
      },
      snyk: true,
    });
  });

  it('adds `@snyk/protect` dependency when a protect script exists but the dependency is missing', () => {
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
        '@snyk/protect': `latest`,
        ...fixtureDependencies
      },
      snyk: true,
    });
  });

  it('does not add another script if one exists already', () => {
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
        '@snyk/protect': `latest`,
        ...fixtureDependencies,
      },
      snyk: true,
    });
  });

  it('updates the same script (`prepublish`) if it exists already and adds missing `@snyk/protect` dependency', () => {
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
        '@snyk/protect': `latest`,
        ...fixtureDependencies,
      },
      snyk: true,
    });
  });

  it('updates `prepare` if both `prepare` and `prepublish` already exist and adds missing `@snyk/protect` dependency', () => {
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
        '@snyk/protect': `latest`,
        ...fixtureDependencies,
      },
      snyk: true,
    });
  });

  describe('if you are already testing', () => {
    it('keeps `snyk` in devDependencies and adds `@snyk/protect` to dependencies and adds `prepare` and `test` scripts', () => {
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
          '@snyk/protect': `latest`,
        },
        devDependencies: {
          snyk: `^${v}`,
        },
        snyk: true,
      });
    });
  });

  it('updates an existing protect script from npm to yarn', () => {
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
        '@snyk/protect': `latest`,
        ...fixtureDependencies
      },
      snyk: true,
    });
  });

  it('updates an existing protect script (with extra commands) from npm to yarn', () => {
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
        '@snyk/protect': `latest`,
        ...fixtureDependencies
      },
      snyk: true,
    });
  });
});

describe('add(test) and add(protect)', () => {
  it('add `snyk` and `@snyk/protect` to devDependencies and dependencies (respectively) and add required scripts', () => {
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
        '@snyk/protect': `latest`,
      },
      snyk: true,
    });
  });
});
