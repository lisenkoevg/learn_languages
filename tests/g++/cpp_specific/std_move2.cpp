#include <iostream>

struct Number {
  int value_ = {};
};

class T {
public:
  T(const Number &n) : n_{n} {}

  T(const T &) { std::puts("Copy ctor"); }

  Number get() { return n_; }

private:
  Number n_;
};

static T create(Number &&n) {
  return T{std::move(n)};
}

int main() {
//   T x = T{(Number{42})};
  T x = T{create(Number{42})};
//   std::cout << x.get().value_ << std::endl;
  return x.get().value_;
}

