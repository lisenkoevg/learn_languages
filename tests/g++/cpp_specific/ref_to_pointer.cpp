#include <iostream>

int main() {
  int i = 100;
  int *pi = &i;
  int *&ref_pi = pi;
  std::cout << i << " " << (pi == ref_pi) << std::endl;
  
  int *pi2 = &i;
  int &ref_pi2 = *pi2;
  std::cout << (pi2 == pi) << " " << ref_pi2 << std::endl;
}
