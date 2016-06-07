'use strict';
module.exports.add = add;
module.exports.updateSnykVersion = updateSnykVersion;

const undefsafe = require('undefsafe');

function addProtect(pkg) {
  if (!pkg.scripts) {
    pkg.scripts = {};
  }

  pkg.scripts['snyk-protect'] = 'snyk protect';

  const cmd = 'npm run snyk-protect';
  const runScript = pkg.scripts.prepublish;
  if (runScript) {
    // only add the prepublish if it's not already in the prepublish
    if (runScript.indexOf(cmd) === -1) {
      pkg.scripts.prepublish = cmd + '; ' + runScript;
    }
  } else {
    pkg.scripts.prepublish = cmd;
  }

  // legacy check for `postinstall`, if `npm run snyk-protect` is in there
  // we'll replace it with `true` so it can be cleanly swapped out
  const postinstall = pkg.scripts.postinstall;
  if (postinstall && postinstall.indexOf(cmd) !== -1) {
    pkg.scripts.postinstall = postinstall.replace(cmd, 'true');
  }

  pkg.snyk = true;

  return true;
}

function addTest(pkg) {
  if (!pkg.scripts) {
    pkg.scripts = {};
  }

  const test = pkg.scripts.test;
  const cmd = 'snyk test';
  if (test && test !== 'echo "Error: no test specified" && exit 1') {
    // only add the test if it's not already in the test
    if (test.indexOf(cmd) === -1) {
      pkg.scripts.test = cmd + ' && ' + test;
    }
  } else {
    pkg.scripts.test = cmd;
  }

  return true;
}

function add(pkg, type, version) {
  let res = null;
  if (type === 'protect') {
    res = addProtect(pkg);
  }

  if (type === 'test') {
    res = addTest(pkg);
  }

  if (res === null) {
    throw new Error('must specify type [protect | test]');
  }

  if (version) {
    updateSnykVersion(pkg, version);
  }
}

function updateSnykVersion(pkg, version) {
  /**
   * 1. find where snyk is sitting
   * 2. check whether protect or test is being used, if
   *    protect is being used, move dep from devDeps to prod deps
   * 3. then upgrade the version
   */

  let key = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ].find(key => undefsafe(pkg, key + '.snyk'));

  const scripts = pkg.scripts || {};
  const testing = (scripts.test || '').includes('snyk test');
  const protectCmd = 'npm run snyk-protect';
  const protecting = [
    'prepublish',
    'postinstall',
  ].find(key => (scripts[key] || '').includes(protectCmd));

  if (testing && !key) {
    if (!pkg.devDependencies) {
      pkg.devDependencies = {};
    }

    key = 'devDependencies';
  }

  // if protecting, then always move snyk out of devdeps and optional
  if (protecting) {
    if (key === 'devDependencies' || key === 'optionalDependencies') {
      delete pkg.devDependencies.snyk;
      key = null;
    }

    if (!key) {
      key = 'dependencies';
    }
  }

  if (!pkg[key]) {
    pkg[key] = {};
  }

  pkg[key].snyk = version;
}
