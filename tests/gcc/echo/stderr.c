#include <stdio.h>

int main() {
  fprintf(stderr, "%s\n", "line written to stderr");
  return 0;
}
