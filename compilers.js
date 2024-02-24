const COMPILERS = {
  bash: {
    cmd: "bash",
    cmdArgs: "",
    title: "bash",
    lineComment: "#",
  },
  gawk: {
    cmd: "gawk",
    cmdArgs: "-f",
    title: "gawk",
    lineComment: "#",
  },
  nodejs: {
    cmd: "node",
    cmdArgs: "",
    title: "nodejs",
    lineComment: "//",
  },
  make: {
    cmd: "make",
    cmdArgs: "--silent -f",
    title: "make",
    lineComment: "#",
  },
  gcc: {
    cmd: "gcc",
    cmdArgs: '"FILE" -o "FILE.exe" & "FILE.exe" & rm "FILE.exe"',
    title: "gcc",
    lineComment: "//",
  },
  cmd: {
    cmd: "cmd",
    cmdArgs: "/c",
    title: "cmd",
    lineComment: "REM ",
  },
}
module.exports = COMPILERS
