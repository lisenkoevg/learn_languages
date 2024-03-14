import os
import sys

add = os.environ['add']
s = sys.stdin.read()
arr = s.split(' ')
arr = list(map((lambda x: x + add), arr))
print(' '.join(arr))
