#include <iostream>

struct Base {
   virtual int foo(int a = 10) { return a; }
   virtual ~Base() {}
};

struct Derived: public Base {
   int foo(int a = 5) override { return a * 2; }
};

int main() {
   Base *pb = new Derived();
   std::cout << pb->foo() << std::endl;
   delete pb;
}

