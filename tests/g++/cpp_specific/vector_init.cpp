#include <iostream>
#include <vector>

using std::vector;
using std::cout;
using std::endl;

int main() {
  //   vectors with 3 items
  vector<int> a{1, 2, 3};
  vector<int> b = {1, 2, 3};
  cout << (a.size() == 3 && b.size() == 3) << endl;

  //   vector with 1 item equal 2 (?)
  vector<int> c(1, 2);
  cout << (c.size() == 1 && c[0] == 2) << endl;

  //   error: conversion from ‘int’ to non-scalar type ‘std::vector<int>’ requested
//   vector<int> c1 = (1, 2);

  //   error: no matching function for call to ‘std::vector<int>::vector(int, int, int)’
//   vector<int> d(1, 2, 3);

  //   error: conversion from ‘int’ to non-scalar type ‘std::vector<int>’ requested
//   vector<int> e = (1, 2, 3);

  //   error: conversion from ‘int’ to non-scalar type ‘std::vector<int>’  requested
//   vector<int> v = 10;

  vector<std::string> v1{"10"};
  vector<std::string> v2{10};

  cout << (v1.size() == 1) << endl;
  cout << (v2.size() == 10) << endl;
}
