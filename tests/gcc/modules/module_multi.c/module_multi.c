#include <stdio.h>
#include "submodule.h"
#include "submodule2.h"

int main() {
  printf("main module\n");
  submodule();
  submodule2();
  return 0;
}
