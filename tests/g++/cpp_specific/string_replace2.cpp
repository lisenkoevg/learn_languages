#include <iostream>

using std::cout;
using std::endl;
using std::string;

constexpr char S[] = "abcdef";

int main() {
  string s = S;
  string s2 = "ABCDEF";

  s.replace(1, 2, s2);
  cout << s << endl;

  s = S;
  s.replace(1, 1, s2, 5, 1);
  cout << s << endl;

  s = S;
  s.replace(1, 1, "ABCDEF");
  cout << s << endl;

  s = S;
  s.replace(1, 1, "ABCDEF", 2);
  cout << s << endl;

  s = S;
  s.replace(1, 1, 3, 'X');
  cout << s << endl;

  s = S;
  s.replace(1, 1, {'Z', 'Y'});
  cout << s << endl;

  s = S;
  s.replace(s.begin(), s.end() - 2, s2.begin(), s2.begin() + 3);
  cout << s << endl;

  //   error: no matching function for call to
  //   ‘std::basic_string<char>::replace(
  //         std::basic_string<char>::iterator, __gnu_cxx::__normal_iterator<char*,
  //           std::basic_string<char> >,
  //           std::string&,
  //           int,
  //           int
  //         )’
  //   s.replace(s.begin(), s.begin() + 2, s2, 4, 2);
}
