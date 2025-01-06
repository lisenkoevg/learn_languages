#include <iostream>

int main() {
  const int i = 1;
  const int *pi = &i;
//   int *pi2 = &i; // error: invalid conversion from ‘const int*’ to ‘int*’ [-fpermissive]
  std::cout << i << std::endl; // 1
//   ++*pi; // error: increment of read-only location ‘* pi’
  std::cout << i << std::endl; // 1

  int j = 2;
  int *pj = &j;
  const int *pj2 = &j;
  std::cout << *pj2 << std::endl; // 2
  j++;
  std::cout << j << std::endl; // 3
//   ++*pj2; // error: increment of read-only location ‘* pj2’
  std::cout << *pj2 << std::endl; // 3
}
