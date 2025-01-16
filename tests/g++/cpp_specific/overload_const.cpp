#include <iostream>

using std::cout;
using std::endl;
using std::string;

const string &shorterString(const string &s1, const string &s2) {
  cout << "const string &" << endl;
  return s1.size() <= s2.size() ? s1 : s2;
}

string &shorterString(string &s1, string &s2) {
  cout << "string &" << endl;
#ifdef ERR_REF_TO_LOCAL
//   if "auto r/const string r": warning: reference to local variable ‘r’ returned [-Wreturn-local-addr]
//   and program crushes (segmentation fault),
//   see: https://herbsutter.com/2008/01/01/gotw-88-a-candidate-for-the-most-important-const/
  const string r = shorterString(const_cast<const string &>(s1), const_cast<const string &>(s2));
#else
  const string &r = shorterString(const_cast<const string &>(s1), const_cast<const string &>(s2));
#endif
  return const_cast<string &>(r);
}

string f(const string s1, const string s2) {
  cout << "f(const string, const string)" << endl;
  return s1.size() <= s2.size() ? s1 : s2;
}

#ifdef ERR_REDEFINITION
// error: ambiguating new declaration of ‘int f(std::string, std::string)’
int f(const string s1, const string s2) { return 0; }

// error: redefinition of ‘std::string f(std::string, std::string)’
string f(string s1, string s2) {
  cout << "f(const string, const string)" << endl;
  return s1.size() <= s2.size() ? s1 : s2;
}
#endif

int main() {
  {
    const string s1 = "abcd";
    const string s2 = "def";
    cout << shorterString(s1, s2) << endl;
    const string res = f(s1, s2);
    cout << res << endl;
  }
  {
    string s1 = "abcd";
    string s2 = "def";
    auto r = shorterString(s1, s2);
    cout << r << endl;
  }
}
