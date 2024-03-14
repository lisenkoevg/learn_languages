import os
import sys

add = os.environ['add']
s = sys.stdin.read()
arr = s.split(' ')

def addSuf(x):
  return x + add

arr = list(map(addSuf, arr))
print(' '.join(arr))
