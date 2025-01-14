#include <iostream>

using std::endl;
using std::cout;

int &get(int *arr, int idx) {
  return arr[idx];
}

int main() {
 int arr[5]{0}; 
 for (int i = 0; i != 5; ++i) {
   get(arr, i) = i * 2;
   cout << arr[i] << endl;
 }
}
