'use strict'

const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const cmdOptions = tryCmdOptions()

function optionDefinitions() {
  return [
    { name: 'help', alias: 'h', type: Boolean, description: 'show this help' },
    { name: 'run', alias: 'r', type: Boolean, description: 'run tests' },
    { name: 'dry-run', alias: 'n', type: Boolean, description: 'don\'n run tests, but show tests and expected files' },
    { name: 'config', alias: 'c', type: Boolean, description: 'show compilers configuration' },
    { name: 'sequental', alias: 's', type: Boolean, description: 'set to 1 both parallel tests and parallel compilers type' },
    { name: 'parallel', alias: 'p', type: Boolean, description: 'set to 100 both parallel tests and parallel compilers type' },
    { name: 'verbose', alias: 'v', type: Boolean, description: 'verbose compilers output of err, stdout, stderr' },
    { name: 'versions', alias: 'V', type: Boolean, description: 'try to get versions for compilers' },
    { name: 'ic', type: String, defaultValue: '.', description: 'include filter by compiler' },
    { name: 'it', type: String, defaultValue: '.', description: 'include filter by test' },
    { name: 'ec', type: String, defaultValue: '', description: 'exclude filter by compiler' },
    { name: 'et', type: String, defaultValue: '', description: 'exclude filter by test' },
    { name: 'pc', type: Number, defaultValue: 5, description: 'number of parallel compiler types' },
    { name: 'pt', type: Number, defaultValue: 5, description: 'number of parallel test by single compiler type' },
  ]
}

function validateCmdOptions() {
  if (cmdOptions.sequental)
    cmdOptions.pc = cmdOptions.pt = 1
  if (cmdOptions.parallel)
    cmdOptions.pc = cmdOptions.pt = 100
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
  args.it = new RegExp(args.it, 'i')
  args.ic = new RegExp(args.ic, 'i')
  args.et = args.et && new RegExp(args.et, 'i')
  args.ec = args.ec && new RegExp(args.ec, 'i')
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
