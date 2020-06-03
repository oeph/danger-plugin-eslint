// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function message(message: string): void
export declare function warn(message: string): void
export declare function fail(message: string): void
export declare function markdown(message: string): void

import { CLIEngine } from "eslint"

/**
 * Eslint your code with Danger
 */
export default async function eslint(
  filesToLint: any = danger.git.created_files.concat(danger.git.modified_files),
  config: any
) {
  const cli = new CLIEngine({ baseConfig: config })
  return Promise.all(filesToLint.map(f => lintFile(cli, config, f)))
}

async function lintFile(linter, config, path) {
  let contents
  if (danger.bitbucket_server != null) {
    contents = await danger.bitbucket_server.api.getFileContents(path)
  } else if (danger.gitlab != null) {
    contents = await danger.gitlab.utils.fileContents(path)
  } else {
    contents = await danger.github.utils.fileContents(path)
  }

  const report = linter.executeOnText(contents, path)

  report.results[0].messages.map(msg => {
    if (msg.fatal) {
      fail(`Fatal error linting ${path} with eslint.`)
      return
    }

    const fn = { 1: warn, 2: fail }[msg.severity]

    fn(`${path} line ${msg.line} – ${msg.message} (${msg.ruleId})`)
  })
}
