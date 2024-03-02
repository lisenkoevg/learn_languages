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
const { pretty, removeEmptyDirs, strHex } = require('./lib')

const BASH='c:/cygwin64/bin/bash.exe'
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
const { COMPILERS, trySaveCompilersVersion } = require('./compilers')
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
  process.exit()
}
async.series([
  trySaveCompilersVersion,
  readTests,
  readExpected,
], (err, res) => {
  if (err)
    return console.error(err)
  Object.assign(TESTS, res[1])
  Object.assign(EXPECTED, res[2])

  if (cmdOptions['dry-run']) {
    pretty(TESTS, 'TESTS')
    pretty(EXPECTED, 'EXPECTED')
    report()
    process.exit()
  }
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
    if (!FAILED)
      child_process.exec('nircmd beep 4000 50')
  })
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
  if (!cmdOptions.it.test(test.group + ' ' + tmpTitle))
    return
  if (cmdOptions.et && cmdOptions.et.test(test.group + ' ' + tmpTitle))
    return
  test.parentDir = splittedPath.at(1)
  test.path = path.join(PROJECT_DIR, de.path)
  test.fullname = path.join(test.path, name)
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

// search for special tags #rc, #stderr in first N line comments
function analyseTestFileHeader(file, lineComment, cb) {
  const fnEscape = str => str.replace(/(\/)/g, '\\$1')
  const r = { outputRc: false, outputStderr: false }
  fs.readFile(file, { encoding: 'utf8' }, (err, res) => {
    if (err) return cb(err)
    let re = new RegExp('(?<=' + fnEscape(lineComment) + ').*$', 'gmi')
    let commentsArr = res.match(re)
    if (commentsArr) {
      const comments = commentsArr.slice(0, LINES_TO_ANALYSE).join(' ')
      r.outputRc = /#rc/.test(comments)
      r.outputStderr = /#stderr/.test(comments)
    }
    cb(null, r)
  })
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
      if (err) return cb(err)
      analyseInputFile(res)
      cb(null, res)
    })
  }, cb)
}

function analyseInputFile(item) {
  if (!item.in) return
  let input = item.in.split(/\n/).slice(0, LINES_TO_ANALYSE).join('\n')
  let matchEnv = input.match(/\s*#env\s+(?<env>[^\n|$]+)\s*/)
  if (matchEnv) {
    item.env = matchEnv[1].split(' ').reduce((acc, cur) => {
      let v = cur.split('=')
      acc[v[0]] = v[1]
      return acc
    }, {})
  }
  let matchArgs = input.match(/\s*#args\s+(?<args>.*)\s*/)
  if (matchArgs)
    item.args = matchArgs[1].trim()
}

function runTests(cb) {
  fs.ensureDirSync(OUT_DIR);
  if (!cmdOptions['dry-run'])
    console.log("Start tests, parallel compilers/test: %s/%s\n",
      cmdOptions.pc,
      cmdOptions.pt
    )
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
  const opt = { cwd: item.path, encoding: 'utf8' }
  if (item.preCmd) {
    child_process.exec(item.preCmd, opt, (err, stdout, stderr) => {
      if (err && !item.outputRc) {
        if (stderr) console.log(stderr)
        return cb(err)
      }
      if (stderr.length && !item.outputStderr) {
        console.error(stderr)
        return cb(true)
      }
      item.runCmd = item.runCmd.replace(
        /:PRECMDRESULT\b/,
        item.preCmdResult(stdout)
      )
      mainRunner()
    })
  } else {
    mainRunner()
  }
  function mainRunner() {
    const tmpTitle = item.alternativeForTitle || item.title
    const expected = EXPECTED[path.join(item.group, tmpTitle)]
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
    if (cmdOptions.verbose)
      verboseExecParams(item.runCmd, opt_ || opt)
    const child = child_process.exec(item.runCmd, opt_ || opt, (err, stdout, stderr) => {
      if (cmdOptions.verbose) {
        verboseExecResult(err, stdout, stderr)
      }
      if (err && !item.outputRc) {
        if (stderr) console.log(stderr)
        return cb(err)
      }
      if (stderr.length && !item.outputStderr) {
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
      let postOut = COMPILERS[item.compilerTitle].postProcessStdout
      if (postOut && stdout) {
        stdout = stdout.replace(postOut.search, postOut.replace)
      }
      let postErr = COMPILERS[item.compilerTitle].postProcessStderr
      if (postErr && stderr) {
        stderr = stderr.replace(postErr.search, postErr.replace)
      }

      let result
      if (!item.outputRc && !item.outputStderr) {
        result = stdout
      } else {
        result = ''
        if (item.outputStderr) {
          let tmpOut = result.replace(/^(.+)$/gm, 'stdout: $1')
          if (stderr) {
            let tmpErr = stderr
            tmpOut += tmpErr.replace(/^(.+)$/gm, 'stderr: $1')
          }
          result = tmpOut
        }
        if (item.outputRc) {
          result = result + 'rc: ' + child.exitCode
        }
      }

      const pad = [10, 30]
      const tmpTitle = item.alternativeForTitle || item.title
      if (result == expected.out) {
        PASSED++
        console.log('%s %s passed',
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
  console.log('\nCompilers/tests/unique: %s/%s/%s%s',
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

function verboseExecResult(err, stdout, stderr) {
  err && f('err', err)
  stderr && f('stderr', stderr)
  stdout && f('stdout', stdout)

  function f(caption, obj) {
    if (obj) {
      console.log('=== %s ======', caption)
      let tmp = obj
      if (typeof obj == 'string'){
        tmp = tmp
          .replace(/(?<!\r)(\r\r\n)/g, '^r^r^n$1')
          .replace(/(?<!\r)(\r\n)/g, '^r^n$1')
          .replace(/(?<!\r)(\n)/g, '^n$1')
          .replace(/\t/g, '^t')
      }
      console.log(tmp)
      console.log('=== %s end ===', caption)
    }
  }
}
