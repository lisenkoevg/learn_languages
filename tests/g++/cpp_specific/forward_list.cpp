#include <iostream>
#include <forward_list>

using std::cout;
using std::endl;
using std::string;
using std::forward_list;

void insert_after(forward_list<string> &fl, const string &s1, const string &s2) {
  auto cur = fl.begin();
  auto prev = fl.before_begin();
  while (cur != fl.cend() && *cur != s1) {
    ++cur;
    ++prev;
  }
  fl.insert_after(cur != fl.cend() ? cur : prev, s2);
  return;
}

void print(const forward_list<string> &fl) {
  for (auto item : fl) {
    cout << item << ",";
  }
  cout << endl;
  return;
}

int main() {
  forward_list<string> fl;

  fl.assign({"a", "b", "c"});
  insert_after(fl, "a", "aaa");
  print(fl);

  fl.assign({"a", "b", "c"});
  insert_after(fl, "b", "aaa");
  print(fl);

  fl.assign({"a", "b", "c"});
  insert_after(fl, "c", "aaa");
  print(fl);

  fl.assign({"a", "b", "c"});
  insert_after(fl, "x", "aaa");
  print(fl);
}
