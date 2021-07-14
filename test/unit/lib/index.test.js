const lib = require("../../../lib/index");

describe("isProtecting", () => {
  it("returns false if protect command found in any of `prepare`, `prepare`, or `postinstall`", () => {
    const pkg = {
      scripts: {},
    };
    const protecting = lib.isProtecting(pkg, "npm");
    expect(protecting).toBe(false);
  });

  it("returns true if protect command found in `prepare`", () => {
    const pkg = {
      scripts: {
        prepare: "npm run snyk-protect",
      },
    };
    const protecting = lib.isProtecting(pkg, "npm");
    expect(protecting).toBe(true);
  });

  it("returns true if protect command found in `prepublish`", () => {
    const pkg = {
      scripts: {
        prepublish: "npm run snyk-protect",
      },
    };
    const protecting = lib.isProtecting(pkg, "npm");
    expect(protecting).toBe(true);
  });

  it("returns true if protect command found in `postinstall`", () => {
    const pkg = {
      scripts: {
        postinstall: "npm run snyk-protect",
      },
    };
    const protecting = lib.isProtecting(pkg, "npm");
    expect(protecting).toBe(true);
  });
});

describe("updateSnykProtectDependency", () => {
  describe("if not protecting", () => {
    it("removes `@snyk/protect` from all dependency lists", () => {
      const pkg = {
        scripts: {},
        dependencies: {
          "@snyk/protect": "1.600.0",
        },
        devDependencies: {
          "@snyk/protect": "1.600.0",
        },
        peerDependencies: {
          "@snyk/protect": "1.600.0",
        },
        optionalDependencies: {
          "@snyk/protect": "1.600.0",
        },
      };
      lib.updateSnykProtectDependency(pkg, false, "1.650.0");
      expect(pkg.dependencies).toEqual({});
      expect(pkg.devDependencies).toEqual({});
      expect(pkg.peerDependencies).toEqual({});
      expect(pkg.optionalDependencies).toEqual({});
    });
  });

  describe("if protecting", () => {
    it("adds `@snyk/protect` to `dependencies` when not already there", () => {
      const pkg = {};
      lib.updateSnykProtectDependency(pkg, true, "1.650.0");
      expect(pkg).toEqual({
        dependencies: {
          "@snyk/protect": "latest",
        },
      });
    });

    it("updates the `@snyk/protect` version in `dependencies` when already there", () => {
      const pkg = {
        dependencies: {
          "@snyk/protect": "^1.600.0",
        },
      };
      lib.updateSnykProtectDependency(pkg, true, "1.650.0");
      expect(pkg).toEqual({
        dependencies: {
          "@snyk/protect": "latest",
        },
      });
    });
  });
});

describe("updateSnykDependency", () => {
  describe("when not testing", () => {
    it("removes `snyk` from all dependency lists", () => {
      const pkg = {
        scripts: {}, // no test script with 'snyk test' -> not testing
        dependencies: {
          snyk: "1.600.0",
        },
        devDependencies: {
          snyk: "1.600.0",
        },
        peerDependencies: {
          snyk: "1.600.0",
        },
        optionalDependencies: {
          snyk: "1.600.0",
        },
      };
      lib.updateSnykDependency(pkg, false, "1.650.0");
      expect(pkg.dependencies).toEqual({});
      expect(pkg.devDependencies).toEqual({});
      expect(pkg.peerDependencies).toEqual({});
      expect(pkg.optionalDependencies).toEqual({});
    });
  });

  describe("when testing", () => {
    it("adds `snyk` to devDependencies list", () => {
      const pkg = {};
      lib.updateSnykDependency(pkg, true, "1.650.0");
      expect(pkg).toEqual({
        devDependencies: {
          snyk: "^1.650.0",
        },
      });
    });
  });
});

describe("isTesting", () => {
  describe("returns true", () => {
    it("when `test` script is `snyk test`", () => {
      const pkg = {
        scripts: {
          test: "snyk test",
        },
      };
      expect(lib.isTesting(pkg)).toBe(true);
    });

    it("when `test` script contains `snyk test` and other stuff", () => {
      expect(
        lib.isTesting({
          scripts: {
            test: "jest && snyk test",
          },
        })
      ).toBe(true);
      expect(
        lib.isTesting({
          scripts: {
            test: "snyk test && jest",
          },
        })
      ).toBe(true);
    });
  });

  describe("returns false", () => {
    it("when `scripts` is missing", () => {
      expect(lib.isTesting({})).toBe(false);
    });

    it("when `test` script is missing", () => {
      expect(
        lib.isTesting({
          scripts: {},
        })
      ).toBe(false);
    });

    it("when `test` script is ``", () => {
      expect(
        lib.isTesting({
          scripts: {
            test: "",
          },
        })
      ).toBe(false);
    });

    it("when `test` script is contains stuff not containing `snyk test`", () => {
      expect(
        lib.isTesting({
          scripts: {
            test: "jest",
          },
        })
      ).toBe(false);
    });
  });
});
