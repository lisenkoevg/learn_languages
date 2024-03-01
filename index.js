'use strict'
const assert = require('assert')
const path = require('path')
const util = require('util')
const child_process = require('child_process')
const fs = require('fs-extra')
const async = require('async')
const stringify = require('json-stable-stringify')

const {
  cmdOptions,
  optionDefinitions,
  tryCmdOptions,
  validateCmdOptions,
  usage
} = require('./cmdOptions')
const { pretty, removeEmptyDirs } = require('./lib')

const BASH='c:/cygwin64/bin/bash.exe'
const PROJECT_DIR = '.'
const TESTS_DIR_NAME = 'tests'
const TESTS_DIR = path.join(PROJECT_DIR, TESTS_DIR_NAME)
const EXPECTED_DIR_NAME = 'expected'
const EXPECTED_DIR = path.join(PROJECT_DIR, EXPECTED_DIR_NAME)
const OUT_EXT = '.out'
const OUT_DIR_NAME = 'output'
const OUT_DIR = path.join(PROJECT_DIR, OUT_DIR_NAME)

if (cmdOptions.help || !validateCmdOptions()) {
  usage()
  process.exit(1)
}
const { COMPILERS, trySaveCompilersVersion } = require('./compilers')
const TESTS = {}
const EXPECTED = {}

async.series([
  trySaveCompilersVersion,
  readTests,
  readExpected,
], (err, res) => {
  if (err)
    return console.error(err)
  Object.assign(TESTS, res[1])
  Object.assign(EXPECTED, res[2])
  if (cmdOptions.config) {
    pretty(COMPILERS, 'COMPILERS')
    pretty(cmdOptions, 'cmdOptions')
  }
  if (cmdOptions.list) {
    pretty(TESTS, 'TESTS')
    pretty(EXPECTED, 'EXPECTED')
    !cmdOptions.run && report()
  }
  if (cmdOptions.run) {
    if (!Object.keys(EXPECTED).length) {
      console.error('No tests selected')
      return
    }
    runTests((err, res) => {
      if (err)
        console.error('runTests error: %j', err)
      if (res)
        console.log('runTests res: %j', res)
      removeEmptyDirs(OUT_DIR)
      report()
    })
  }
})

/*
  tests/bash/echo.sh - simple (not multifile) test
  tests - TESTS_DIR_NAME
  bash - compilerTitle
  echo.sh - name
  echo - nameNoExt = title
  .sh - ext
  expected output: expected/bash/echo.out

  tests/bash/echo.N.sh (N = 0, 1, 2, ...) - alternative test for echo.sh test
  echo - title
  expected output (as previous): expected/bash/echo.out

  tests/bash/module.sh/ - multifile test, dir must contain same name file - module.sh
  module - title
  .sh - ext
  expected output: expected/bash/module.out

  tests/bash/module.N.sh/ (N = 0, 1, 2, ...) - alternative multifile test, dir must contain file module.sh
  module - title
  expected output (as previos): expected/bash/module.out

  tests/bash/dir_with_no_suffix/ - tests group
*/

function readTests(cb) {
  readTests.result = {}
  readTests.skipDir = []
  let sortFn = (a, b) => {
    if (a.path > b.path) return 1
    else if (a.path < b.path) return -1
    else if (a.name > b.name) return 1
    else return -1
  }
  const opt = { recursive: true, withFileTypes: true }
  fs.readdir(TESTS_DIR, opt, (err, list) => {
    if (err)
      return console.error(err)
    async.eachSeries(list.sort(sortFn), processDirEntry, err => {
      if (err) return cb(err)
      Object.keys(readTests.result).forEach(k => {
        if (!readTests.result[k].items.length)
          delete readTests.result[k]
      })
      cb(null, readTests.result)
    })
  })
}

