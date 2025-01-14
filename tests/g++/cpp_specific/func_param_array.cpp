#include <iostream>
using std::cout;
using std::endl;

void print(const int *ia) {
  for (size_t i = 0; i != 4; ++i)
    cout << ia[i] << " ";
  cout << endl;
}

int main() {
  const int ia[] = {1,2,3,4};
  print(ia);
}
