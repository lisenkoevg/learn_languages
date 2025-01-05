// NVI - Non-virtual interface

#include <iostream>

struct NVIBase {
   int foo(int x = 10) { return foo_impl(x); }
   private:
   virtual int foo_impl(int a) { return a + 1; }
};

struct Derived : public NVIBase {
   int foo_impl(int a) override { return a + 2; }
};

int main() {
   NVIBase *d = new Derived;
   std::cout << d->foo() << std::endl;
   std::cout << static_cast<Derived*>(d)->foo() << std::endl;

   NVIBase *b = new NVIBase;
   std::cout << b->foo() << std::endl;
   std::cout << static_cast<Derived*>(b)->foo() << std::endl;

   Derived *d2 = new Derived;
   std::cout << d2->foo() << std::endl;
   std::cout << static_cast<NVIBase*>(d2)->foo() << std::endl;

//    Derived *b2 = new NVIBase;
//    std::cout << b2->foo() << std::endl;
//    std::cout << static_cast<NVIBase>(b2)->foo() << std::endl;
}
