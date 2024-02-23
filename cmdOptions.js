'use strict'
const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const cmdOptions = tryCmdOptions()

function optionDefinitions() {
  return [
    { name: 'help', alias: 'h', type: Boolean, description: 'show this help' },
    { name: 'list', alias: 'l', type: Boolean, description: 'list test and expected files' },
    { name: 'config', alias: 'c', type: Boolean, description: 'show compilers configuration' },
    { name: 'parallelCompilers', alias: 'p', type: Number, defaultValue: 1, description: 'number of parallel compiler <types>' },
    { name: 'parallelTests', alias: 't', type: Number, defaultValue: 1, description: 'number of parallel test by single compiler <type>' },
    { name: 'run', alias: 'r', type: Boolean, description: 'run tests' },
  ]
}

function validateCmdOptions() {
  if (!(cmdOptions.help || cmdOptions.list || cmdOptions.config ||
    cmdOptions.compilerVersion || cmdOptions.run))
    return false
  return true
}

function tryCmdOptions() {
  try {
    return commandLineArgs(optionDefinitions())
  } catch (e) {
    console.error(e.message)
    console.error("Try -h")
    process.exit(1)
  }
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
