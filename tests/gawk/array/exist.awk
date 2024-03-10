BEGIN {
  arr[0] = 10
  arr[1] = 20

  if (1 in arr)
    print arr[1] # print 20

  if (2 in arr)
    print arr[2] # not print
}
