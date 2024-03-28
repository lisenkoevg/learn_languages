## Get equal results for different languages input sources
```
$ node . --help

Learn Languages Project

  Make different languages inputs get same result. 

Usage:

  --run [ --quiet | --verbose ] <filters> <paralellism> 
  --dry-run [ --verbose ] <filters>                     
  --show <filter by compiler>                           
  --config [ --verbose ] <filter by compiler>           
  --versions [ --verbose ] <filter by compiler>         
  --rename-group old_name:new_name [--dry-run]          
  --remove-group group_name [--dry-run]                 

Main options

  -r, --run         run tests                                                   
  -n, --dry-run     don'n run tests, but show tests and expected files, with    
                    group options show what would be done                       
  --show            show test source code, it's intput data and expected result 
  -c, --config      show compilers configuration                                
  -V, --versions    try to get versions for configured compilers                

Filters options

  --ic string   include regexp filter by compiler name       
  --ec string   exclude regexp filter by compiler name       
  --it string   include regexp filter by test group and name 
  --et string   exclude regexp filter by test group and name 

Work with test groups

  --rename-group string   rename or move group of tests 
  --remove-group string   remove group of tests         

Options related to paralellism

  -s, --sequental    set to 1 both parallel tests and parallel compilers 
  --pc number        number of parallel compilers                        
  --pt number        number of parallel tests running by one compiler    

Misc

  -h, --help       show this help                                               
  -v, --verbose    verbose compilers output of err, stdout, stderr and verbose  
                   actions with groups                                          
  -q, --quiet      don't show passed tests report                               

  Project home: https://gitflic.ru/project/evgeen/learn_languages 


```
### Compilers configurations
("compiler" in this project is any program which convert some input to some output:)
```
COMPILERS:
{
  "C#": {
    "cmd": "csc",
    "cmdArgs": "/out:\":FILE.exe\" \":FILE\" && \"./:FILE.exe\"",
    "ext": ".cs",
    "lineComment": "//",
    "postCmd": "rm -f \":FILE.exe\"",
    "postProcessStderr": "str => str.replace(/\\r\\n/g, '\\n')",
    "postProcessStdout": "str => str.replace(/^Microsoft.*LinkID=\\d+\\s+/s, '').replace(/\\r\\n/g, '\\n')",
    "title": "C#",
    "versionArgs": "/help",
    "versionPattern": "/(?<=Microsoft \\(R\\) Visual C# Compiler version )[\\d.]+/"
  },
  "bash": {
    "cmd": "bash",
    "cmdArgs": "",
    "ext": ".sh",
    "lineComment": "#",
    "title": "bash",
    "versionArgs": "--version",
    "versionPattern": "/(?<=GNU bash, version )[\\d.]+/"
  },
  "g++": {
    "cmd": "g++",
    "cmdArgs": "\":FILE\" -o \":FILE.exe\" && \"./:FILE.exe\"",
    "ext": ".cpp",
    "lineComment": "//",
    "postCmd": "rm -f \":FILE.exe\"",
    "title": "g++",
    "versionArgs": "--version",
    "versionPattern": "/(?<=g\\+\\+ \\(GCC\\) )[\\d.]+/"
  },
  "gawk": {
    "cmd": "gawk",
    "cmdArgs": ":PRECMDRESULT -f",
    "ext": ".awk",
    "lineComment": "#",
    "preCmdResult": "(s, env) => env && Object.keys(env).map(name => `-v ${name}=\"${env[name]}\"`).join(' ') || ''",
    "title": "gawk",
    "versionArgs": "--version",
    "versionPattern": "/(?<=GNU Awk )[\\d.]+/"
  },
  "gcc": {
    "cmd": "gcc",
    "cmdArgs": "\":FILE\" :PRECMDRESULT -Werror -Wextra -Wall -Wpedantic -o \":FILE.exe\" && \"./:FILE.exe\"",
    "ext": ".c",
    "lineComment": "//",
    "postCmd": "rm -f \":FILE.exe\"",
    "postProcessStderr": "str => str.replace(/\\r\\n/g, '\\n')",
    "postProcessStdout": "str => str.replace(/\\r\\n/g, '\\n')",
    "preCmd": "gcc -MM \":FILE\"",
    "preCmdResult": "stdout => (stdout.match(/\\b[^.\\s]+\\.h\\b/g) || []).map(x => '\"' + x.replace(/\\.h/,'.c') + '\"').join(' ')",
    "title": "gcc",
    "versionArgs": "--version",
    "versionPattern": "/(?<=gcc \\(GCC\\) )[\\d.]+/"
  },
  "lua": {
    "cmd": "lua",
    "cmdArgs": "",
    "ext": ".lua",
    "lineComment": "--",
    "title": "lua",
    "versionArgs": "-v",
    "versionPattern": "/(?<=Lua )[\\d.]+/"
  },
  "m4": {
    "cmd": "m4",
    "cmdArgs": "",
    "ext": ".m4",
    "lineComment": "#",
    "title": "m4",
    "versionArgs": "--version",
    "versionPattern": "/(?<=m4 \\(GNU M4\\) )[\\d.]+/"
  },
  "make": {
    "cmd": "make",
    "cmdArgs": "--silent -f",
    "ext": ".mk",
    "lineComment": "#",
    "postProcessStderr": "str => str.replace(/(^[^*]*\\*{3} )(.*)\\.  Stop\\./, '$2')",
    "title": "make",
    "versionArgs": "--version",
    "versionPattern": "/(?<=GNU Make )[\\d.]+/"
  },
  "nodejs": {
    "cmd": "node",
    "cmdArgs": "",
    "ext": [
      ".js",
      ".mjs",
      ".cjs"
    ],
    "lineComment": "//",
    "title": "nodejs",
    "versionArgs": "--version",
    "versionPattern": "/(?<=v)[\\d.]+/"
  },
  "php": {
    "cmd": "php",
    "cmdArgs": "",
    "ext": ".php",
    "lineComment": "//",
    "title": "php",
    "versionArgs": "--version",
    "versionPattern": "/(?<=PHP )[\\d.]+/"
  },
  "powershell": {
    "cmd": "powershell",
    "cmdArgs": "-file ./:FILE",
    "ext": ".ps1",
    "lineComment": "#",
    "postProcessStderr": "(str, fullname) => {\n        const n = fullname.replace(/\\\\/g, '\\\\\\\\')\n        const re = new RegExp('(?:^|\\\\r\\\\n)..[^:]+' + n + ' : (.*?\\\\r\\\\n) {4}\\\\+ CategoryInfo.*?\\\\r\\\\n (?=\\\\r\\\\n)', 'sg')\n        let res = str.replace(re, '$1').replace(/\\r\\n$/, '')\n        res = res.replace(/\\r\\n/g, '\\n')\n        return res\n      }",
    "postProcessStdout": "str => str.replace(/\\r\\n/g, '\\n')",
    "title": "powershell",
    "versionArgs": "'$PSVersionTable.PsVersion.ToString()'",
    "versionPattern": "/[\\d.]+/"
  },
  "python": {
    "cmd": "python3.9",
    "cmdArgs": "-B",
    "ext": ".py",
    "lineComment": "#",
    "title": "python",
    "versionArgs": "--version",
    "versionPattern": "/(?<=Python )[\\d.]+/"
  },
  "ruby": {
    "cmd": "ruby",
    "cmdArgs": "",
    "ext": ".rb",
    "lineComment": "#",
    "title": "ruby",
    "versionArgs": "--version",
    "versionPattern": "/(?<=ruby )[\\d.]+/"
  },
  "vim": {
    "cmd": "vim",
    "cmdArgs": "--not-a-term -u",
    "ext": ".vim",
    "lineComment": "#",
    "postProcessStdout": "str => str.replace(/(\\r\\r\\n(<BR>)?){1,2}/g, '\\n')",
    "title": "vim",
    "versionArgs": "--version",
    "versionPattern": "/(?<=VIM - Vi IMproved )[\\d.]+/i"
  },
  "winBatch": {
    "cmd": "cmd",
    "cmdArgs": "/d /c",
    "ext": ".bat",
    "lineComment": "REM ",
    "postProcessStderr": "str => str.replace(/\\r\\n/g, '\\n')",
    "postProcessStdout": "str => str.replace(/\\r\\n/g, '\\n')",
    "title": "winBatch",
    "versionArgs": "/c ver",
    "versionPattern": "/(?<=Microsoft Windows \\[Version )[\\d.]+/"
  }
}

```
```
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
```
