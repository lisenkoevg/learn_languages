// EBCO is Empty Base Class Optimization

#include <iostream>
#include <memory>

enum { SZ = 1000 };

struct CDeleterTy {
  void operator()(int *t) { delete[] t; }
};

auto LDeleter = [](int *t) { delete[] t; };
using LDeleterTy = decltype(LDeleter);

void FDeleter(int *t) { delete[] t; };
using FDeleterTy = decltype(&FDeleter);

int main() {
  int *Uip = new int[SZ]();
  std::unique_ptr<int, CDeleterTy> Uic{new int[SZ]()};
  std::unique_ptr<int, LDeleterTy> Uil{new int[SZ](), LDeleter};
  std::unique_ptr<int, FDeleterTy> Uif{new int[SZ](), FDeleter};
  
  std::cout << "pi:" << sizeof(Uip) << std::endl;
  std::cout << "Uic:" << sizeof(Uic) << std::endl;
  std::cout << "Uil:" << sizeof(Uil) << std::endl;
  std::cout << "Uif:" << sizeof(Uif) << std::endl;

  delete[] Uip;
}

