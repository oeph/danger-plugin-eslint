import eslint from "./index"

declare const global: any

const mockFileContents = (contents: string) => {
  const asyncContents: Promise<string> = new Promise((resolve, reject) => resolve(contents))
  return async (path: string): Promise<string> => asyncContents
}

const defaultConfig = {
  envs: ["browser"],
  useEslintrc: false,
  extends: "eslint:recommended",
}

describe("eslint()", () => {
  beforeEach(() => {
    global.warn = jest.fn()
    global.message = jest.fn()
    global.fail = jest.fn()
    global.markdown = jest.fn()
  })

  afterEach(() => {
    global.warn = undefined
    global.message = undefined
    global.fail = undefined
    global.markdown = undefined
  })

  it("does not lint anything when no files in PR", async () => {
    global.danger = {
      github: { pr: { title: "Test" } },
      git: { created_files: [], modified_files: [] },
    }

    await eslint(defaultConfig)

    expect(global.fail).not.toHaveBeenCalled()
  })

  it("does not fail when a valid file is in PR", async () => {
    global.danger = {
      github: {
        pr: { title: "Test" },
        utils: { fileContents: mockFileContents(`1 + 1;`) },
      },
      git: { created_files: ["foo.js"], modified_files: [] },
    }

    await eslint(defaultConfig)

    expect(global.fail).not.toHaveBeenCalled()
  })

  it("does not fail for bitbucket server when a valid file is in PR", async () => {
    global.danger = {
      bitbucket_server: {
        api: { getFileContents: mockFileContents(`1 + 1;`) },
      },
      git: { created_files: ["foo.js"], modified_files: [] },
    }

    await eslint(defaultConfig)

    expect(global.fail).not.toHaveBeenCalled()
  })

  it("calls fail for each eslint violation", async () => {
    global.danger = {
      github: {
        pr: { title: "Test" },
        utils: {
          fileContents: mockFileContents(
            `
          var foo = 1 + 1;
          console.log(foo);
        `.trim()
          ),
        },
      },
      git: { created_files: ["foo.js"], modified_files: [] },
    }

    await eslint(defaultConfig)

    expect(global.fail).toHaveBeenCalledTimes(2)
    expect(global.fail).toHaveBeenLastCalledWith("foo.js line 2 – 'console' is not defined. (no-undef)")
  })

  it("uses the provided eslint config", async () => {
    global.danger = {
      github: {
        pr: { title: "Test" },
        utils: {
          fileContents: mockFileContents(`
          var foo = 1 + 1;
          console.log(foo);
        `),
        },
      },
      git: { created_files: ["foo.js"], modified_files: [] },
    }

    await eslint({
      rules: {
        "no-undef": 0,
      },
    })

    expect(global.fail).not.toHaveBeenCalled()
  })
})
