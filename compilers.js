module.exports = params => {
  const { cmdOpts, SHELL } = params
  const fs = require('fs-extra')
  const { exec } = require('child_process')
  const async = require('async')
  const stringify = require('json-stable-stringify')

  const { verboseExecParams, verboseExecResult } = require('./lib.js')

  const COMPILERS = {
    bash: {
      cmd: 'bash',
      cmdArgs: '',
      title: 'bash',
      lineComment: '#',
      ext: '.sh',
      versionPattern: /(?<=GNU bash, version )[\d.]+/,
    },
    'C#':{
      cmd: 'csc',
      cmdArgs: '/out:":FILE.exe" ":FILE" && "./:FILE.exe"',
      postCmd: 'rm -f ":FILE.exe"',
      title: 'C#',
      lineComment: '//',
      ext: '.cs',
      versionArgs: '/help',
      versionPattern: /(?<=Microsoft \(R\) Visual C# Compiler version )[\d.]+/,
      postProcessStdout: str => str.replace(/^Microsoft.*LinkID=\d+\s+/s, '').replace(/\r\n/g, '\n'),
      postProcessStderr: str => str.replace(/\r\n/g, '\n')
    },
    gawk: {
      cmd: 'gawk',
      cmdArgs: '-f',
      cmdArgs: ':PRECMDRESULT -f',
      preCmdResult: (s, env) => env && Object.keys(env).map(name => `-v ${name}="${env[name]}"`).join(' ') || '',
      title: 'gawk',
      lineComment: '#',
      ext: '.awk',
      versionPattern: /(?<=GNU Awk )[\d.]+/,
    },
    'g++': {
       cmd: 'g++',
  //     preCmd: 'g++ -MM ":FILE"',
  //     preCmdResult: (stdout => (stdout.match(/\b[^.\s]+\.h\b/g) || []).map(x => '"' + x.replace(/\.h/,'.c') + '"').join(' '),
       cmdArgs: '":FILE" -Werror -Wextra -Wall -Wpedantic -o ":FILE.exe" && "./:FILE.exe"',
       cmdArgs: '":FILE" -o ":FILE.exe" && "./:FILE.exe"',
       postCmd: 'rm -f ":FILE.exe"',
       title: 'g++',
       lineComment: '//',
       ext: '.cpp',
       versionPattern: /(?<=g\+\+ \(GCC\) )[\d.]+/,
    },
    gcc: {
      cmd: 'gcc',
      preCmd: 'gcc -MM ":FILE"',
      preCmdResult: stdout => (stdout.match(/\b[^.\s]+\.h\b/g) || []).map(x => '"' + x.replace(/\.h/,'.c') + '"').join(' '),
      cmdArgs: '":FILE" :PRECMDRESULT -Werror -Wextra -Wall -Wpedantic -o ":FILE.exe" && "./:FILE.exe"',
      postCmd: 'rm -f ":FILE.exe"',
      title: 'gcc',
      lineComment: '//',
      ext: '.c',
      versionPattern: /(?<=gcc \(GCC\) )[\d.]+/,
    },
    lua: {
      cmd: 'lua',
      cmdArgs: '',
      title: 'lua',
      lineComment: '--',
      ext: '.lua',
      versionArgs: '-v',
      versionPattern: /(?<=Lua )[\d.]+/,
    },
    make: {
      cmd: 'make',
      cmdArgs: '--silent -f',
      title: 'make',
      lineComment: '#',
      ext: '.mk',
      versionPattern: /(?<=GNU Make )[\d.]+/,
      postProcessStderr: str => str.replace(/(^[^*]*\*{3} )(.*)\.  Stop\./, '$2')
    },
    nodejs: {
      cmd: 'node',
      cmdArgs: '',
      title: 'nodejs',
      lineComment: '//',
      ext: '.js',
      versionPattern: /(?<=v)[\d.]+/,
    },
    php: {
      cmd: 'php',
      cmdArgs: '',
      title: 'php',
      lineComment: '//',
      ext: '.php',
      versionPattern: /(?<=PHP )[\d.]+/,
    },
    powershell: {
      cmd: 'powershell',
      cmdArgs: '-file ./:FILE',
      title: 'powershell',
      lineComment: '#',
      ext: '.ps1',
      versionArgs: "'$PSVersionTable.PsVersion.ToString()'",
      versionPattern: /[\d.]+/,
      postProcessStdout: str => str.replace(/\r\n/g, '\n'),
      postProcessStderr: (str, fullname) => {
        const n = fullname.replace(/\\/g, '\\\\')
        const re = new RegExp('(?:^|\\r\\n)..[^:]+' + n + ' : (.*?\\r\\n) {4}\\+ CategoryInfo.*?\\r\\n (?=\\r\\n)', 'sg')
        let res = str.replace(re, '$1').replace(/\r\n$/, '')
        res = res.replace(/\r\n/g, '\n')
        return res
      }
    },
    python: {
      cmd: 'python3.9',
      cmdArgs: '',
      title: 'python',
      lineComment: '#',
      ext: '.py',
      versionPattern: /(?<=Python )[\d.]+/,
    },
    ruby: {
      cmd: 'ruby',
      cmdArgs: '',
      title: 'ruby',
      lineComment: '#',
      ext: '.rb',
      versionPattern: /(?<=ruby )[\d.]+/,
    },
    vim: {
      cmd: 'vim',
      cmdArgs: '--not-a-term -u',
      title: 'vim',
      lineComment: '#',
      ext: '.vim',
      versionPattern: /(?<=VIM - Vi IMproved )[\d.]+/i,
      postProcessStdout: str => str.replace(/(\r\r\n(<BR>)?){1,2}/g, '\n')
    },
    winBatch: {
      cmd: 'cmd',
      cmdArgs: '/d /c',
      title: 'winBatch',
      lineComment: 'REM ',
      ext: '.bat',
      versionArgs: '/c ver',
      versionPattern: /(?<=Microsoft Windows \[Version )[\d.]+/,
      postProcessStdout: str => str.replace(/\r\n/g, '\n'),
      postProcessStderr: str => str.replace(/\r\n/g, '\n'),
    },
  }
  const defaultversionArgs = '--version'
  for (v in COMPILERS) {
    COMPILERS[v].versionArgs = COMPILERS[v].versionArgs || defaultversionArgs
  }

  function getCompilersVersion(cb, handleNotExisted) {
    let filtered = {}
    let isFiltered = false
    Object.keys(COMPILERS).forEach(title => {
      if (isCompilerIncluded(title))
        filtered[title] = COMPILERS[title]
      else
        isFiltered = true
    })
    const iteratee = (compiler, title, cb) => {
      const cmd = `${compiler.cmd} ${compiler.versionArgs}`
      exec(cmd, { encoding: 'utf8', shell: SHELL }, (err, stdout, stderr) => {
        if (cmdOpts._all.verbose && cmdOpts._all.versions) {
          console.log("\n" + cmd)
          verboseExecResult({ err, stdout, stderr }, true)
        }
        if (err || stderr) {
          if (!handleNotExisted) {
            const advice = '\nTry to exclude it with filter.'
            return cb((err.toString() || stderr) + advice)
          } else
            return cb(null, `failed to get version with "${cmd}"`)
        }
        const ma = stdout.match(compiler.versionPattern)
        cb(null, ma[0])
      })
    }
    async.mapValuesLimit(filtered, cmdOpts._all.pc, iteratee, (err, res) => {
      if (err) {
        return cb(err)
      }
      if (handleNotExisted || isFiltered)
        return cb(null, res)
      trySaveCompilersVersion(res, cb)
    })
  }

  function trySaveCompilersVersion(obj, cb) {
    const result = stringify(obj, { space: 2 })
    fs.readFile('ver.json', { encoding: 'utf8' }, (err, res) => {
      if (err && err.code != 'ENOENT')
        return cb(err)
      if (res != result) {
        fs.writeFile('ver.json', result, cb)
      } else {
        cb()
      }
    })
  }

  function isCompilerIncluded(title) {
    if (!cmdOpts._all.ic.test(title))
      return false
    if (cmdOpts._all.ec && cmdOpts._all.ec.test(title))
      return false
    return true
  }

  function isTestIncluded(groupTitle) {
    if (!cmdOpts._all.it.test(groupTitle))
      return false
    if (cmdOpts._all.et && cmdOpts._all.et.test(groupTitle))
      return false
    return true
  }

  return { COMPILERS, getCompilersVersion, isCompilerIncluded, isTestIncluded }
}
