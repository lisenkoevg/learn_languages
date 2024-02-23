const COMPILERS = {
  bash: {
    cmd: "bash",
    cmdArgs: "",
    title: "bash",
  },
  gawk: {
    cmd: "gawk",
    cmdArgs: "-f",
    title: "gawk",
  },
  nodejs: {
    cmd: "node",
    cmdArgs: "",
    title: "nodejs"
  },
  GNUmake: {
    cmd: "make",
    cmdArgs: "--silent -f",
    title: "GNUmake"
  },
}
module.exports = COMPILERS
