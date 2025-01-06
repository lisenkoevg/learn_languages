#include <iostream>

int main() {
  int i = 10;
  int &j = i;
  std::cout << (&i == &j) << std::endl; // same addresses 
  
  int ival = 2.01;
  int &rval = ival;
  std::cout << ival << std::endl; // 2
  std::cout << rval << std::endl; // 2
  
  int k = 2, &r1 = k;
  double d = 0, &r2 = d;

  r2 = 3.14;
  std::cout << r2 << std::endl; // 3.14
  r2 = r1;
  std::cout << r2 << std::endl; // 2
  k = r2;
  std::cout << k << std::endl; // 2
  r1 = d;
  std::cout << r1 << std::endl; // 2

  const int &m = 10; // rvalue reference
  std::cout << m << std::endl; // 10
//   m = 20; // error: assignment of read-only reference ‘m’
}
