#include <stdio.h>
#include "submodule.c"

int main() {
  printf("main module\n");
  submodule();
  return 0;
}
