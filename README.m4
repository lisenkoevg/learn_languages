changequote(`"', `"')dnl
define("_help_cmd", "node . --help")dnl
define("_compilers_config_cmd", "node . -c | sed '/^cmdOptions:/Q'")dnl
define("_backtick", "```")dnl
changequote()dnl
## Get equal results for different languages input sources
_backtick
$ _help_cmd
esyscmd(_help_cmd)
_backtick
### Compilers configurations
("compiler" in this project is any program which convert some input to some output:)
_backtick
esyscmd(_compilers_config_cmd)
_backtick
_backtick
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
_backtick
