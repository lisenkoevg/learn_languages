#include <iostream>
using std::cout;
using std::endl;

struct File {
  int a;
  File() {
    cout << "File default ctor" << endl;
    a = 1;
  }
  File(int a_) : a(a_) {
    cout << "File ctor" << endl;
  }  
  ~File() {
    cout << "File dtor" << endl;
  }
};
struct InputFile : virtual public File {
  int b;
  InputFile(int b_) : File(b_ * 2), b{b_} {
    cout << "InputFile ctor" << endl;
  }
};

struct OutputFile : virtual public File {
  int c;
  OutputFile(int c_) : File(c_ * 3), c{c_} {
    cout << "OutputFile ctor" << endl;
  }
};

struct IOFile : public InputFile, public OutputFile {
  int d;
  IOFile(int d_) : File(d_), InputFile(d_ * 5), OutputFile(d_ * 10), d{d_} {
    cout << "IOFile ctor" << endl;
  }
};

struct IOFile2 : public IOFile {
  int e;
  IOFile2(int e_) : File(e_), IOFile(e_), e(e_) {}
};

int main() {
  IOFile ioF{11};
  cout << "ioF.InputFile::a = " << ioF.InputFile::a << endl;
  cout << "ioF.OutputFile::a = " << ioF.OutputFile::a << endl;
  cout << "ioF.a = " << ioF.a << endl;

  cout << endl;
  InputFile inF{11};
  OutputFile outF{11};
  cout << "inF.a = " << inF.a << endl;
  cout << "outF.a = " << outF.a << endl;
}
