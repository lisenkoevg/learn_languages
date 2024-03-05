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
  usage,
} = require('./cmdOptions')
const { pretty, removeEmptyDirs, strHex } = require('./lib')
const { parseTags } = require('./parseTags')

const SHELL = 'c:/cygwin64/bin/sh.exe'
const PROJECT_DIR = '.'
const TESTS_DIR_NAME = 'tests'
const TESTS_DIR = path.join(PROJECT_DIR, TESTS_DIR_NAME)
const EXPECTED_DIR_NAME = 'expected'
const EXPECTED_DIR = path.join(PROJECT_DIR, EXPECTED_DIR_NAME)
const OUT_EXT = '.out'
const OUT_DIR_NAME = 'output'
const OUT_DIR = path.join(PROJECT_DIR, OUT_DIR_NAME)
const IN_EXT = '.in'

if (cmdOptions.help || !validateCmdOptions()) {
  usage()
  process.exit(1)
}
const {
  COMPILERS,
  getCompilersVersion,
  isCompilerIncluded,
  isTestIncluded
} = require('./compilers')({ cmdOptions, SHELL })
const TESTS = {}
const EXPECTED = {}

const LINES_TO_ANALYSE = 5

let PASSED = 0
let FAILED = 0

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

if (cmdOptions.config) {
  pretty(COMPILERS, 'COMPILERS')
  pretty(cmdOptions, 'cmdOptions')
  return
}
if (cmdOptions.versions) {
  getCompilersVersion((err, res) => {
    pretty(res)
  }, true)
  return
}
console.time('elapsed')
async.series([
  getCompilersVersion,
  readTests,
  readExpected,
], (err, res) => {
  if (err)
    return console.error(err)
  Object.assign(TESTS, res[1])
  Object.assign(EXPECTED, res[2])

  if (!Object.keys(EXPECTED).length) {
    console.error('No tests selected')
    console.timeEnd('elapsed')
    return
  }
  if (cmdOptions['dry-run']) {
    if (cmdOptions.verbose) {
      pretty(TESTS, 'TESTS')
      pretty(EXPECTED, 'EXPECTED')
    } else {
      showShortTestList()
    }
    report()
    console.timeEnd('elapsed')
  }
  if (cmdOptions.run) {
    runTests((err, res) => {
      if (err)
        console.error('runTests error: %j', err)
      if (res)
        console.log('runTests res: %j', res)
      removeEmptyDirs(OUT_DIR)
      report()
      console.timeEnd('elapsed')
      if (!FAILED && PASSED)
        child_process.exec('nircmd beep 4000 50')
    })
  }
})

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
    if (!isCompilerIncluded(de.name))
      return cb()
    readTestsResult[de.name] = { items: [] }
    return cb()
  } else if (depth >= 2) {
    const dirEntryLevelResult = processDirEntryLevel(de)
    if (!dirEntryLevelResult)
      return cb()
    const { test, compiler } = dirEntryLevelResult
    readTestsResult[test.compilerTitle].items.push(test)
    return cb()
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
  const name = de.name
  if (name.indexOf('.') == 0) {
    if (de.isDirectory())
      readTests.skipDir.push(path.join(de.path, name))
    return
  }
  const ext = path.extname(name)
  if (/^\.\d+$/.test(ext)) {
    console.error(
      'Incorrect try to use tests group (%s) as multifile alternative test.',
      path.join(de.path, name)
    )
    process.exit(1)
  }
  const nameNoExt = path.basename(name, ext)
  const title = nameNoExt
  const test = { ext, nameNoExt, title, depth, name }
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
  if (!isTestIncluded(test.group + ' ' + tmpTitle))
    return
  test.parentDir = splittedPath.at(1)
  test.path = path.join(PROJECT_DIR, de.path)
  test.fullname = path.join(test.path, name)
  test.compilerTitle = test.parentDir
  if (!isCompilerIncluded(test.compilerTitle))
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
    readTests.skipDir.push(path.join(de.path, name))
    tmpName = test.alternativeForName || name
    test.fullname = path.join(test.fullname, tmpName)
    test.path = path.join(test.path, name)
  } else {
    tmpName = name
  }
  test.runCmd = [
    compiler.cmd,
    compiler.cmdArgs.replace(/:FILE\b/g, tmpName),
    !compiler.cmdArgs.match(/:FILE\b/) ? `"${tmpName}"` : ''
  ]
  test.runCmd = test.runCmd.filter(x => x).join(' ')
  if (compiler.preCmd) {
    test.preCmd = compiler.preCmd.replace(
      /:FILE\b/g,
      tmpName
    )
  }
  if (compiler.postCmd) {
    test.postCmd = compiler.postCmd.replace(
      /:FILE\b/g,
      tmpName
    )
  }
  if (compiler.preCmdResult) {
    test.preCmdResult = compiler.preCmdResult
  }
  return { test, compiler }
}