function processDirEntry(de, cb) {
  const readTestsResult = readTests.result
  const splittedPath = de.path.split(path.sep)
  const depth = splittedPath.length

  if (depth == 1) {
    if (!de.isDirectory())
      return cb()
    if (de.name.indexOf('.') == 0) {
      readTests.skipDir.push(path.join(de.path, de.name))
      return cb()
    }
    if (!cmdOptions.ic.test(de.name))
      return cb()
    if (cmdOptions.ec && cmdOptions.ec.test(de.name))
      return cb()
    readTestsResult[de.name] = { items: [] }
    return cb()
  } else if (depth >= 2) {
    const dirEntryLevelResult = processDirEntryLevel(de)
    if (!dirEntryLevelResult)
      return cb()
    const { test, compiler } = dirEntryLevelResult
    analyseTestFileHeader(test.fullname, compiler.lineComment, (err, r) => {
      if (err) return cb(err.message)
      const { outputRc, outputStderr } = r
      if (outputRc)
        test.outputRc = outputRc
      if (outputStderr)
        test.outputStderr = outputStderr
      readTestsResult[test.compilerTitle].items.push(test)
      return cb()
    })
  }
}

function processDirEntryLevel(de) {
  const insideSkipDir = !!readTests.skipDir
    .filter(x => de.path.indexOf(x) == 0)
    .length
  if (insideSkipDir) {
    return
  }
  const splittedPath = de.path.split(path.sep)
  const depth = splittedPath.length
  const ext = path.extname(de.name)
  if (/^\.\d+$/.test(ext)) {
    console.error(
      'Incorrect try to use tests group (%s) as multifile alternative test.',
      path.join(de.path, de.name)
    )
    process.exit(1)
  }
  const nameNoExt = path.basename(de.name, ext)
  const title = nameNoExt
  const test = { ext, nameNoExt, title, depth }
  const alternativePattern = new RegExp('\\.\\d+$')
  if (ext == '' && de.isDirectory() && !alternativePattern.test(test.title)) {
    const isTestsGroup = true
    return
  }
  const alternativeForTitle = test.title.replace(alternativePattern, '')
  if (test.title != alternativeForTitle) {
    test.alternativeForTitle = alternativeForTitle
    test.alternativeForName = alternativeForTitle + ext
  }
  const tmpTitle = test.alternativeForTitle || test.title
  test.group = splittedPath.slice(2).join(path.sep)
  if (!cmdOptions.it.test(test.group + ' ' + tmpTitle))
    return
  if (cmdOptions.et && cmdOptions.et.test(tmpTitle))
    return
  test.name = de.name
  if (test.name.indexOf('.') == 0) {
    if (de.isDirectory())
      readTests.skipDir.push(path.join(de.path, de.name))
    return
  }
  test.parentDir = splittedPath.at(1)
  test.path = path.join(PROJECT_DIR, de.path)
  test.fullname = path.join(test.path, test.name)
  test.compilerTitle = test.parentDir
  if (!cmdOptions.ic.test(test.compilerTitle))
    return
  if (cmdOptions.ec && cmdOptions.ec.test(test.compilerTitle))
    return
  test.outputName = test.title + OUT_EXT
  test.outputPath = path.join(OUT_DIR_NAME, test.compilerTitle, test.group)
  test.outputFullname = path.join(test.outputPath, test.outputName)
  const compiler = COMPILERS[test.compilerTitle]
  const multiFileTest = de.isDirectory() && ext == compiler.ext
  if (ext != compiler.ext)
    return
  let tmpName
  if (multiFileTest) {
    readTests.skipDir.push(path.join(de.path, de.name))
    tmpName = test.alternativeForName || test.name
    test.fullname = path.join(test.fullname, tmpName)
    test.path = path.join(test.path, test.name)
  } else {
    tmpName = test.name
  }
  test.runCmd = [
    compiler.cmd,
    compiler.cmdArgs.replace(/FILE/g, tmpName),
    !compiler.cmdArgs.match(/FILE/) ? `"${tmpName}"` : ''
  ]
  test.runCmd = test.runCmd.filter(x => x).join(' ')
  if (compiler.unlink)
    test.unlink = path.join(
      test.path,
      compiler.unlink.replace(/FILE/g, tmpName)
    )
  return { test, compiler }
}

