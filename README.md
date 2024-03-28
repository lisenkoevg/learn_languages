# Get equals results for different languages input sources

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
```
COMPILERS
  compilerTitle
    ...
    title: compilerTitle
    ...
  ...
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
