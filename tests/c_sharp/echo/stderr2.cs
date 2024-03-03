// #stderr
using System;

internal class Program {
  static void Main() {
    Console.WriteLine("line written to stdout");
    Console.Error.WriteLine("line written to stderr");
  }
}
