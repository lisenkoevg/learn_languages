const assert = require('assert')
const util = require('util')

module.exports = { parseTags }

const tests = [
  { in: '#outputRc #outputStderr #args a "b c" #env a=b e="a b"',
    out: ['#outputRc', '#outputStderr', '#args', 'a', 'b c', '#env', 'a=b', 'e=a b'],
    outObj: { outputRc: true, outputStderr: true, args: ['a', 'b c'], env: { a: 'b', e: 'a b' } }
  },
  { in: 'aaa #args', out: ['aaa', '#args'], outObj: { _error: 2 } },
  { in: '#env =1', out: ['#env', '=1'], outObj: { _error: 3 } },
  { in: '#env 1=', out: ['#env', '1='], outObj: { _error: 4 } },
  { in: '#args 1 2\n#args', out: ['#args', '1', '2', '\n', '#args'], outObj: { _error: 5 } },
  {
    in: '#env a=1 b=2 #args\n#env c=3 b=4',
    out: ['#env', 'a=1', 'b=2', '#args', '\n', '#env', 'c=3', 'b=4',],
    outObj: {
      env: { a: '1', b: '4', c: '3'},
      args: []
    }
  },
  { in: '', out: [], outObj: {} },
  { in: '1', out: ['1'] },
  { in: ' 1 ', out: ['1'] },
  { in: '1 2', out: ['1', '2'] },
  { in: '1  2', out: ['1', '2'] },
  { in: '"1"', out: ['1'] },
  { in: '"1 2"', out: ['1 2'] },
  { in: '"1 2" 3', out: ['1 2', '3'] },
  { in: '0 "1 2" "3 4"', out: ['0', '1 2', '3 4'] },
  { in: '0 ""1', out: ['0', '1'] },
  { in: '0\n1', out: ['0', '\n', '1'] },
  { in: '"1 2 3', out: { _error: 0 } },
  { in: '"1" "2 3', out: { _error: 0 } },
  { in: '\'', out: { _error: 1 } },
  { in: '\\', out: { _error: 1 } },
]

const errors = {
  0: 'nonterminated double quote',
  1: 'backslash and single quote not supported',
  2: 'unrecognized token',
  3: 'can\'t parse env variable',
  4: 'wrong env variable name',
  5: 'ambiguous #args tag',
}

function parseTags(str) {
  return tagsArrToObj(strToTagsArr(str))
}

function strToTagsArr(str) {
  str = str.trim()
  const result = []

  let dquote = false

  let cur = ''
  for (let i = 0; i < str.length; i++) {
    switch (str[i]) {
      case ' ':
        if (!dquote) {
          if (cur) {
            result.push(cur)
            cur = ''
          }
        } else {
          cur += str[i]
        }
        break
      case '\n':
        if (dquote)
          throw new Error(getErrorMessage(0, str))
        if (cur) {
          result.push(cur)
          cur = ''
        }
        result.push(str[i])
        break
      case '"':
        if (!dquote)
          dquote = true
        else
          dquote = false
        break
      case '\'':
      case '\\':
        throw new Error(getErrorMessage(1, str))
        break
      default:
        cur += str[i]
        break
    }
  }
  if (!dquote) {
    if (cur) result.push(cur)
  } else {
    throw new Error(getErrorMessage(0, str))
  }
  return result
}

function tagsArrToObj(arr) {
  let result = {}
  let isArgs = false
  let isEnv = false
  arr.forEach(token => {
    if (token == '') return
    switch (token) {
      case '#outputRc':
        result.outputRc = true
        break
      case '#outputStderr':
        result.outputStderr = true
        break
      case '#env':
        isEnv = true
        isArgs = false
        if (!result.env)
          result.env = {}
        break
      case '#args':
        isArgs = true
        isEnv = false
        if (result.args)
          throw new Error(getErrorMessage(5, token))
        result.args = []
        break
      case '\n':
        isArgs = false
        isEnv = false
        break
      default:
        if (isArgs) {
          result.args.push(token)
        } else if (isEnv) {
          if (token.indexOf('=') == -1)
            throw new Error(getErrorMessage(3, token))
          let [ name, val ] = token.split('=')
          if (!name) {
            throw new Error(getErrorMessage(3, token))
          }
          if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(name))
            throw new Error(getErrorMessage(4, token))
          result.env[name] = val
        } else {
          throw new Error(getErrorMessage(2, token))
        }
        break
    }
  })
  return result
}

function getErrorMessage(n, str) {
  str = str ? ': ' + str : ''
  return util.format('%s%s', errors[n], str)
}

tests.forEach(x => {
  let result
  try {
    result = strToTagsArr(x.in)
  } catch (e) {
    result = e.toString()
  }
  if (x.out._error == undefined)
    assert.deepStrictEqual(result, x.out)
  else
    assert.match(result, new RegExp(getErrorMessage(x.out._error)))
})

tests.forEach(x => {
  if (!x.outObj) return
  let result
  try {
    result = parseTags(x.in)
  } catch (e) {
    result = e.toString()
  }
  if (x.outObj._error == undefined)
    assert.deepStrictEqual(result, x.outObj)
  else
    assert.match(result, new RegExp(getErrorMessage(x.outObj._error)))
})
