'use strict';

const dependencies = 'dependencies';
const devDependencies = 'devDependencies';
const peerDependencies = 'peerDependencies';
const optionalDependencies = 'optionalDependencies';

module.exports = {
  add,
  updateSnykDependency,
  updateSnykProtectDependency,
  isProtecting,
  isTesting,
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

  if (!protecting) {
    pkg.scripts[cmdScript] = getNewScriptContent(pkg.scripts[cmdScript], protectCmd);
  }

  pkg.scripts['snyk-protect'] = 'snyk-protect';

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

// cmdScript is the lifecycle script - either `prepare` or `prepublish`
function add(pkg, type, version, cmdScript, packageManager = 'npm') {
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
    const protecting = isProtecting(pkg, packageManager);
    updateSnykProtectDependency(pkg, protecting, version);
    
    const testing = isTesting(pkg);
    updateSnykDependency(pkg, testing, version);
  }
}

function isTesting(pkg) {
  const scripts = pkg.scripts || {};
  return (scripts.test || '').includes('snyk test');
}

function updateSnykDependency(pkg, testing, version) {
  if (testing) {
    const dependencyLocation = [
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies,
    ].find((location) => pkg[location] && pkg[location]['snyk']) || devDependencies;
    if (!pkg[dependencyLocation]) {
      pkg[dependencyLocation] = {};
    }
    pkg[dependencyLocation].snyk = '^' + version;
  } else {
    // don't need the `snyk` dep anymore - remove it
    removeDependency(pkg, dependencies, 'snyk');
    removeDependency(pkg, devDependencies, 'snyk');
    removeDependency(pkg, peerDependencies, 'snyk');
    removeDependency(pkg, optionalDependencies, 'snyk');
  }
}

function removeDependency(pkg, dependenciesListName, packageName) {
  // this would be simpler if we could just do, for example, `delete pkg.dependencies?.snyk`, but that syntax is not available on Node 10 / 12
  if (pkg[dependenciesListName]) {
    if (pkg[dependenciesListName][packageName]) {
      delete pkg[dependenciesListName][packageName];
    }
  }
}

function isProtecting(pkg, packageManager) {
  const scripts = pkg.scripts || {};
  const protectCmd = packageManager + ' run snyk-protect';
  return [
    'prepare',
    'prepublish',
    'postinstall',
  ].some(key => (scripts[key] || '').includes(protectCmd));
}

function updateSnykProtectDependency(pkg, protecting, version) {
  if (protecting) {
    if (!pkg.dependencies) {
      pkg.dependencies = {};
    }
    pkg.dependencies['@snyk/protect'] = `latest`;
  } else {
    removeDependency(pkg, dependencies, '@snyk/protect');
    removeDependency(pkg, devDependencies, '@snyk/protect');
    removeDependency(pkg, peerDependencies, '@snyk/protect');
    removeDependency(pkg, optionalDependencies, '@snyk/protect');
  }
}
