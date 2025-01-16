#include <iostream>

using std::cout;
using std::endl;
using std::string;

int main() {
  int i {1};
  double d {1.1};
  string s = "abc";
  char c[] = "def"; 
  const string *ps = &s;
  char *pc = c;
  void *pv;

  pv = (void*)ps;
  i = int(*pc);
  pv = &d;
  pc = (char*) pv;

  pv = static_cast<void*>(const_cast<string*>(ps));
  i = static_cast<int>(*pc);
  pv = static_cast<void*>(&d); // static_cast is optional
  pc = static_cast<char*>(pv);
  cout << 1 << endl;
  return 0;
}
