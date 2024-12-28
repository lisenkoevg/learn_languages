#include <iostream>

struct A {
  int a_;
  A(int a) : a_(a) { std::cout << "A ctor" << std::endl; }
  virtual void dump(std::ostream &os) const { os << a_; }
  virtual ~A() { std::cout << "A dtor" << std::endl; }
};

struct B : public A {
  int b_;
  B(int b) : A(b / 2), b_(b) { std::cout << "B ctor" << std::endl; }
  void dump(std::ostream &os) const override { os << a_ << " " << b_; }
  ~B() { std::cout << "B dtor" << std::endl; }
};

std::ostream &operator<<(std::ostream &os, const A &a) {
  a.dump(os);
  return os;
}

void foo(A a) { std::cout << a << std::endl; std::cout << 0 << std::endl; }
void bar(A &a) { std::cout << a << std::endl; }

int main() {
  B b1(10);
  foo(b1);
  std::cout << 1 << std::endl;
  bar(b1);
}

