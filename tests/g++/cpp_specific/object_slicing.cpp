#include <iostream>

struct A {
  int a_;
  A(int a) : a_(a) {
    std::cout << "A ctor" << std::endl;
  }
  ~A() {
    std::cout << "A dtor" << std::endl;
  }
};

struct B : public A {
  int b_;
  B(int b) : A(b / 2), b_(b) {
    std::cout << "B ctor" << std::endl;
  }
  ~B() {
    std::cout << "B dtor" << std::endl;
  }
};

std::ostream &operator<<(std::ostream &os, const B &b) {
  os << b.a_ << " " << b.b_;
  return os;
}

int main() {
  B b1(10);
  B b2(8);
  A &a_ref = b2;
  std::cout << b1 << std::endl;
  std::cout << b2 << std::endl;
  a_ref = b1;
  std::cout << b1 << std::endl;
  std::cout << b2 << std::endl;
}

