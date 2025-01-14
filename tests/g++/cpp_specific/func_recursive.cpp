#include <iostream>
#include <vector>

using std::endl;
using std::cout;
using std::vector;

void print_recur(vector<int>::const_iterator beg, vector<int>::const_iterator end) {
  if (beg == end)
    return;
  cout << *beg << endl;
  print_recur(++beg, end);
}

void change_recur(vector<int>::iterator beg, vector<int>::iterator end) {
  if (beg == end)
    return;
  *beg *= 2;
  change_recur(++beg, end);
}

void change_recur(const vector<int> &v, vector<int>::iterator cur) {
  if (cur == v.cend())
    return;
  *cur *= 2;
  change_recur(v, ++cur);
}

int main() {
  vector<int> vec = {1,2,3,4,5};
  print_recur(vec.cbegin(), vec.cend());
  cout << endl;

  change_recur(vec.begin(), vec.end());
  print_recur(vec.cbegin(), vec.cend());
  cout << endl;

  change_recur(vec, vec.begin());
  print_recur(vec.cbegin(), vec.cend());
}

