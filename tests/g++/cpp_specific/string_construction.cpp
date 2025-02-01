#include <iostream>

using std::cout;
using std::endl;
using std::string;

#define PP(s) cout << #s ": " << s << endl

int main() {
  const char *cp = "Hello World!!!";
  char notNull[] = {'H', 'i'};

  string s1(cp);
  PP(s1);
  string s2(notNull, 2);
  PP(s2);
  //   undefined behaviour
  //   string s3(notNull);
  string s4(cp + 6, 5);
  PP(s4);
  string s5(s1, 6, 5);
  PP(s5);
  string s6(s1, 6);
  PP(s6);
  string s7(s1, 6, 20);
  PP(s7);
  try {
    string s8(s1, 16);
  } catch (std::out_of_range &r) {
    cout << r.what() << endl;
  }
}
