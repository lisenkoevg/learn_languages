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
    cmd: "bash",
    cmdArgs: "",
    title: "bash",
    lineComment: "#",
    ext: '.sh',
    versionPattern: /(?<=GNU bash, version )[\d.]+/,
  },
  gawk: {
    cmd: "gawk",
    cmdArgs: "-f",
    title: "gawk",
    lineComment: "#",
    ext: '.awk',
    versionPattern: /(?<=GNU Awk )[\d.]+/,
  },
  nodejs: {
    cmd: "node",
    cmdArgs: "",
    title: "nodejs",
    lineComment: "//",
    ext: '.js',
    versionPattern: /(?<=v)[\d.]+/,
  },
  make: {
    cmd: "make",
    cmdArgs: "--silent -f",
    title: "make",
    lineComment: "#",
    ext: '.mk',
    versionPattern: /(?<=GNU Make )[\d.]+/,
    postProcessStderr: { search: /(^[^*]*\*{3} )(.*)\.  Stop\./, replace: '$2' }
  },
  gcc: {
    cmd: "gcc",
    preCmd: 'gcc -MM ":FILE"',
    preCmdResult: stdout => (stdout.match(/\b[^.\s]+\.h\b/g) || []).map(x => '"' + x.replace(/\.h/,'.c') + '"').join(' '),
    cmdArgs: '":FILE" :PRECMDRESULT -Werror -Wextra -Wall -Wpedantic -o ":FILE.exe" && ":FILE.exe"',
    postCmd: 'rm ":FILE.exe"',
    title: "gcc",
    lineComment: "//",
    ext: '.c',
    versionPattern: /(?<=gcc \(GCC\) )[\d.]+/,
  },
  cmd: {
    cmd: "cmd",
    cmdArgs: "/c",
    title: "cmd",
    lineComment: "REM ",
    ext: '.bat',
    versionCmd: '/c ver',
    versionPattern: /(?<=Microsoft Windows \[Version )[\d.]+/,
    postProcessStdout: { search: /\r\n/g, replace: '\n' }
  },
  python: {
    cmd: "python3.9",
    cmdArgs: '',
    title: "python",
    lineComment: "#",
    ext: '.py',
    versionPattern: /(?<=Python )[\d.]+/,
  },
  ruby: {
    cmd: "ruby",
    cmdArgs: '',
    title: "ruby",
    lineComment: "#",
    ext: '.rb',
    versionPattern: /(?<=ruby )[\d.]+/,
  },
}
COMPILERS.cmd.postProcessStderr = COMPILERS.cmd.postProcessStdout
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
