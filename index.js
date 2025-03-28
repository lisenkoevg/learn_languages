'use strict'
const assert = require('assert')
const path = require('path')
const util = require('util')
const child_process = require('child_process')
const fs = require('fs-extra')
const async = require('async')
const stringify = require('json-stable-stringify')
const { table } = require('table')

const {
  cmdOpts,
  validateCmdOptions,
  usage,
} = require('./cmdOptions')
const { pretty, removeEmptyDirs, verboseExecParams, verboseExecResult } = require('./lib')
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

if (cmdOpts._all.help || !validateCmdOptions()) {
  usage()
  process.exit(1)
}
const {
  COMPILERS,
  getCompilersVersion,
  filterByCompilerTitle,
  filterByTestTitle
} = require('./compilers')({ cmdOpts, SHELL })

const TESTS = {}
const EXPECTED = {}
const GROUPS = new Set()
const handleGroup = require('./group.js')({
  EXPECTED, GROUPS, TESTS_DIR, EXPECTED_DIR, cmdOpts
})

let PASSED = 0
let FAILED = 0

if (cmdOpts._all.config) {
  showCompilersConfig()
  pretty(cmdOpts, 'cmdOptions')
  return
}
console.time('elapsed')
if (cmdOpts._all.versions) {
  getCompilersVersion((err, res) => {
    pretty(res)
    console.timeEnd('elapsed')
  }, true)
  return
}
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
  if (Object.keys(cmdOpts.testGroups).length) {
    handleGroup(cmdOpts.testGroups)
    .catch(console.error)
  } else if (cmdOpts._all['dry-run']) {
    if (cmdOpts._all.verbose) {
      pretty(TESTS, 'TESTS')
      pretty(EXPECTED, 'EXPECTED')
    } else {
      showShortTestList()
    }
    report()
    console.timeEnd('elapsed')
  } else
  if (cmdOpts._all.run) {
    runTests((err, res) => {
      if (err)
        console.error('runTests error: %j', err)
      if (res)
        console.log('runTests res: %j', res)
      removeEmptyDirs(OUT_DIR)
      report()
      console.timeEnd('elapsed')
	  cmdOpts._all.show && _show()
      if (!FAILED && PASSED)
        child_process.exec('beep 4000 50')
      else
        process.exit(1)
    })
  }

  !cmdOpts._all.run && cmdOpts._all.show && _show()

  function _show() {
	const tableData = []
	const tableConfig = {
//       columnDefault: { wrapWord: true },
// 	  columns: [
// 		{  width: 90, wrapWord: true },
// 		{  width: 90, wrapWord: true },
// 	  ],
	}
	for (let c in TESTS) {
	  TESTS[c].items.forEach(item => {
		const tmpTitle = item.alternativeForTitle || item.title
		const expected = EXPECTED[path.join(item.group, tmpTitle)]
		tableData.push([ item.fullname, 'input === expected'])
		tableData.push([
          item.content.replace(/\t/g, '    '),
          (expected.inRaw || '<none>')
			+ '\n===\n'
			+ expected.out
        ])
	  })
	}
//     console.log(11111, tableData)
	console.log(table(tableData, tableConfig))
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
    if (!filterByCompilerTitle(de.name))
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
  test.group = splittedPath.slice(2).join(path.sep)
  GROUPS.add(splittedPath.slice(1).join(path.sep))
  if (!filterByTestTitle(test.group + ' ' + test.title)) {
    if (test.alternativeForTitle)
      readTests.skipDir.push(path.join(de.path, name))
    return
  }
  test.parentDir = splittedPath.at(1)
  test.path = path.join(PROJECT_DIR, de.path)
  test.fullname = path.join(test.path, name)
  test.compilerTitle = test.parentDir
  if (!filterByCompilerTitle(test.compilerTitle))
    return
  test.outputName = test.title + OUT_EXT
  test.outputPath = path.join(OUT_DIR_NAME, test.compilerTitle, test.group)
  test.outputFullname = path.join(test.outputPath, test.outputName)
  const compiler = COMPILERS[test.compilerTitle]
  const allowedExt = ext == compiler.ext || Array.isArray(compiler.ext) && compiler.ext.includes(ext)
  const multiFileTest = de.isDirectory() && allowedExt
  if (!allowedExt)
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
    process.env.CFLAGS,
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
  try {
	const { opts, content } = getOptsFromSrcCode(
	  fs.readFileSync(test.fullname, { encoding: 'utf8' }),
	  compiler.lineComment
	)
	Object.assign(test, { opts, content })
  } catch (e) {
	console.error('%s, %s', e.message, test.fullname)
	process.exit()
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
              console.error('No expected output for test: %s', file)
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
    if (/^\s*#[^#]/.test(x))
      headerLines.push(x)
    else if (!/^\s*##/.test(x))
      inputContentLines.push(x)
  })
  let result = {
    out: item.out
  }
  try {
    Object.assign(result, parseTags(headerLines.join('\n')))
  } catch (err) {
    return setImmediate(cb, err)
  }
  result.in = inputContentLines.join('\n').trim()
  result.inRaw = item.in
  if (Array.isArray(result.args))
    result.args = result.args.map(x => `"${x}"`).join(' ')
  setImmediate(cb, null, result)
}

function runTests(cb) {
  fs.ensureDirSync(OUT_DIR);
  if (!cmdOpts._all['dry-run'])
    console.log("Start tests, parallel compilers/test: %s/%s",
      cmdOpts._all.pc,
      cmdOpts._all.pt
    )
    !cmdOpts._all.quiet && console.log()
  const iterateeCompiler = (testsForCompiler, compilerTitle, cb) => {
    fs.ensureDirSync(path.join(OUT_DIR, compilerTitle))
    async.eachLimit(
      testsForCompiler.items,
      cmdOpts._all.pt,
      runSingleTest,
    cb)
  }
  async.eachOfLimit(TESTS, cmdOpts._all.pc, iterateeCompiler, cb)
}

function runSingleTest(item, cb) {
  const opt = { cwd: item.path, encoding: 'utf8', shell: SHELL }
  const tmpTitle = item.alternativeForTitle || item.title
  const expected = EXPECTED[path.join(item.group, tmpTitle)]
  const outputRc = expected.outputRc
  const outputStderr = expected.outputStderr
  if (item.preCmd) {
    child_process.exec(item.preCmd, opt, (err, stdout, stderr) => {
      if (err && !outputRc) {
        if (stderr) console.log(stderr)
        return cb(err)
      }
      if (stderr.length && !outputStderr) {
        console.error(stderr)
        return cb(true)
      }
      mainRunner(stdout)
    })
  } else {
    mainRunner()
  }
  function mainRunner(preCmdStdout) {
    const env = expected.env
    let opt_ = env ? Object.assign({ env }, opt) : null
    const args = expected.args || ''
    item.runCmd += args ? ' ' + args : ''
    if (preCmdStdout || /:PRECMDRESULT\b/.test(item.runCmd))
      item.runCmd = item.runCmd.replace(
        /:PRECMDRESULT\b/,
        item.preCmdResult(preCmdStdout, expected.env)
      )
    if (cmdOpts._all.verbose)
      verboseExecParams(item.runCmd, opt_ || opt)
    const child = child_process.exec(item.runCmd, opt_ || opt, (err, stdout, stderr) => {
      const compiler = COMPILERS[item.compilerTitle]
      if (cmdOpts._all.verbose) {
        verboseExecResult({ err, stdout, stderr })
      }
      if (err && !outputRc) {
        if (stderr) console.error(stderr)
        if (stdout) console.error(compiler.postProcessStdout && compiler.postProcessStdout(stdout).trim() || stdout)
        return cb(err)
      }
      if (stderr.length && !outputStderr) {
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
      if (expected.stripThisFilename) {
        let re = new RegExp('(^|\\s+).*' + item.fullname.replace(/\\|\//g, '.') + '.*\\n')
        stderr = stderr.replace(re, '')
      }
      let result
      if (!outputRc && !outputStderr) {
        result = stdout
      } else {
        result = ''
        if (outputStderr) {
          let tmpOut = stdout.replace(/^(.+)$/gm, 'stdout: $1')
          if (stderr) {
            let tmpErr = stderr
            tmpOut += tmpErr.replace(/^(.+)$/gm, 'stderr: $1')
          }
          result = tmpOut
        }
        if (outputRc) {
          result = result + 'rc: ' + child.exitCode
        }
      }

      const pad = [10, 30]
      const tmpTitle = item.alternativeForTitle || item.title
      if (result == expected.out) {
        PASSED++
        !cmdOpts._all.quiet && console.log('%s %s passed',
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
    child.stdin.end(expected.in)
  }
}

function showCompilersConfig() {
  pretty(Object.keys(COMPILERS).reduce(
    (acc, cur) => {
      if (filterByCompilerTitle(cur)) acc[cur] = COMPILERS[cur]
      return acc
    },
    {}
  ), 'COMPILERS')
}

function report() {
  const compilers = Object.keys(TESTS)
  const compilersCount = compilers.length
  const testsCount = compilers.reduce((acc, key) => acc + TESTS[key].items.length, 0)
  const expectedCount = Object.keys(EXPECTED).length
  !cmdOpts._all.quiet && console.log()
  console.log('Compilers/tests/unique: %s/%s/%s%s',
    compilersCount,
    testsCount,
    expectedCount,
    cmdOpts._all['dry-run'] ? '' : util.format(', passed/failed: %s/%s', PASSED, FAILED)
  )
}

function showShortTestList() {
  Object.keys(TESTS).forEach(compilerTitle => {
    console.log('%s', compilerTitle)
    TESTS[compilerTitle].items.forEach(test => {
      console.log('  %s', path.join(test.group, test.name))
    })
  })
}

function getOptsFromSrcCode(srcCode, lineComment) {
  const re = new RegExp('^\\s*' + lineComment + '(.*)$')
  const exclude = /^#!|#include|#define/
  let skip = false
  const lines = srcCode.split(/\n+/)
    .filter(x => {
      if (re.test(x) && !exclude.test(x) && !skip)
        return true
      else {
        skip = true
        return false
      }
    })
    .map(x => x.replace(re, '$1').trim()).join('\n')
  return { opts: {} /*parseTags(lines)*/, content: srcCode }
}
