#include <iostream>

int main() {
  const int &i = 10;
  int a = 5;
  const int &k = a; // OK
//   int &j = 20; // error: cannot bind non-const lvalue reference of type ‘int&’ to an rvalue of type ‘int’
  std::cout << i << std::endl; // 10
  std::cout << k << std::endl; // 5
  a += 3; // OK
  std::cout << k << std::endl; // 8
//   k += 3; // error: assignment of read-only reference ‘k’

  const int c = 20;
//   int &ref_c = c; // error: binding reference of type ‘int&’ to ‘const int’ discards qualifiers

  double dval = 3.14;
  const int &ri = dval;  
//   int &dr = dval; // cannot bind non-const lvalue reference of type ‘int&’ to a value of type ‘double’
  std::cout << dval << std::endl; // 3.14
  std::cout << ri << std::endl; // 3 
//   ri = 3.88; // error: assignment of read-only reference ‘ri’
  dval = 4.14;
  std::cout << dval << std::endl; // 4.14
  std::cout << ri << std::endl; // 3 

}

