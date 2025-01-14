#include <iostream>

using std::cout;
using std::endl;

void foo(std::initializer_list<int> nums) {
  for (const int &el : nums) {
    cout << el << endl;
  }

  for (const int *be = std::begin(nums); be != std::end(nums); ++be){
    cout << *be << endl;
  }

  return;
}

int main() {
  foo({1,2,3});
  return EXIT_SUCCESS;
}