// search for special tags like #rc, #stderr in first N line comments
function analyseTestFileHeader(file, lineComment, cb) {
  const N = 1
  const fnEscape = str => str.replace(/(\/)/g, '\\$1')
  const r = { outputRc: false, outputStderr: false }
  fs.readFile(file, { encoding: 'utf8' }, (err, res) => {
    if (err) return cb(err)
    let re = new RegExp('(?<=' + fnEscape(lineComment) + ').*$', 'gmi')
    let commentsArr = res.match(re)
    if (commentsArr) {
      const comments = commentsArr.slice(0, N).join(' ')
      r.outputRc = /#rc/.test(comments)
      r.outputStderr = /#stderr/.test(comments)
    }
    cb(null, r)
  })
}

function readExpected(cb) {
  const limitExpected = 10
  const tmp = readTests.result
  const selectedTests = Object.keys(tmp).reduce((acc, compilerTitle) => {
    tmp[compilerTitle].items.forEach(x => {
      const tmpTitle = x.alternativeForTitle || x.title
      acc[path.join(x.group, tmpTitle)] = path.join(x.group, tmpTitle) + OUT_EXT
    })
    return acc
  }, {})
  let iteratee = (file, title, cb) => {
    fs.readFile(path.join(EXPECTED_DIR, file), { encoding: 'utf8' }, cb)
  }
  async.mapValuesLimit(selectedTests, limitExpected, iteratee, cb)
}

function runTests(cb) {
  fs.ensureDirSync(OUT_DIR);
  console.log("start runTest, parallel compilers/test: %s/%s",
    cmdOptions.pc,
    cmdOptions.pt
  )
  const iterateeCompiler = (compilerTest, compilerTitle, cb) => {
    fs.ensureDirSync(path.join(OUT_DIR, compilerTitle))
    async.eachLimit(
      compilerTest.items,
      cmdOptions.pt,
      runSingleTest,
    cb)
  }
  async.eachOfLimit(TESTS, cmdOptions.pc, iterateeCompiler, cb)
}

function runSingleTest(item, cb) {
  item.runCmd = item.runCmd.replace(/\\/g, '/')
  const opt = { cwd: item.path, encoding: 'buffer' }
  const child = child_process.exec(item.runCmd, opt, (err, stdout, stderr) => {
    if (item.unlink) {
      fs.unlink(item.unlink, err => {
        if (err) console.error(err)
      })
    }
    if (err && !item.outputRc) {
      if (stderr) console.log(stderr.toString('utf8'))
      return cb(err)
    }
    if (stderr.length && !item.outputStderr) {
      console.error(stderr.toString('utf8'))
      return cb(true)
    }
    let result = stdout
    if (item.outputStderr) {
      let tmp = stdout.toString('utf8').replace(/^(.+)$/gm, 'stdout: $1')
      if (stderr.length) {
        tmp += stderr.toString('utf8').replace(/^(.+)$/gm, 'stderr: $1')
      }
      result = Buffer.from(tmp)
    }
    if (item.outputRc) {
      result = Buffer.concat([ result, Buffer.from('rc: ' + child.exitCode) ])
    }
    if (item.compilerTitle == 'cmd') {
      result = Buffer.from(result.toString('utf8').replace(/\r\n/g, '\n'))
    }
    const pad = [7, 15]
    const tmpTitle = item.alternativeForTitle || item.title
    if (result == EXPECTED[path.join(item.group, tmpTitle)]) {
      console.log('%s %s passed',
        item.compilerTitle.padEnd(pad[0]),
        item.title.padEnd(pad[1])
      )
      fs.unlink(item.outputFullname, err => cb())
    } else {
      console.log(
        '%s %s FAILED (see "%s")',
        item.compilerTitle.padEnd(pad[0]),
        item.title.padEnd(pad[1]),
        item.outputFullname
      )
      async.series([
        async.apply(fs.ensureDir, item.outputPath),
        async.apply(fs.writeFile, item.outputFullname, result)
      ], cb)
    }
  })
}

function report() {
  const compilers = Object.keys(TESTS)
  const compilersCount = compilers.length
  const testsCount = compilers.reduce((acc, key) => acc + TESTS[key].items.length, 0)
  const expectedCount = Object.keys(EXPECTED).length
  console.log('Compilers/tests/expected: %s/%s/%s', compilersCount, testsCount, expectedCount)
}
