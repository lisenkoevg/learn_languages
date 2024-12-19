#include <cstdio>

#define LOG puts(__PRETTY_FUNCTION__)

struct T {
  T() { LOG; };
  ~T() { LOG; };
  T(const T &) { LOG; };
  T &operator=(const T &) { LOG; return *this; }
  T(T &&) { LOG; };
  T &operator=(T &&) { LOG; return *this; }
};

// T &&foo() {
//   return T{};
// }

int main() {
  T x = T{};
  T y = T{x};
  T z = y;
//   T z = foo();
}
