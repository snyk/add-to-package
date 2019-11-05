'use strict';

const dependencies = 'dependencies';
const devDependencies = 'devDependencies';
const peerDependencies = 'peerDependencies';
const optionalDependencies = 'optionalDependencies';

module.exports = {
  add,
  updateSnykVersion,
};

function getNewScriptContent(scriptContent, cmd) {
  if (scriptContent) {
    // only add the command if it's not already in the script
    if (scriptContent.indexOf(cmd) === -1) {
      return cmd + ' && ' + scriptContent;
    }
    return scriptContent;
  }
  return cmd;
}

function addProtect(pkg, cmdScript, packageManager = 'npm') {
  if (!pkg.scripts) {
    pkg.scripts = {};
  }
  const protectCmdWithoutPkgManager = ' run snyk-protect';
  const protectCmd = packageManager + protectCmdWithoutPkgManager;

  const existingScript = [
    'prepare',
    'prepublish',
  ].find(key => pkg.scripts[key] || '');


  if (existingScript) {
    // if we have one, keep it
    cmdScript = existingScript;
    const scriptContent = pkg.scripts[existingScript];

    // if it is the wrong package manager then update it
    if (scriptContent.indexOf(protectCmdWithoutPkgManager) !== -1
      && packageManager === 'yarn') {
      const replaceCmd = 'npm' + protectCmdWithoutPkgManager;
      pkg.scripts[existingScript] = scriptContent
        .replace(replaceCmd, protectCmd);
    }
  }
  const protecting = existingScript && (pkg.scripts[existingScript].indexOf(protectCmd) !== -1);

  // don't add anything if there is already protect command
  if (!protecting) {
    pkg.scripts['snyk-protect'] = 'snyk protect';
    pkg.scripts[cmdScript] = getNewScriptContent(pkg.scripts[cmdScript], protectCmd);
  }

  // legacy check for `postinstall`, if `npm run snyk-protect` is in there
  // we'll replace it with `true` so it can be cleanly swapped out
  const postinstall = pkg.scripts.postinstall;
  if (postinstall && postinstall.indexOf(protectCmd) !== -1) {
    pkg.scripts.postinstall = postinstall.replace(protectCmd, 'true');
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

function add(pkg, type, version, cmdScript, packageManager) {
  let res = null;
  if (type === 'protect') {
    res = addProtect(pkg, cmdScript || 'prepare', packageManager);
  }

  if (type === 'test') {
    res = addTest(pkg);
  }

  if (res === null) {
    throw new Error('must specify type [protect | test]');
  }

  if (version) {
    updateSnykVersion(pkg, version, packageManager);
  }
}

function updateSnykVersion(pkg, version, packageManager = 'npm') {
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
  ].find((key) => pkg[key] && pkg[key]['snyk']);

  const scripts = pkg.scripts || {};
  const testing = (scripts.test || '').includes('snyk test');
  const protectCmd = packageManager + ' run snyk-protect';
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
