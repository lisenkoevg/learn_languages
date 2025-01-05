#include <iostream>

struct Matrix {
  virtual void pow(double x) { std::cout << "Matrix.pow(double)" << std::endl; };
  virtual void pow(int x) { std::cout << "Matrix.pow(int)" << std::endl;  };
};

struct SparseMatrix1 : public Matrix {
  void pow(int x) override { std::cout << "SparseMatrix1.pow(int)" << std::endl; };
};

struct SparseMatrix2 : public Matrix {
  using Matrix::pow;
  void pow(int x) override { std::cout << "SparseMatrix2.pow(int)" << std::endl; };
};

int main() {
  SparseMatrix1 d1;
  d1.pow(1.5);
  SparseMatrix2 d2;
  d2.pow(1.5);
}

