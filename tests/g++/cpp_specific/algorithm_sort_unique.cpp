/*
   Lippman, Exc 10.9, 10.11
*/
#include <iostream>
#include <vector>
#include <algorithm>

using std::cout;
using std::endl;
using std::vector;
using std::string;

void print(const vector<string> &v);
void elimDupl(vector<string> &vec);
bool isShorter(string, string);

int main() {
  vector<string> vec = {"the", "quick", "red", "fox", "jumps", "over", "the", "slow", "red", "turtle"};
  print(vec);
  elimDupl(vec);
  print(vec);
  stable_sort(vec.begin(), vec.end(), isShorter);
  print(vec);
}

void print(const vector<string> &v) {
  for (auto i:v)
    cout << i << ", ";
  cout << endl;
}

void elimDupl(vector<string> &vec) {
  sort(vec.begin(), vec.end());
  print(vec);
  vector<string>::iterator res = unique(vec.begin(), vec.end());
  print(vec);
  vec.erase(res, vec.end());
}

bool isShorter(string s1, string s2) {
  return s1.size() < s2.size();
}
