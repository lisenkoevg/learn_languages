'use strict'

const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const cmdOpts = tryCmdOptions()

function optionDefinitions() {
  return [
    { name: 'run', alias: 'r', type: Boolean, group: 'main', description: 'run tests' },
    { name: 'dry-run', alias: 'n', type: Boolean, group: 'main',
      description: 'don\'n run tests, but show tests and expected files, with group options show what would be done' },
    { name: 'show', type: Boolean, group: 'main', description: 'show test source code, it\'s intput data and expected result' },
    { name: 'config', alias: 'c', type: Boolean, group: 'main', description: 'show compilers configuration' },
    { name: 'versions', alias: 'V', type: Boolean, group: 'main', description: 'try to get versions for configured compilers' },
    { name: 'rename-group', type: String, group: 'testGroups', description: 'rename or move group of tests' },
    { name: 'remove-group', type: String, group: 'testGroups', description: 'remove group of tests' },
    { name: 'ic', type: String, defaultValue: '.', group: 'filters', description: 'include regexp filter by compiler title' },
    { name: 'ec', type: String, defaultValue: '', group: 'filters', description: 'exclude regexp filter by compiler title' },
    { name: 'it', type: String, defaultValue: '.', group: 'filters', description: 'include regexp filter by test group and name' },
    { name: 'et', type: String, defaultValue: '', group: 'filters', description: 'exclude regexp filter by test group and name' },
    { name: 'help', alias: 'h', type: Boolean, description: 'show this help' },
    { name: 'verbose', alias: 'v', type: Boolean, description: 'verbose compilers output of err, stdout, stderr and verbose actions with groups' },
    { name: 'quiet', alias: 'q', type: Boolean, description: 'don\'t show passed tests report' },
    { name: 'sequental', alias: 's', type: Boolean, group: 'parallelism', description: 'set to 1 both parallel tests and parallel compilers' },
    { name: 'pc', type: Number, defaultValue: 3, group: 'parallelism', description: 'number of parallel compilers' },
    { name: 'pt', type: Number, defaultValue: 3, group: 'parallelism', description: 'number of parallel tests running by one compiler' },
  ]
}

function validateCmdOptions() {
  const m = Object.keys(cmdOpts.main)
  const g = Object.keys(cmdOpts.testGroups)
  if (cmdOpts._all.sequental)
    cmdOpts._all.pc = cmdOpts._all.pt = 1
  if (cmdOpts._all.verbose && cmdOpts._all.quiet)
    return false
  if (m.length > 1 && !cmdOpts.main['dry-run'] && !cmdOpts.main['show'])
    return false
  if (g.length > 1)
    return false
  if (!g.length && !m.length)
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
    args._all.it = new RegExp(args._all.it, 'i')
    args._all.ic = new RegExp(args._all.ic, 'i')
    args._all.et = args._all.et && new RegExp(args._all.et, 'i')
    args._all.ec = args._all.ec && new RegExp(args._all.ec, 'i')
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
      header: 'Usage:',
      content: [
        '--run [ --quiet | --verbose ] <filters> <paralellism>',
        '--dry-run [ --verbose ] <filters>',
        '--show <filters>',
        '--config [ --verbose ] <filter by compiler>',
        '--versions [ --verbose ] <filter by compiler>',
        '--rename-group old_name:new_name [--dry-run]',
        '--remove-group group_name [--dry-run]',
      ],
    },
    {
      header: 'Main options',
      optionList: optionDefinitions(),
      group: [ 'main' ],
    },
    {
      header: 'Filters options',
      optionList: optionDefinitions(),
      group: 'filters',
    },
    {
      header: 'Work with test groups',
      optionList: optionDefinitions(),
      group: 'testGroups',
    },
    {
      header: 'Options related to paralellism',
      optionList: optionDefinitions(),
      group: 'parallelism',
    },
    {
      header: 'Misc',
      optionList: optionDefinitions(),
      group: '_none',
    },
    {
      content: 'Project home: {underline https://gitflic.ru/project/evgeen/learn_languages}'
    }
  ])
  console.log(usage)
}
module.exports = { cmdOpts, tryCmdOptions, validateCmdOptions, usage }