function readExpected(cb) {
  const limitExpected = 1
  const tmp = readTests.result
  const selectedTests = Object.keys(tmp).reduce((acc, compilerTitle) => {
    tmp[compilerTitle].items.forEach(x => {
      const tmpTitle = x.alternativeForTitle || x.title
      acc[path.join(x.group, tmpTitle)] = {
        out: path.join(x.group, tmpTitle) + OUT_EXT,
        in: path.join(x.group, tmpTitle) + IN_EXT
      }
    })
    return acc
  }, {})
  async.mapValuesLimit(selectedTests, limitExpected, (item, title, cb) => {
    async.mapValuesLimit(item, limitExpected, (file, type, cb) => {
      fs.readFile(path.join(EXPECTED_DIR, file), { encoding: 'utf8' }, (err, res) => {
        if (err) {
          if (err.code != 'ENOENT') {
            return cb(err)
          } else {
            if (type == 'out') {
              console.error('No expected output for test.')
              return cb(err.message)
            }
          }
        }
        cb(null, res)
      })
    }, (err, res) => {
//       if (err) return cb(err) // keep this line commented for ./output/... file created if ./expected/... file is absent
      analyseInputFile(res, cb)
    })
  }, cb)
}

function analyseInputFile(item, cb) {
  if (!item.in)
    return setImmediate(cb, null, item)
  let headerLines = []
  let inputContentLines = []
  item.in.split(/\n/).forEach(x => {
    if (!/^\s*#/.test(x))
      inputContentLines.push(x)
    else
      headerLines.push(x)
  })
  let result = {
    out: item.out
  }
  try {
    Object.assign(result, parseTags(headerLines.join('\n')))
  } catch (err) {
    return setImmediate(cb, err)
  }
  result.in = inputContentLines.join('\n')
  if (Array.isArray(result.args))
    result.args = result.args.map(x => `"${x}"`).join(' ')
  setImmediate(cb, null, result)
}

function runTests(cb) {
  fs.ensureDirSync(OUT_DIR);
  if (!cmdOptions['dry-run'])
    console.log("Start tests, parallel compilers/test: %s/%s",
      cmdOptions.pc,
      cmdOptions.pt
    )
    !cmdOptions.quiet && console.log()
  const iterateeCompiler = (testsForCompiler, compilerTitle, cb) => {
    fs.ensureDirSync(path.join(OUT_DIR, compilerTitle))
    async.eachLimit(
      testsForCompiler.items,
      cmdOptions.pt,
      runSingleTest,
    cb)
  }
  async.eachOfLimit(TESTS, cmdOptions.pc, iterateeCompiler, cb)
}

function runSingleTest(item, cb) {
  const opt = { cwd: item.path, encoding: 'utf8', shell: SHELL }
  const tmpTitle = item.alternativeForTitle || item.title
  const expected = EXPECTED[path.join(item.group, tmpTitle)]
  if (item.preCmd) {
    child_process.exec(item.preCmd, opt, (err, stdout, stderr) => {
      if (err && !expected.outputRc) {
        if (stderr) console.log(stderr)
        return cb(err)
      }
      if (stderr.length && !expected.outputStderr) {
        console.error(stderr)
        return cb(true)
      }
      mainRunner(stdout)
    })
  } else {
    mainRunner()
  }
  function mainRunner(preCmdStdout) {
    let opt_
    if (expected.env) {
      opt_ = Object.assign({ env: expected.env}, opt)
    }
    if (expected.args) {
      item.runCmd += ' ' + expected.args
      const compiler = COMPILERS[item.compilerTitle]
      if (compiler.alterCmdWithArgs) {
        item.runCmd = compiler.alterCmdWithArgs(item)
      }
    }
    if (preCmdStdout || /:PRECMDRESULT\b/.test(item.runCmd))
      item.runCmd = item.runCmd.replace(
        /:PRECMDRESULT\b/,
        item.preCmdResult(preCmdStdout, expected.env)
      )
    if (cmdOptions.verbose)
      verboseExecParams(item.runCmd, opt_ || opt)
    const child = child_process.exec(item.runCmd, opt_ || opt, (err, stdout, stderr) => {
      const compiler = COMPILERS[item.compilerTitle]
      if (cmdOptions.verbose) {
        verboseExecResult({ err, stdout, stderr })
      }
      if (err && !expected.outputRc) {
        if (stderr) console.error(stderr)
        if (stdout) console.error(compiler.postProcessStdout && compiler.postProcessStdout(stdout).trim() || stdout)
        return cb(err)
      }
      if (stderr.length && !expected.outputStderr) {
        if (item.compilerTitle != 'vim') {
          console.error(stderr)
          return cb(true)
        } else {
          stdout = stderr.trim()
        }
      }
      if (item.postCmd) {
        child_process.exec(item.postCmd, opt, (err, stdout, stdres) => {
          if (err) console.error(err, stderr, stdout)
        })
      }
      if (compiler.postProcessStdout && stdout) {
        stdout = compiler.postProcessStdout(stdout)
      }
      if (compiler.postProcessStderr && stderr) {
        stderr = compiler.postProcessStderr(stderr, item.fullname)
      }
      let result
      if (!expected.outputRc && !expected.outputStderr) {
        result = stdout
      } else {
        result = ''
        if (expected.outputStderr) {
          let tmpOut = stdout.replace(/^(.+)$/gm, 'stdout: $1')
          if (stderr) {
            let tmpErr = stderr
            tmpOut += tmpErr.replace(/^(.+)$/gm, 'stderr: $1')
          }
          result = tmpOut
        }
        if (expected.outputRc) {
          result = result + 'rc: ' + child.exitCode
        }
      }

      const pad = [10, 30]
      const tmpTitle = item.alternativeForTitle || item.title
      if (result == expected.out) {
        PASSED++
        !cmdOptions.quiet && console.log('%s %s passed',
          item.compilerTitle.padEnd(pad[0]),
          path.join(item.group, item.title).padEnd(pad[1])
        )
        fs.unlink(item.outputFullname, err => cb())
      } else {
        FAILED++
        console.log(
          '%s %s FAILED (see "%s")',
          item.compilerTitle.padEnd(pad[0]),
          path.join(item.group, item.title).padEnd(pad[1]),
          item.outputFullname
        )
        async.series([
          async.apply(fs.ensureDir, item.outputPath),
          async.apply(fs.writeFile, item.outputFullname, Buffer.from(result, 'utf8'))
        ], cb)
      }
    })
  }
}

function report() {
  const compilers = Object.keys(TESTS)
  const compilersCount = compilers.length
  const testsCount = compilers.reduce((acc, key) => acc + TESTS[key].items.length, 0)
  const expectedCount = Object.keys(EXPECTED).length
  !cmdOptions.quiet && console.log()
  console.log('Compilers/tests/unique: %s/%s/%s%s',
    compilersCount,
    testsCount,
    expectedCount,
    cmdOptions['dry-run'] ? '' : util.format(', passed/failed: %s/%s', PASSED, FAILED)
  )
}

function verboseExecParams(cmd, opt) {
  console.log('=== cmd & options ======')
  console.log(cmd)
  console.log('%j', opt)
  console.log('=== end cmd & options ==')
}

function verboseExecResult(obj) {
  for (let k in obj) f(k, obj[k])
  function f(caption, obj) {
    console.log('=== %s ======', caption)
    let tmp = obj
    if (typeof obj == 'string'){
      tmp = tmp
        .replace(/(?<!\r)(\r\r\n)/g, '^r^r^n$1')
        .replace(/(?<!\r)(\r\n)/g, '^r^n$1')
        .replace(/(?<!\r)(\n)/g, '^n$1')
        .replace(/\t/g, '^t')
        .replace(/ /g, '\xb7') // middle dot
    }
    tmp && console.log(tmp)
    console.log('=== %s end ===', caption)
  }
}

function showShortTestList() {
  Object.keys(TESTS).forEach(compilerTitle => {
    console.log('%s', compilerTitle)
    TESTS[compilerTitle].items.forEach(test => {
      console.log('  %s', path.join(test.group, test.name))
    })
  })
}
