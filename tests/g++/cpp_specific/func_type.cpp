#include <iostream>
#include <vector>

using std::endl;
using std::cout;
using std::vector;

using func = int(int, int);
typedef int func2(int, int); 

using fp = int(*)(int, int);
typedef int (*fp2)(int, int);

int add(int a, int b) { return a + b; }
int multi(int a, int b) { return a * b; }
func *select(bool b) { return b ? add : multi; }

int main() {
  vector<fp> v;
  v.push_back(select(true));
  v.push_back(select(false));
  cout << v[0](3,4) << endl;
  cout << v[1](5,6) << endl;
}
