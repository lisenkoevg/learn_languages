const stringify = require('json-stable-stringify')
const fs = require('fs-extra')
const path = require('path')

module.exports = { pretty, removeEmptyDirs }

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
