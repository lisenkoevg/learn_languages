#include <iostream>

using std::cout;
using std::endl;

int main() {
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
