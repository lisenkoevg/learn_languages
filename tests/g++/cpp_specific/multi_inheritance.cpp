#include <iostream>

class IBuffer {
public:
  char *ch;
  IBuffer(int n) {
    ch = new char[n];
    std::cout << "IBuffer ctor" << std::endl;
  }
  ~IBuffer() {
    delete[] ch;
    std::cout << "IBuffer dtor" << std::endl;
  }
};

class Array {
protected:
  IBuffer *buf_;
public:
  explicit Array(IBuffer *buf) : buf_(buf) {
    std::cout << "Array ctor" << std::endl;
  }
  ~Array() {
    std::cout << "Array dtor" << std::endl;
  }
};

class MyBuffer : public IBuffer {
  public:
  MyBuffer(int a) : IBuffer(a) {
    std::cout << "MyBuffer ctor" << std::endl;
  }
  ~MyBuffer() {
    std::cout << "MyBuffer dtor" << std::endl;
  }
};

class MyArray : public Array {
protected:
  MyBuffer mbuf_;
public:
  explicit MyArray(int size) : mbuf_(size), Array(&mbuf_) {
    std::cout << "MyArray ctor" << std::endl;
  }
  ~MyArray() {
    std::cout << "MyArray dtor" << std::endl;
  }
};

class Base {
  public:
  int b;
  Base() : b(20) {}
  virtual void doIt() {
    std::cout << "Base::doIt()" << std::endl;
  }
};
class Derived : public Base {
  public:
  int a;
  Derived() : a(10), Base() {}
  void doIt() override {
    std::cout << "Derived::doIt()" << std::endl;
  }
};
int main() {
  Base *b = new Base();
  Base *d = new Derived();
  Derived *dd = new Derived();
  std::cout << static_cast<Derived*>(d)->a << std::endl;
  std::cout << d->b << std::endl;
  d->doIt();
  dd->doIt();
  b->doIt();
  std::cout << d->b << std::endl;
#if 0
  MyArray *ma = new MyArray(1);
  delete ma;
  buf.ch[0] = 'a';
  Array a = Array{&buf};
  std::cout << &a << std::endl;
  std::cout << &buf << std::endl;
  std::cout << buf.ch[0] << std::endl;
#endif
}
