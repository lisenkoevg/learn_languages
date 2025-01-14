#include <iostream>

using std::cin;
using std::cout;
using std::endl;

void swap_by_pointer(int *a, int *b) {
  int tmp = *a;
  *a = *b;
  *b = tmp;
}

void swap_by_reference(int &a, int &b) {
  int tmp = a;
  a = b;
  b = tmp;
}

void swap_address_by_reference(int *&a, int *&b) {
  int *tmp = a;
  a = b;
  b = tmp;
}

void swap_address_by_pointer(int **a, int **b) {
  int *tmp = *a;
  *a = *b;
  *b = tmp;
}

int main() {
  int x = 1, y = 2;
  cout << "x,y = " << x << "," << y << endl;
  swap_by_pointer(&x, &y);
  cout << "x,y = " << x << "," << y << endl;
  swap_by_reference(x, y);
  cout << "x,y = " << x << "," << y << endl;

  int *px = &x, *py = &y;
  cout << "*px,*py = " << *px << "," << *py << endl;
  swap_address_by_reference(px, py);
  cout << "*px,*py = " << *px << "," << *py << endl;
  swap_address_by_pointer(&px, &py);
  cout << "*px,*py = " << *px << "," << *py << endl;
  return 0;
}
