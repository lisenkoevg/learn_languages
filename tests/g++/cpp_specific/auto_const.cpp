#include <iostream>

int main() {
  int i = 0, &r = i;
  auto a = r;
  const int ci = i, &cr = ci;
  auto b = ci;
  auto c = cr;
  auto d = &i;
  auto e = &ci;
  auto &g = ci;

  std::cout << (a == 0) << std::endl;

  a = 42;
  std::cout << (a == 42 && i == 0) << std::endl;

  b = 42;
  std::cout << (b == 42 && ci == 0) << std::endl;

  c = 42;
  std::cout << (c == 42 && cr == 0) << std::endl;

  //   error: invalid conversion from ‘int’ to ‘int*’ [-fpermissive]
  //   d = 42;

  //   error: invalid conversion from ‘int’ to ‘const int*’ [-fpermissive]
  //   e = 42;

  //   error: assignment of read-only reference ‘g’
  //   g = 42;
}
