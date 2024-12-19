#include <iostream>

using KeyT = int;

struct S {
  S() { std::cout << "default" << std::endl; }
  S(KeyT key) { std::cout << "direct" << std::endl; }
};

struct Node {
  S key_;
  Node(KeyT key) { key_ = key; }
};

struct Node2 {
  S key_;
  Node2(KeyT key) : key_(key) {}
};

int main() {
  Node n = 1;
  Node2 n2 = 2;
}

