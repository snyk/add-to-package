'use strict';

// polyfilling a couple of ES6 bits (Array.find & String.includes)
require('core-js/fn/array/find');
require('core-js/fn/string/includes');

module.exports.add = add;
module.exports.updateSnykVersion = updateSnykVersion;

const dependencies = 'dependencies';
const devDependencies = 'devDependencies';
const peerDependencies = 'peerDependencies';
const optionalDependencies = 'optionalDependencies';

const undefsafe = require('undefsafe');

function getNewScriptContent(scriptContent, cmd) {
  if (scriptContent) {
    // only add the command if it's not already in the script
    if (scriptContent.indexOf(cmd) === -1) {
      return cmd + '; ' + scriptContent;
    }
    return scriptContent;
  }
  return cmd;
}

function addProtect(pkg, npmScript) {
  if (!pkg.scripts) {
    pkg.scripts = {};
  }

  pkg.scripts['snyk-protect'] = 'snyk protect';

  const cmd = 'npm run snyk-protect';
  pkg.scripts[npmScript] = getNewScriptContent(pkg.scripts[npmScript], cmd);

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

function add(pkg, type, version, npmScript) {
  let res = null;
  if (type === 'protect') {
    res = addProtect(pkg, npmScript || 'prepublish');
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
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies,
  ].find(key => undefsafe(pkg, key + '.snyk'));

  const scripts = pkg.scripts || {};
  const testing = (scripts.test || '').includes('snyk test');
  const protectCmd = 'npm run snyk-protect';
  const protecting = [
    'prepare',
    'prepublish',
    'postinstall',
  ].find(key => (scripts[key] || '').includes(protectCmd));

  if (testing && !key) {
    if (!pkg[devDependencies]) {
      pkg[devDependencies] = {};
    }

    key = devDependencies;
  }

  // if protecting, then always move snyk out of devdeps and optional
  if (protecting) {
    pkg.snyk = true;
    if (key === devDependencies || key === optionalDependencies) {
      delete pkg[key].snyk;
      key = null;
    }

    if (!key) {
      key = dependencies;
    }
  }

  if (!pkg[key]) {
    pkg[key] = {};
  }

  pkg[key].snyk = '^' + version;
}
