'use strict'

const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const cmdOptions = tryCmdOptions()

function optionDefinitions() {
  return [
    { name: 'help', alias: 'h', type: Boolean, description: 'show this help' },
    { name: 'list', alias: 'l', type: Boolean, description: 'list test and expected files' },
    { name: 'config', alias: 'c', type: Boolean, description: 'show compilers configuration' },
    { name: 'pc', type: Number, defaultValue: 5, description: 'number of parallel compiler types' },
    { name: 'pt', type: Number, defaultValue: 5, description: 'number of parallel test by single compiler type' },
    { name: 'sequental', alias: 's', type: Boolean, description: 'set to 1 both parallel tests and parallel compilers type' },
    { name: 'run', alias: 'r', type: Boolean, description: 'run tests' },
    { name: 'ic', type: String, defaultValue: '.', description: 'include filter by compiler' },
    { name: 'it', type: String, defaultValue: '.', description: 'include filter by test' },
    { name: 'ec', type: String, defaultValue: '', description: 'exclude filter by compiler' },
    { name: 'et', type: String, defaultValue: '', description: 'exclude filter by test' },
  ]
}

function validateCmdOptions() {
  if (!(cmdOptions.help || cmdOptions.list || cmdOptions.config ||
    cmdOptions.compilerVersion || cmdOptions.run))
    return false
  if (cmdOptions.sequental)
    cmdOptions.pc = cmdOptions.pt = 1
  return true
}

function tryCmdOptions() {
  let args
  try {
    args = commandLineArgs(optionDefinitions())
  } catch (e) {
    console.error(e.message)
    console.error("Try -h")
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
