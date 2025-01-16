#include <iostream>

using std::cout;
using std::endl;
using std::string;

int grade1() {
  cout << "grade1()" << endl;
  return 100;
}

int grade2() {
  cout << "grade2()" << endl;
  return 0;
}

int main() {
  int grade {0};
  string finalgrade;

  finalgrade = (grade1() > 90) ? "high pass" : (grade2() < 60) ? "fail" : "pass";
  cout << endl;
  finalgrade = (grade1() < 90) ? "high pass" : (grade2() < 60) ? "fail" : "pass";
  cout << endl;
  finalgrade = (grade1() < 90) ? "high pass" : ((grade2() < 60) ? "fail" : "pass");
  cout << endl;
#ifdef ERR
//   error: operands to ‘?:’ have different types ‘const char*’ and ‘bool’
  finalgrade = ((grade1() > 90) ? "high pass" : (grade2() < 60)) ? "fail" : "pass";
#endif
  int x = 1, y = 2;
  // true ? ++x, ++y : --x, --y;
  // without braces treated as
  // (true ? ++x, ++y : --x), --y;
  // and yields error: expected unqualified-id before ‘--’ token
  int a = true ? ++x, ++y : (--x, --y); 
  cout << "a,x,y=" << a << x << y << endl; // 3 2 3
  a = false ? ++x, ++y : (--x, --y); 
  cout << "a,x,y=" << a << x << y << endl; // 2 1 2
}
