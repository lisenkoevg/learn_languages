const obj = {}
obj[process.env.arr1] = ""
obj[process.env.arr2] = ""
obj[process.env.arr3] = ""

const test1 = process.env.test1
const test2 = process.env.test2
console.log(test1 in obj)
console.log(test2 in obj)
