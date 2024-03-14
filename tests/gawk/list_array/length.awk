BEGIN {
  split("", arr)
  arr[0] = arr1
  arr[1] = arr2
  arr[2] = arr3
  print alen(n) # print 3
}

function alen(a,   k, n) {
  for (k in arr)
    n++
  return n
}
