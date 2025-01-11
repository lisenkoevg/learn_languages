#include <iostream>

using std::cout;
using std::endl;

int main() {

  int ia[3][4] = {
	{10, 11, 12, 13},
	{14, 15, 16, 17},
	{18, 19, 20, 21}
  };
//   int ia[3][4] = { {0}, {4}, {8} };
//   int ia[3][4] = { {0, 1}, {4, 5}, {8, 9} };

  int arr[10][10][10] = {0};
  ia[2][3] = arr[0][0][0];

  int *pia = &ia[0][0];
  for (int i = 0; i != 12; i++) {
	cout << *(pia + i) << " ";
	if ((i+1) % 4 == 0)
	  cout << endl;
  }
  cout << endl;

  int (&row)[4] = ia[1];
//   error: array must be initialized with a brace-enclosed initializer
//   int row2[4] = ia[1]; 
  for (int i = 0; i != 4; i++)
	cout << row[i] << " ";
  cout << endl << endl; 

  size_t cnt = 100;
  for (auto &row : ia)
    for (auto &col : row)
      col = cnt++;

//   error: ‘begin’ was not declared in this scope; did you mean ‘std::begin’?
//   for (auto row : ia) // row has type *int
//     for (auto col : row) // try to iterate over *int 
//       cout << col;

  for (int (&row)[4] : ia)
    for (int &col : row)
      cout << col << " ";
  cout << endl;

  int i = 0;
  for (int (*b)[4] = std::begin(ia); b != std::end(ia); b++)
    for (int *c = std::begin(*b); c != std::end(*b); c++) {
      cout << *c << " ";
      if ((i+1) % 4 == 0) cout << endl;
      i++;
    }
  cout << endl;

  for (int i = 0; i != 12; i++) {
	cout << *(pia + i) << " ";
	if ((i+1) % 4 == 0) cout << endl;
  }
  cout << endl;

  for ( int (*p)[4] = ia; p != ia + 3; ++p) {
    for (int *q = *p; q != *p + 4; ++q)
      cout << *q + 10 << ' ';
    cout << endl;
  }
}
