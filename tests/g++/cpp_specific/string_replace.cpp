#include <iostream>

using std::endl;
using std::cout;
using std::string;

string replace(string s, const string &oldVal, const string &newVal);

int main() {
  string s("123123231232233123");
  string oldVal("23");
  string newVal(" AAAA ");

  cout << s << endl;
  cout << replace(s, oldVal, newVal) << endl;
}

string replace(string s, const string &oldVal, const string &newVal) {
  string::size_type sz = oldVal.size();
  string::size_type szNew = newVal.size();
  auto itOld = oldVal.cbegin();
  auto it = s.begin();
  while (it != s.cend()) {
    if (*it == *itOld) {
      if (static_cast<string::size_type>(s.cend() - it) >= sz) {
        string subOld(it, it + sz);
        if (oldVal == subOld) {
#ifdef ERASE_INSERT 
          it = s.erase(it, it + sz);
          //gnu g++ 11 not work - s.insert() returns void instead iterator
          it = s.insert(it, newVal.begin(), newVal.end());
          it += szNew;
#else
          auto pos = it - s.begin();
          s.replace(pos, sz, newVal);
          it = s.begin() + pos + sz;
#endif
          continue;
        }
      } else {
        break;
      }
    }
    ++it;
  }
  return s;
}
