#include <iostream>

const int i = 10;
constexpr int c = i;

int a = 20;
// error: the value of ‘a’ is not usable in a constant expression
// constexpr int b = a; 

int main() {
  std::cout << i << " " << c << std::endl;
}
