#include <iostream>
#include <string>
using std::cout;
using std::endl;
using std::string;

int glA[10];
string glS[10];

int main() {

  int arr[10]; // arr is array of 10 ints
  int *ptrs[10]; // ptrs is array of 10 elements of type pointer to int

//   error: declaration of ‘refs’ as array of references
//   int &refs[10] = arr;

  int (*Parray)[10] = &arr; // Parray is pointer to array of 10 elements of type int
  int (&Pref)[10] = arr; // Pref is reference to array of 10 elements of type int

  unsigned size = 100;

//   warning: ISO C++ forbids variable length array ‘arr2’ [-Wvla]
//   error: ISO C++ forbids variable length array ‘arr2’ [-Wvla] (if compiled as g++ -pedantic-errors ...)
//   int arr2[size]; 

  cout << (glA[0] == 0 && glS[0] == "") << endl;
  for (auto i : glA) 
    cout << i << " ";
  cout << endl;

  for (auto i : glS) 
    cout << i << "|";
  cout << endl;

#if 0
  for (auto i : arr) 
    cout << i << " "; //rubbish
  cout << endl;

  char chArr[100];
  for (int i = 0; i < 100; i++) 
    cout << chArr[i] << " "; // rubbish
  cout << endl;
#endif

}
