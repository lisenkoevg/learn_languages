'use strict'
const assert = require('assert')
const path = require("path")
const util = require("util")
const child_process = require('child_process')
const fs = require("fs-extra")
const async = require("async")
const stringify = require("json-stable-stringify")

const {
  cmdOptions,
  optionDefinitions,
  tryCmdOptions,
  validateCmdOptions,
  usage
} = require('./cmdOptions')

const BASH='c:/cygwin64/bin/bash.exe'
const PROJECT_DIR = '.'
const TESTS_DIR_NAME = 'tests'
const TESTS_DIR = path.join(PROJECT_DIR, TESTS_DIR_NAME)
const EXPECTED_DIR_NAME = '_expected'
const EXPECTED_DIR = path.join(TESTS_DIR, EXPECTED_DIR_NAME)
const OUT_EXT = '.out'
const OUT_DIR_NAME = 'output'
const OUT_DIR = path.join(PROJECT_DIR, OUT_DIR_NAME)

if (cmdOptions.help || !validateCmdOptions()) {
  usage()
  process.exit(1)
}
const COMPILERS = require('./compilers')
const TESTS = {}
const EXPECTED = {}

console.time('readTests')
async.series([
  readTests
], (err, res) => {
  if (err)
    return console.error(err)
  console.timeEnd('readTests')
  Object.assign(TESTS, res[0].tests)
  Object.assign(EXPECTED, res[0].expected)
  if (cmdOptions.config)
    pretty(COMPILERS)
  if (cmdOptions.list) {
    pretty(TESTS)
    pretty(EXPECTED)
  }
  if (cmdOptions.run)
    // console.time('runTests')
    runTests((err, res) => {
      if (err)
        console.error('runTests error: %j', err)
      if (res)
        console.log('runTests res: %j', res)
      // console.timeEnd('runTests')
    })
})

function readTests(cb) {
  const readTestsResult = { tests: {}, expected: {} }
  let sortFn = (a, b) => {
    if (a.path > b.path) return 1
    else if (a.path < b.path) return -1
    else if (a.name < b.name) return 1
    else return -1
  }
  fs.readdir(TESTS_DIR_NAME, { recursive: true, withFileTypes: true }, (err, list) => {
    if (err)
      return console.error(err)
    async.each(list.sort(sortFn), processDirEntry, err => {
      if (err) return cb(err)
      cb(null, readTestsResult)
    })
  })
  function processDirEntry(de, cb) {
    const expected = readTestsResult.expected
    const res = readTestsResult.tests
    if (de.name == EXPECTED_DIR_NAME || /\.swp$/.exec(de.name)) return cb()

    const ext = path.extname(de.name)
    const nameNoExt = path.basename(de.name, ext)
    const title = nameNoExt
    if (de.path == EXPECTED_DIR) {
      fs.readFile(path.join(EXPECTED_DIR, nameNoExt + OUT_EXT), (err, res) => {
        if (err) return cb(err)
        expected[title] = res.toString('utf8')
        cb()
      })
      return
    }
    const splittedPath = de.path.split(path.sep)
    const depth = splittedPath.length
    if (depth == 1) {
      res[de.name] = { items: [] }
    } else if (depth == 2) {
      const test = { ext, nameNoExt, title }
      test.name = de.name
      test.parentDir = splittedPath.at(-1)
      test.path = path.join(PROJECT_DIR, de.path)
      test.fullname = path.join(test.path, de.name)
      test.compilerTitle = test.parentDir
      test.outputName = test.title + OUT_EXT
      test.outputFullname = path.join(OUT_DIR_NAME, test.compilerTitle, test.outputName) 
      test.expectedFullname = path.join(EXPECTED_DIR, test.outputName)
      const compiler = COMPILERS[test.compilerTitle]
      test.runCmd = [compiler.cmd, compiler.cmdArgs, `"${test.fullname}"`].filter(x => x).join(' ')
      res[test.compilerTitle].items.push(test)
    }
    return cb()
  }
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
  // if (item.compilerTitle != 'bash') return setImmediate(cb)
  item.runCmd = item.runCmd.replace(/\\/g, '/')
  child_process.exec(item.runCmd, { encoding: 'buffer' }, (err, stdout, stderr) => {
    if (err) {
      return cb(err)
    }
    if (stderr.length) {
      return cb(stderr.toString('utf8'))
    }
    item.resultStdout = stdout
    const pad = [7, 10]
    if (stdout == EXPECTED[item.title]) {
      console.log('%s %s passed', item.compilerTitle.padEnd(pad[0]), item.title.padStart(pad[1]))
      cb()
    } else {
      console.log(
        '%s %s FAILED (see "%s")',
        item.compilerTitle.padEnd(pad[0]),
        item.title.padStart(pad[1]),
        item.outputFullname
      )
      fs.writeFile(item.outputFullname, stdout, (err, res) => {
        if (err) return cb(err)
        cb()
      })
    }
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
