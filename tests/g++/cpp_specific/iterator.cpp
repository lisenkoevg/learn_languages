#include <iostream>
#include <string>
#include <vector>

using std::string;
using std::vector;
using std::cout;
using std::endl;

int main() {
  string s = "abc";
  const string &sr = s;

  auto it = s.begin(); // it is string::iterator
  auto itr = sr.begin(); // itr is string::const_iterator
  cout << (it == itr && *it == *itr) << endl;

  *it = 'A';
//   error: conversion from ‘__normal_iterator<const char*,[...]>’ to non-scalar type ‘__normal_iterator<char*,[...]>’ requested
//   string::iterator itr2 = sr.begin();

  auto it2 = s.cbegin(); // it2 is string::const_iterator
//   error: assignment of read-only location ‘it2.__gnu_cxx::__normal_iterator<const char*, std::basic_string<char> >::operator*()’
//   *it2 = 'D';
}

