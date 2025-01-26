#include <iostream>

using std::cout;
using std::endl;

int calc(int &a, int &b) { return 0; }
int calc(const int &a, const int &b) { return 0; }

#ifndef ERR_REDEFINITION
int calc(char *a, char *b) { return 0; }
int calc(const char *a, const char *b) { return 0; }
#else
// error: redefinition of ‘int calc(char*, char*)’
int calc(char *a, char *b) { return 0; }
int calc(char * const a, char * const b) { return 0; }
#endif

void f() { cout << "f()" << endl; }
void f(int i) { cout << "f(int)" << endl; }
void f(int i, int j) { cout << "f(int, int)" << endl; }
void f(double i, double j) { cout << "f(double, double)" << endl; }

int main() {
#ifdef ERR_AMBIGUOUS  
// overload_matching.cpp:12:4: error: call of overloaded ‘f(double, int)’ is ambiguous
// overload_matching.cpp:8:6: note: candidate: ‘void f(int, int)’
// overload_matching.cpp:9:6: note: candidate: ‘void f(double, double)’
  f(2.56, 42);
#endif
  f(42);
  f(42, 0);
  f(1.0, 2.0);
}
