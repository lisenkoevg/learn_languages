from os import environ

dic = {}
dic[environ['arr1']] = ""
dic[environ['arr2']] = ""
dic[environ['arr3']] = ""
test1 = environ['test1']
test2 = environ['test2']

print(str(test1 in dic).lower())
print(str(test2 in dic).lower())
