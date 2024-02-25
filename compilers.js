const fs = require('fs-extra')
const { exec } = require('child_process')
const async = require('async')
const stringify = require('json-stable-stringify')

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
  },
  gcc: {
    cmd: "gcc",
    cmdArgs: '"FILE" -o "FILE.exe" & "FILE.exe" & rm "FILE.exe"',
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
  },
}
const defaultVersionCmd = '--version'
for (v in COMPILERS) {
  COMPILERS[v].versionCmd = COMPILERS[v].versionCmd || defaultVersionCmd
}

getCompilersVersion()

function getCompilersVersion() {
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
        return console.error(err)
      if (res != result)
        fs.writeFile('ver.json', result, err => {
          if (err)
            console.error(err)
        })
    })
  })
}
module.exports = COMPILERS
