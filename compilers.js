const fs = require('fs-extra')
const { exec } = require('child_process')
const async = require('async')
const stringify = require('json-stable-stringify')

// COMPILERS
//   compilerTitle
//     ...
//     title: compilerTitle
//     ...
//   ...

const COMPILERS = {
  bash: {
    cmd: 'bash',
    cmdArgs: '',
    title: 'bash',
    lineComment: '#',
    ext: '.sh',
    versionPattern: /(?<=GNU bash, version )[\d.]+/,
  },
  c_sharp:{
    cmd: 'csc',
    cmdArgs: '/out:":FILE.exe" ":FILE" && ":FILE.exe"',
    postCmd: 'rm -f ":FILE.exe"',
    title: 'c_sharp',
    lineComment: '//',
    ext: '.cs',
    versionCmd: '/help',
    versionPattern: /(?<=Microsoft \(R\) Visual C# Compiler version )[\d.]+/,
    postProcessStdout: str => str.replace(/^Microsoft.*LinkID=\d+\s+/s, '').replace(/\r\n/g, '\n'),
    postProcessStderr: str => str.replace(/\r\n/g, '\n')
  },
  gawk: {
    cmd: 'gawk',
    cmdArgs: '-f',
    title: 'gawk',
    lineComment: '#',
    ext: '.awk',
    versionPattern: /(?<=GNU Awk )[\d.]+/,
  },
  gcc: {
    cmd: 'gcc',
    preCmd: 'gcc -MM ":FILE"',
    preCmdResult: stdout => (stdout.match(/\b[^.\s]+\.h\b/g) || []).map(x => '"' + x.replace(/\.h/,'.c') + '"').join(' '),
    cmdArgs: '":FILE" :PRECMDRESULT -Werror -Wextra -Wall -Wpedantic -o ":FILE.exe" && ":FILE.exe"',
    postCmd: 'rm -f ":FILE.exe"',
    title: 'gcc',
    lineComment: '//',
    ext: '.c',
    versionPattern: /(?<=gcc \(GCC\) )[\d.]+/,
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
  powershell: {
    cmd: 'powershell',
    cmdArgs: '-file ./:FILE',
    title: 'powershell',
    lineComment: '#',
    ext: '.ps1',
    versionCmd: '$PSVersionTable.PsVersion.ToString()',
    versionPattern: /[\d.]+/,
    postProcessStdout: str => str.replace(/\r\n/g, '\n'),
    postProcessStderr: (str, fullname) => {
      const n = fullname.replace(/\\/g, '\\\\')
//       const re = new RegExp('(?:^|\\r\\n)..[^:]+' + n + ' : (.*?\\r\\n)At line:.*?\\r\\n (?=\\r\\n)', 'sg')
//       let res = str.replace(re, '$1').replace(/\r\n$/, '')
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
    alterCmdWithArgs: item => item.runCmd.replace(new RegExp('(?<=' + item.name + ')"'), '') + '"',
    title: 'winBatch',
    lineComment: 'REM ',
    ext: '.bat',
    versionCmd: '/c ver',
    versionPattern: /(?<=Microsoft Windows \[Version )[\d.]+/,
    postProcessStdout: str => str.replace(/\r\n/g, '\n'),
    postProcessStderr: str => str.replace(/\r\n/g, '\n'),
  },
}
const defaultVersionCmd = '--version'
for (v in COMPILERS) {
  COMPILERS[v].versionCmd = COMPILERS[v].versionCmd || defaultVersionCmd
}

function trySaveCompilersVersion(cb) {
  const iteratee = (compiler, title, cb) => {
    const cmd = `${compiler.cmd} ${compiler.versionCmd}`
    exec(cmd, { encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err || stderr) {
        return cb(err || stderr)
      }
      const ma = stdout.match(compiler.versionPattern)
      cb(null, ma[0])
    })
  }
  async.mapValues(COMPILERS, iteratee, (err, res) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    const result = stringify(res, { space: 2 })
    fs.readFile('ver.json', { encoding: 'utf8' }, (err, res) => {
      if (err && err.code != 'ENOENT')
        return cb(err)
      if (res != result)
        fs.writeFile('ver.json', result, cb)
      else
        cb()
    })
  })
}
module.exports = { COMPILERS, trySaveCompilersVersion }
