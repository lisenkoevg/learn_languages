#include <iostream>
#include <string>

int main() {
  std::string line;
  while (std::getline(std::cin, line)) {
    if (line != "") {
      std::cout << line << std::endl;
    }
  }
  return 0;
}
