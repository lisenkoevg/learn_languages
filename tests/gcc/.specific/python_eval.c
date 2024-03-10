#define PY_SSIZE_T_CLEAN
#include <Python.h>

/* gcc -std=c99 -ggdb3 -O0 -pedantic-errors -Wall -Wextra \
   -fpie $(python3-config --cflags --embed) -o c_python.exe \
   c_python.c $(python3-config --embed --ldflags)
*/

int main(int argc, char *argv[]) {
  (void)argc;
  wchar_t *program = Py_DecodeLocale(argv[0], NULL);
  if (program == NULL) {
      fprintf(stderr, "Fatal error: cannot decode argv[0]\n");
      exit(1);
  }
  Py_SetProgramName(program);
  Py_Initialize();
  PyRun_SimpleString(argv[1]);
  if (Py_FinalizeEx() < 0) {
      exit(120);
  }
  PyMem_RawFree(program);
  return 0;
}
