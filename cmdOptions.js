'use strict'

const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const cmdOptions = tryCmdOptions()

function optionDefinitions() {
  return [
    { name: 'help', alias: 'h', type: Boolean, description: 'show this help' },
    { name: 'config', alias: 'c', type: Boolean, description: 'show compilers configuration' },
    { name: 'versions', alias: 'V', type: Boolean, description: 'try to get versions for compilers' },
    { name: 'run', alias: 'r', type: Boolean, description: 'run tests' },
    { name: 'dry-run', alias: 'n', type: Boolean, description: 'don\'n run tests, but show tests and expected files' },
    { name: 'ic', type: String, defaultValue: '.', description: 'include regexp filter by compiler name' },
    { name: 'it', type: String, defaultValue: '.', description: 'include regexp filter by test group and name' },
    { name: 'ec', type: String, defaultValue: '', description: 'exclude regexp filter by compiler name' },
    { name: 'et', type: String, defaultValue: '', description: 'exclude regexp filter by test group and name' },
    { name: 'verbose', alias: 'v', type: Boolean, description: 'verbose compilers output of err, stdout, stderr' },
    { name: 'quiet', alias: 'q', type: Boolean, description: 'don\'t show passed tests report' },
    { name: 'sequental', alias: 's', type: Boolean, description: 'set to 1 both parallel tests and parallel compilers type' },
    { name: 'parallel', alias: 'p', type: Boolean, description: 'set to 100 both parallel tests and parallel compilers type' },
    { name: 'pc', type: Number, defaultValue: 5, description: 'number of parallel compiler types' },
    { name: 'pt', type: Number, defaultValue: 5, description: 'number of parallel test by single compiler type' },
  ]
}

function validateCmdOptions() {
  if (cmdOptions.sequental)
    cmdOptions.pc = cmdOptions.pt = 1
  if (cmdOptions.parallel)
    cmdOptions.pc = cmdOptions.pt = 100
  if (cmdOptions['dry-run'] && cmdOptions['run'])
    return false
  if (cmdOptions['dry-run'] && cmdOptions.quiet)
    return false
  if (cmdOptions.verbose && cmdOptions.quiet)
    return false
  if (!(cmdOptions['dry-run'] || cmdOptions.run || cmdOptions.versions || cmdOptions.config))
    return false
  return true
}

function tryCmdOptions() {
  let args
  try {
    args = commandLineArgs(optionDefinitions())
  } catch (e) {
    console.error(e.message)
    usage()
    process.exit(1)
  }
  try {
    args.it = new RegExp(args.it, 'i')
    args.ic = new RegExp(args.ic, 'i')
    args.et = args.et && new RegExp(args.et, 'i')
    args.ec = args.ec && new RegExp(args.ec, 'i')
  } catch (e) {
    console.error(e.toString())
    process.exit(1)
  }
  return args
}

function usage() {
  const usage = commandLineUsage([
    {
      header: 'Learn Languages Project',
      content: 'Make different languages inputs get same result.'
    },
    {
      header: 'Options',
      optionList: optionDefinitions()
    },
    {
      content: 'Project home: {underline https://gitflic.ru/project/evgeen/learn_languages}'
    }
  ])
  console.log(usage)
}
module.exports = { cmdOptions, tryCmdOptions, validateCmdOptions, usage }
