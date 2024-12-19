#include <iostream>

enum month {
  Jan, Feb, Dec, month_end
};

typedef enum month month;

void operator++(month &x) {
  x = static_cast<month>(x + 1);
}

int main() {
  for (month m = Jan; m <= Dec; ++m) {
    std::cout << m << std::endl;
  }
}
