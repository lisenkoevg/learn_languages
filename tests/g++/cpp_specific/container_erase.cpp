#include <iostream>
#include <forward_list>
#include <vector>
#include <list>

using std::begin;
using std::cbegin;
using std::cend;
using std::cout;
using std::end;
using std::endl;
using std::forward_list;
using std::list;
using std::string;
using std::vector;

// remove odd values from list, remove even values from vector
void process(vector<int> &v, list<int> &li) {
  auto bv = v.begin();
  auto bl = li.begin();
  while (bv != v.cend() && bl != li.cend()) {
    if (*bv % 2 == 0) {
      bv = v.erase(bv);
      ++bl;
    } else {
      bl = li.erase(bl);
      ++bv;
    }
  }
}

// remove even values from vector
void process_fl(forward_list<int> &fl) {
  auto cur = fl.begin();
  auto prev = fl.before_begin();
  while (cur != fl.cend()) {
    if (*cur % 2 == 0) {
      cur = fl.erase_after(prev);
    } else {
      ++cur;
      ++prev;
    }
  }
}

int main() {
  int ia[] = {0, 1, 1, 2, 3, 5, 8, 13, 21, 55, 89};

  vector<int> v(cbegin(ia), cend(ia));
  list<int> li(begin(ia), end(ia));
  forward_list<int> fl(begin(ia), end(ia));

  for (const auto i : ia) {
    cout << i << ",";
  }
  cout << endl;

  process(v, li);
  process_fl(fl);

  for (const auto i : v) {
    cout << i << ",";
  }
  cout << endl;
  for (const auto i : li) {
    cout << i << ",";
  }
  cout << endl;
  for (const auto i : fl) {
    cout << i << ",";
  }
  cout << endl;
}
