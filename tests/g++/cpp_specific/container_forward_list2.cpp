#include <iostream>
#include <forward_list>

using std::cout;
using std::endl;
using std::string;
using std::forward_list;

// Remove even values, duplicate odd values
int main() {
  forward_list<int> vi = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};

  for (auto i : vi) {
    cout << i << ",";
  }
  cout << endl;

  auto cur = vi.begin();
  auto prev = vi.before_begin();
  while (cur != vi.end()) {
    if (*cur % 2) {
      cur = vi.insert_after(cur, *cur);
      prev = cur++;
    } else {
      cur = vi.erase_after(prev);
    }
  }
  for (auto i : vi) {
    cout << i << ",";
  }
  cout << endl;
}
