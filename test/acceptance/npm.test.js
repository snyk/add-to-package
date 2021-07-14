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
});

describe('add(protect)', () => {
  it('adds `@snyk/protect` dependency and `prepare` / `snyk-protect` scripts', () => {
    const pkg = {};
    lib.add(pkg, 'protect', v);
    
    expect(pkg).toEqual({
      scripts: {
        prepare: 'npm run snyk-protect',
        'snyk-protect': 'snyk-protect',
      },
      dependencies: {
        '@snyk/protect': `latest`,
      },
      snyk: true,
    });
  });

  it('adds `@snyk/protect` dependency when a protect script exists but the dependency is missing', () => {
    const pkg = loadFile('missing-snyk-protect-package.json');
    lib.add(pkg, 'protect', v);
    
    expect(pkg).toEqual({
      name: 'package-lock-exact-match',
      version: '1.0.0',
      scripts: {
        prepublish: 'npm run snyk-protect',
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
    const pkg = loadFile('with-prepublish-package.json');
    lib.add(pkg, 'protect', v);
  
    expect(pkg).toEqual({
      name: 'package-lock-exact-match',
      version: '1.0.0',
      scripts: {
        'snyk-protect': 'snyk-protect',
        'prepublish': 'npm run snyk-protect',
      },
      dependencies: {
        '@snyk/protect': `latest`,
        ...fixtureDependencies,
      },
      snyk: true,
    });
  });

  it('updates the same script (`prepublish`) if it exists already and adds missing `@snyk/protect` dependency', () => {
    const pkg = loadFile('prepublish-without-snyk-package.json');
    lib.add(pkg, 'protect', v);
  
    expect(pkg).toEqual({
      name: 'package-lock-exact-match',
      version: '1.0.0',
      scripts: {
        'snyk-protect': 'snyk-protect',
        'prepublish': 'npm run snyk-protect && npm run build',
      },
      dependencies: {
        '@snyk/protect': `latest`,
        ...fixtureDependencies,
      },
      snyk: true,
    });
  });

  it('updates `prepare` if both `prepare` and `prepublish` already exist and adds missing `@snyk/protect` dependency', () => {
    const pkg = loadFile('with-prepare-and-prepublish-package.json');
    lib.add(pkg, 'protect', v);
    
    expect(pkg).toEqual({
      name: 'package-lock-exact-match',
      version: '1.0.0',
      scripts: {
        'snyk-protect': 'snyk-protect',
        'prepublish': 'npm run build',
        'prepare': 'npm run snyk-protect && npm run test',
      },
      dependencies: {
        '@snyk/protect': `latest`,
        ...fixtureDependencies,
      },
      snyk: true,
    });
  });

  it('works with a passed-in command name (for npm 5)', () => {
    const pkg = {};
    lib.add(pkg, 'protect', v, 'prepare');
  
    expect(pkg).toEqual({
      scripts: {
        'snyk-protect': 'snyk-protect',
        'prepare': 'npm run snyk-protect',
      },
      dependencies: {
        '@snyk/protect': `latest`,
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

      lib.add(pkg, 'protect', v, 'prepare');
      
      expect(pkg).toEqual({
        scripts: {
          'snyk-protect': 'snyk-protect',
          prepare: 'npm run snyk-protect',
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
});

describe('add(test) and add(protect)', () => {
  it('add `snyk` and `@snyk/protect` to devDependencies and dependencies (respectively) and add required scripts', () => {
    const pkg = {
      name: 'empty',
    };
    lib.add(pkg, 'test', v);
    lib.add(pkg, 'protect', v);
    
    expect(pkg).toEqual({
      name: 'empty',
      scripts: {
        'snyk-protect': 'snyk-protect',
        prepare: 'npm run snyk-protect',
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
