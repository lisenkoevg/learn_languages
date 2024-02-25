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
    { name: 'fc', type: String, defaultValue: '.', description: 'filter by compiler' },
    { name: 'ft', type: String, defaultValue: '.', description: 'filter by test' },
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
  args.ft = new RegExp(args.ft, 'i')
  args.fc = new RegExp(args.fc, 'i')
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
