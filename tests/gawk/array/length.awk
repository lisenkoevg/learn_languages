BEGIN {
  split("", arr)
  arr[0] = 10
  arr[1] = 10
  arr[2] = 20
  arr[3] = 30
  arr[5] = 30
  print alen(n) # print 5
}

function alen(a,   k, n) {
  for (k in arr)
    n++
  return n
}
