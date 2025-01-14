#include <iostream>

using std::cout;
using std::endl;

using arrT1 = int[10];
typedef int arrT2[10];

int arr[10];

int (*f(int i))[10] { return nullptr; }
arrT1 *f1(int i) { return nullptr; }
arrT2 *f2(int i) { return nullptr; }
decltype(arr) *f3(int i) { return nullptr; }
auto f4(int i) -> int(*)[10] { return nullptr; } // trailing return type

int odd[] = {1,3,5,7,9};
int even[] = {0,2,4,6,8};

decltype(odd) *arrPtr(int i) {
  return (i % 2) ? &odd : &even;
}

decltype((odd)) arrRef(int i) {
  return (i % 2) ? odd : even;
}

int main() {
  cout << f(1) << endl;
  cout << f1(1) << endl;
  cout << f2(1) << endl;
  cout << f3(1) << endl;
  cout << f4(1) << endl;
  cout << endl;
  cout << (*arrPtr(1))[4] << endl;
  cout << arrRef(2)[4] << endl;
}
