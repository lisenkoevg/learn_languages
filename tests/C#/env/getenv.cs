using System;

internal class Program {
  static void Main() {
    Console.WriteLine(Environment.GetEnvironmentVariable("ENV_VAR"));
    Console.WriteLine(Environment.GetEnvironmentVariable("ENV_VAR2"));
  }
}
