// PVC - Pure virtual function call error


#include <iostream>

struct Base {
#if defined(PVC)
   Base() { unsafe(); }
#elif defined(PVCDIAG)
   Base() { doIt(); }
#else
   Base() { safe(); }
#endif
   void basesafe() { safe(); }
   virtual void safe() { std::cout << "Base::safe()" << std::endl; }
   void unsafe() { doIt(); }
   virtual void doIt() = 0;
   virtual ~Base() = 0;
};

Base::~Base() {}

struct Derived : public Base {
   void safe() override { std::cout << "Derived::safe()" << std::endl; }
   void doIt() override { std::cout << "Derived::doit()" << std::endl; }
};

int main() {
   Derived d;
   d.basesafe();
}

