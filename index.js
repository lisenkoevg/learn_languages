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
const BASE_DIR = '.'
const TESTS_DIR_NAME = 'test'
const EXPECTED_DIR_NAME = '_expected'
const EXPECTED_DIR = path.join(TESTS_DIR_NAME, EXPECTED_DIR_NAME)
const ACTUAL_DIR_NAME = '_actual'
const ACTUAL_DIR = path.join(TESTS_DIR_NAME, ACTUAL_DIR_NAME)

/*
  Definitions:

  COMPILERS key - compiler/interpretator name ("bash", "gawk", "gcc", "nodejs", ...)
  COMPILERS.cmd - command to run compiler (must be `basename actualCompilers.path`)
  COMPILERS.cmdArgs - arguments for compiler which is needed to build result from input
  COMPILERS.versionArgs - arguments for compiler to get compiler version
  COMPILERS.versionPattern - regexp pattern to extract version number from compiler output

  actualCompilers.fullpath - path to compiler as returned by "type" command
  actualCompilers.version - version of compiler returned by "type" command (so found with PATH env variable)
*/

const cmdOptions = tryCmdOptions()
if (cmdOptions.help || !validateCmdOptions()) {
  usage()
  process.exit(1)
}

const COMPILERS = {
  bash: {
    cmd: "bash",
    cmdArgs: "-i",
    versionArgs: "--version",
    versionPattern: /(?<=GNU bash, version )[\d.]+/,
  },
  gawk: {
    cmd: "gawk",
    cmdArgs: "-f",
    versionArgs: "--version",
    versionPattern: /(?<=GNU Awk )[\d.]+/,
  },
  nodejs: {
    cmd: "node",
    cmdArgs: "",
    versionArgs: "--version",
    versionPattern: /(?<=v)[\d.]+/,
  },
}

const actualCompilers = {}
const tests = {}
const expectedFiles = {}

async.series([
  init,
  getVersionsAndPaths,
], (err, res) => {
  if (err)
    return console.error(err)
  Object.assign(actualCompilers, res[1])
  Object.assign(tests, res[0].t)
  Object.assign(expectedFiles, res[0].e)
  if (cmdOptions.config)
    pretty(COMPILERS)
  if (cmdOptions.compilerVersion)
    pretty(actualCompilers)
  if (cmdOptions.list) {
    pretty(tests)
    pretty(expectedFiles)
    // listTestNames()
  }
  if (cmdOptions.run)
    runTests((err, res) => {
      console.log('runTests finished', err, res)
    })
})

function init(cb) {
  const res = { t: {}, e: {} }
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
      .forEach(de => processDirEntry(de, res))
    cb(null, res)
  })
}

function processDirEntry(de, res) {
  if (de.isDirectory() && de.name == EXPECTED_DIR_NAME || de.name == ACTUAL_DIR_NAME)
    return
  const re = /^([^_]+)_?([\d.]+)*$/
  if (de.name == EXPECTED_DIR_NAME && de.path == TESTS_DIR_NAME || de.path == EXPECTED_DIR) {
    let testname = path.basename(de.name, '.out')
    res.e[testname] = de.name
  } else if (de.isDirectory() && de.path == TESTS_DIR_NAME) {
    let m = de.name.match(re)
    assert(Array.isArray(m))
    let compilerKey = m[1]
    let version = m[2]
    if (!res.t[compilerKey])
      res.t[compilerKey] = {
        version,
        path: path.join(de.path, de.name),  // TODO check del path?
        nameVersion: de.name,
        items: [],
      }
  } else if (de.isFile()) {
    let sp = de.path.split(path.sep)
    assert(sp.length == 2)
    const m = sp[1].match(re)
    let compilerKey = m[1]
    const testname = de.name.replace(/\..{1,3}$/, '')
    const outfile = path.join(ACTUAL_DIR, sp[1], testname + '.out')
    res.t[compilerKey].items.push({
      testfile: de.name,
      testname, 
      outfile 
    })
  }
}

function getVersionsAndPaths(cb) {
  let result = {}
  let fn = (compilerName, pathOrVer, val) => {
    if (!result[compilerName]) result[compilerName] = {}
    result[compilerName][pathOrVer] = val
  }
  let iterateePath = (compiler, compilerName, cb) => {
    let typeCmd = 'cygpath -w "`type ' + compiler.cmd + ' | grep -o \'\/.*\'`"'
    child_process.exec(typeCmd, { shell: BASH }, (err, stdout, stderr) => {
      if (err || stderr)
        return cb(util.format("err: %s, stderr: %s", err, stderr))
      fn(compilerName, 'fullpath', stdout.trim())
      cb()
    })
  }
  let iterateeVersion = (compiler, compilerName, cb) => {
    child_process.exec(compiler.cmd + ' ' + compiler.versionArgs, {}, (err, stdout, stderr) => {
      if (err || stderr)
        return cb("err: %s, stderr: %s", err, stderr)
      let m = compiler.versionPattern.exec(stdout)
      assert(Array.isArray(m), util.format("stdout: %s, pattern: %s", stdout, compiler.versionPattern))
      assert(m[0])
      fn(compilerName, 'ver', m[0])
      cb()
    })
  }
  async.parallel([
    cb => async.mapValues(COMPILERS, iterateePath, cb),
    cb => async.mapValues(COMPILERS, iterateeVersion, cb),
  ], err => cb(err, result)) 
}

function optionDefinitions() {
  return [
    { name: 'help', alias: 'h', type: Boolean, description: 'show this help' },
    { name: 'list', alias: 'l', type: Boolean, description: 'list test and expected files' },
    { name: 'config', alias: 'c', type: Boolean, description: 'show compilers configuration' },
    { name: 'compilerVersion', alias: 'V', type: Boolean, description: 'show versions of compiler found in system' },
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

function listTestNames() {
  console.log("%s", EXPECTED_DIR)
  console.log('%j', expectedFiles)
  Object.keys(expectedFiles).forEach(res => {
    console.log("  %s", expectedFiles[res])
  })
  console.log("")
  Object.keys(tests).sort().forEach(lang => {
    console.log(tests[lang].path)
    console.log('%j',tests[lang])
    tests[lang].items.forEach(i => console.log("  %s", i))
  })
}

function runTests(cb) {
  fs.ensureDirSync(ACTUAL_DIR);
  console.log("start runTest", cmdOptions.parallelTests, cmdOptions.parallelCompilers)
  const iterateeCompiler = (test, compilerName, cb) => {
    fs.ensureDirSync(path.join(ACTUAL_DIR, test.nameVersion))
    const iterateeTest = (item, i, cb) => {
      runSingleTest(compilerName, item, cb)
    }
    async.eachOfLimit(tests[compilerName].items, cmdOptions.parallelTests, iterateeTest, cb)
  }
  async.eachOfLimit(tests, cmdOptions.parallelCompilers, iterateeCompiler, cb)
}

function runSingleTest(compilerName, test, cb) {
  const cmd = util.format('"%s" %s %s',
    actualCompilers[compilerName].fullpath,
    COMPILERS[compilerName].cmdArgs,
    path.join(TESTS_DIR_NAME, test.testfile)
  )
  console.log(cmd)
  child_process.exec(cmd, { encoding: 'buffer' }, (err, stdout, stderr) => {
    if (err)
      return cb(err)
    if (stderr)
      return cb(stderr.toString('utf8'))
    fs.writeFile(test.outfile, stdout, cd)
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
