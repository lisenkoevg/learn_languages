using System;

internal class Program {
  static void Main() {
    string str = Environment.GetEnvironmentVariable("str");
    Console.WriteLine(str.Length);
  }
}
