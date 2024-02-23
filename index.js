'use strict'
const assert = require('assert')
const path = require("path")
const util = require("util")
const child_process = require('child_process')
const fs = require("fs-extra")
const async = require("async")
const stringify = require("json-stable-stringify")
const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const BASH='c:/cygwin64/bin/bash.exe'
const PROJECT_DIR = '.'
const TESTS_DIR_NAME = 'tests'
const TESTS_DIR = path.join(PROJECT_DIR, TESTS_DIR_NAME)
const EXPECTED_DIR_NAME = '_expected'
const EXPECTED_DIR = path.join(TESTS_DIR, EXPECTED_DIR_NAME)
const OUT_EXT = '.out'
const OUT_DIR_NAME = 'output'
const OUT_DIR = path.join(PROJECT_DIR, OUT_DIR_NAME)

const cmdOptions = tryCmdOptions()
if (cmdOptions.help || !validateCmdOptions()) {
  usage()
  process.exit(1)
}

const COMPILERS = {
  bash: {
    cmd: "bash",
    cmdArgs: "",
    title: "bash",
  },
  gawk: {
    cmd: "gawk",
    cmdArgs: "-f",
    title: "gawk",
  },
  nodejs: {
    cmd: "node",
    cmdArgs: "",
    title: "nodejs"
  },
}

const TESTS = {}

async.series([
  readTests
], (err, res) => {
  if (err)
    return console.error(err)
  Object.assign(TESTS, res[0].tests)
  if (cmdOptions.config)
    pretty(COMPILERS)
  if (cmdOptions.list) {
    pretty(TESTS)
  }
  if (cmdOptions.run)
    runTests((err, res) => {
      if (err)
        console.error('runTests error: %j', err)
      if (res)
        console.log('runTetss res: %j', res)
    })
})

function readTests(cb) {
  const result = { tests: {} }
  let sortFn = (a, b) => {
    if (a.path > b.path) return 1
    else if (a.path < b.path) return -1
    else if (a.name < b.name) return 1
    else return -1
  }
  fs.readdir(TESTS_DIR_NAME, { recursive: true, withFileTypes: true }, (err, list) => {
    if (err)
      return console.error(err)
    list.sort(sortFn)
      .forEach(de => processDirEntry(de, result))
    cb(null, result)
  })
}

function processDirEntry(de, out) {
  const expected = out.expected
  const res = out.tests
  if (de.name == EXPECTED_DIR_NAME) return

  const ext = path.extname(de.name)
  const nameNoExt = path.basename(de.name, ext)
  if (de.path == EXPECTED_DIR) {
    return
    // fs.readFile(path.join(de.path, de.name), (err, res) => {
    // })
  }
  const splittedPath = de.path.split(path.sep)
  const depth = splittedPath.length
  if (depth == 1) {
    res[de.name] = { items: [] }
  } else if (depth == 2) {
    const test = {}
    test.ext = ext
    test.nameNoExt = nameNoExt 
    test.name = de.name
    test.parentDir = splittedPath.at(-1)
    test.path = path.join(PROJECT_DIR, de.path)
    test.fullname = path.join(test.path, de.name)
    test.title = test.nameNoExt
    test.compilerTitle = test.parentDir
    test.outputName = test.title + OUT_EXT
    test.outputFullname = path.join(OUT_DIR_NAME, test.compilerTitle, test.outputName) 
    test.expectedFullname = path.join(EXPECTED_DIR, test.outputName)
    const compiler = COMPILERS[test.compilerTitle]
    test.runCmd = [compiler.cmd, compiler.cmdArgs, `"${test.fullname}"`].filter(x => x).join(' ')
    res[test.compilerTitle].items.push(test)
  }
}

function optionDefinitions() {
  return [
    { name: 'help', alias: 'h', type: Boolean, description: 'show this help' },
    { name: 'list', alias: 'l', type: Boolean, description: 'list test and expected files' },
    { name: 'config', alias: 'c', type: Boolean, description: 'show compilers configuration' },
    { name: 'parallelCompilers', alias: 'p', type: Number, defaultValue: 1, description: 'number of parallel compiler <types>' },
    { name: 'parallelTests', alias: 't', type: Number, defaultValue: 1, description: 'number of parallel test by single compiler <type>' },
    { name: 'run', alias: 'r', type: Boolean, description: 'run tests' },
    // { name: 'src', type: String, multiple: true, defaultOption: true },
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

function runTests(cb) {
  fs.ensureDirSync(OUT_DIR);
  console.log("start runTest",
    cmdOptions.parallelTests,
    cmdOptions.parallelCompilers
  )
  const iterateeCompiler = (compilerTest, compilerTitle, cb) => {
    fs.ensureDirSync(path.join(OUT_DIR, compilerTitle))
    async.eachLimit(
      compilerTest.items,
      cmdOptions.parallelTests,
      runSingleTest,
    cb)
  }
  async.eachOfLimit(TESTS, cmdOptions.parallelCompilers, iterateeCompiler, cb)
}

function runSingleTest(item, cb) {
  if (item.compilerTitle != 'bash') return setImmediate(cb)
  item.runCmd = item.runCmd.replace(/\\/g, '/')
  child_process.exec(item.runCmd, { encoding: 'buffer' }, (err, stdout, stderr) => {
    if (err) {
      return cb(err)
    }
    if (stderr.length) {
      return cb(stderr.toString('utf8'))
    }
    item.resultStdout = stdout
    fs.writeFile(item.outputFullname, stdout, cb)
  }) 
}

function pretty(obj) {
  let replacer = (key, val) => {
    if (val instanceof RegExp)
      val = val.toString()
    return val
  }
  console.log(stringify(obj, { space: 2, replacer }))
}
