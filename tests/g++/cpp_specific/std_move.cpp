#include <iostream>
#include <cassert>

template <typename T> class ScopedPointer {
  T *ptr_;
public:
  ScopedPointer(T *ptr) : ptr_(ptr) {}
};

int main() {
  int x = 1;
  int a = std::move(x);
  assert(x == a);
  std::cout << x << std::endl;

  x++;
  assert(x != a);
  std::cout << a << std::endl;

//   ScopedPointer y {new int(10)};
//   ScopedPointer b = std::move(y);
//   assert(y == b);
//   std::cout << 3 << std::endl;
}
