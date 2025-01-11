#include <iostream>

int f() {
  std::cout << "This message does NOT print" << std::endl;
  return 0;
}

int main() {
  {
    int a = 3, b = 4;
    decltype(a) c = a;
    decltype((b)) d = a; // d has type int&
    decltype(f()) e = a; // e has type equal to f() return type

    ++c;
    std::cout << (c == 4 && a == 3) << std::endl;

    ++d;
    std::cout << (d == 4 && a == 4) << std::endl;
  }
  {
    const int a = 1;
    const int &aRef = a;
    decltype(a) b = 100;
    decltype(aRef) c = 10; // aRef has type "const int&", not "const int"
    decltype(aRef) d = a;
//     b++; // error: increment of read-only variable 'b' 
//     decltype((a)) f; // error: ‘f’ declared as reference but not initialized
//     decltype(a) g; // error: uninitialized ‘const g’ [-fpermissive]
    int x = 1;
    decltype(x) z;
  }
  {
    int a = 3, b = 33;
    decltype(a) c = a;
    std::cout << (c == 3) << std::endl;

    decltype(a = b) d = a; // assignment operator returns type int&
    std::cout << (++d == a) << std::endl;
  }
}
