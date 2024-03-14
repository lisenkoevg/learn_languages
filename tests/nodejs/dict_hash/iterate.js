'use strict'
const obj = {key1: 'val1', key2: 'val2' }
for (let k in obj) {
  console.log("%s:%s", k, obj[k])
}
