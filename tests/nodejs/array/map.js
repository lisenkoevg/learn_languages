const arrBuf = []
process.stdin.on('data', ch => {
  arrBuf.push(ch)
})
process.stdin.on('end', () => {
  str = Buffer.concat(arrBuf).toString()
  const arr = str.split(' ')
  console.log(arr.map(x => x + process.env.add).join(' '))
})
