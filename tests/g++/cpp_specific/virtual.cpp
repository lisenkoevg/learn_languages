#include <iostream>
using namespace std;

struct B {
  virtual void f() const { cout << "B::f\n"; }
  void g() const { cout << "B::g\n"; }
};

struct D : B {
  void f() const { cout << "D::f\n"; }
  void g() { cout << "D::g\n"; }
};

struct DD : D {
  void f() const { cout << "DD::f\n"; }
  void g() { cout << "DD::g\n"; }
};

void call(const B& b) {
  b.f();
  b.g();
}

int main() {
  B b;
  D d;
  DD dd;

  call(b);
  call(d);
  call(dd);

  b.f();
  b.g();
  d.f();
  d.g();
  dd.f();
  dd.g();
}
