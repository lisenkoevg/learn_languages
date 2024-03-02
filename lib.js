const stringify = require('json-stable-stringify')
const fs = require('fs-extra')
const path = require('path')

module.exports = { pretty, removeEmptyDirs}

function pretty(obj, caption) {
  let replacer = (key, val) => {
    if (val instanceof RegExp || typeof val == 'function')
      val = val.toString()
    return val
  }
  if (caption) console.log(caption + ':')
  console.log(stringify(obj, { space: 2, replacer }))
}

function removeEmptyDirs(dir) {
  let isEmpty = true
  const list = fs.readdirSync(dir, { withFileTypes: true })

  const dirs = list.filter(de => de.isDirectory())
    .map(de => path.join(de.path, de.name))
  const files = list.filter(de => de.isFile())
    .map(de => path.join(de.path, de.name))

  if (files.length) isEmpty = false
  dirs.forEach(d => {
    if (!removeEmptyDirs(d))
      isEmpty = false
  })
  if (isEmpty) {
    fs.rmdirSync(dir)
  }
  return isEmpty
}

function strHex(str, last) {
  console.log('|%s|', str)
  if (typeof str != 'string' || !str.length)
    return
  const splitted = str.split(/\n/)
  if (splitted.length == 1) {
    const spaced = ' ' + str.split(/(<?.)/).filter(x => x).join(' ') + (!last ? '  ' : '')
    const hex = Buffer.from(str + (!last ? '\n' : ''), 'utf8').toString('hex')
    console.log('|%s|', spaced)
    console.log('|%s|', hex)
  } else {
    splitted.forEach((str, i, arr) => {
      strHex(str, i == arr.length - 1)
    })
  }
}
