#include <iostream>

int main() {
  const int i = 42;
  auto j = i;
  const auto &k = i;
  auto &k1 = i;

  auto *p = &i;
  auto *p1 = &j;
  auto * const p2 = &j;
  const auto j2 = i;
  const auto &k2 = i;

  j--;
  std::cout << (j == 41) << std::endl;

//   error: decrement of read-only reference ‘k’
//   k--;

//    error: decrement of read-only reference ‘k1’
//   k1--;

//   error: increment of read-only location ‘* p’
//   ++(*p);

  p = &j;
//   error: decrement of read-only location ‘* p’
//   (*p)--; 

  (*p1)--;
  std::cout << (j == 40) << std::endl;
  (*p2)--;
  std::cout << (j == 39) << std::endl;

//   error: assignment of read-only variable ‘p2’
//   p2 = &i;

//   error: cannot bind non-const lvalue reference of type ‘int&’ to an rvalue of type ‘int’
//   auto &h = 42;
    const auto &hh = 42;
}
