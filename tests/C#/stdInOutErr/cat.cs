using System;
using System.IO;

internal class Program {
  static void Main() {
    Stream inputStream = Console.OpenStandardInput();
    Stream outputStream = Console.OpenStandardOutput();
    int oneByte;
    while ((oneByte = inputStream.ReadByte()) != -1) {
      outputStream.WriteByte((byte)oneByte);
    }
    inputStream.Close();
    outputStream.Close();
  }
}
