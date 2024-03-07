module.exports = ({ EXPECTED, GROUPS, TESTS_DIR, EXPECTED_DIR, cmdOpts }) => {
  const util = require('util')
  const fs = require('fs-extra')
  const path = require('path')
  const async = require('async')

  class ActionWithGroup {
    constructor(src, callback) {
      this.callback = callback
      this.src = src
      this.validate('src')
      this.prepare('src')
      this.setTestsAndExpectedDir()
      this.setListOfSrc()
    }

    validate(name) {
      const re = /^[-_0-9a-zA-Z\\\/]+$/
      if (!this[name] || !re.test(this[name]))
        throw new Error(util.format('invalid group name: "%s"', this[name]))
    }

    prepare(name) {
      this[name] = this[name].replace(/\//g, path.sep)
    }

    setTestsAndExpectedDir() {
      this.groupsTests = Array.from(GROUPS)
      this.groupsExpected = Array.from(Object.keys(EXPECTED).reduce((acc, cur) => {
        acc.add(path.dirname(cur))
        return acc
      }, new Set()))
    }

    setListOfSrc() {
      this.actionList = []
      this.groupsTests.forEach(x => {
        const sp = x.split(path.sep)
        const currentGroup = path.join(...sp.slice(1))
        const compilerTitle = sp[0]
        if (this.src == currentGroup) {
          const base = path.join(TESTS_DIR, compilerTitle)
          this.actionList.push({
            base,
            src: path.join(base, this.src)
          })
        }
      })
      this.groupsExpected.forEach(x => {
        if (this.src == x) {
          const base = EXPECTED_DIR
          this.actionList.push({
            base,
            src: path.join(EXPECTED_DIR, this.src),
          })
        }
      })
    }

     doAction() {
      return new Promise((resolve, reject) => {
        if (!this.actionList.length) {
          return reject(new Error('no such group, nothing to do'))
        }
        resolve()
      })
    }
  }

  class ActionWithTwoGroups extends ActionWithGroup {
    constructor(src, dest, callback) {
      super(src, callback)
      this.dest = dest || ''
      this.validate('dest')
      this.prepare('dest')
      this.addDestToSrcList()
    }

    addDestToSrcList() {
      this.actionList.forEach(x => {
        x.dest = path.join(x.base, this.dest)
      })
    }

    checkDestinations(conditionIsExists) {
      let dest = this.actionList.map(x => x.dest)
      return async.eachSeries(dest, (x, cb) => {
        fs.access(x, (err, res) => {
          if (err) {
            if (err.code != 'ENOENT') {
              return cb(err)
            } else {
              if (conditionIsExists) {
                cb(new Error(`directory "${x}" not exists`))
              } else {
                cb()
              }
            }
          } else
          if (!conditionIsExists) {
            cb(new Error(`directory "${x}" already exists`))
          } else {
            cb()
          }
        })
      })
    }
  }

  class RenameGroup extends ActionWithTwoGroups {
    doAction() {
      return super.doAction()
        .then(this.checkDestinations.bind(this, false))
        .then(() => this.rename())
    }

    rename() {
      if (cmdOpts._all['dry-run']) {
        console.log('Would move directories:', )
        this.actionList.forEach(x => {
          console.log('  %s -> %s', x.src, x.dest)
        })
        return null
      } else {
        return async.eachSeries(this.actionList, (x, cb) => {
          fs.copy(x.src, x.dest, { preserveTimestamps: true })
          .then(() => {
            if (cmdOpts._all.verbose)
              console.log('copied %s -> %s', x.src, x.dest)
            return fs.remove(x.src)
          })
          .then(() => {
            if (cmdOpts._all.verbose)
              console.log('removed %s', x.dest)
            cb()
          })
          .catch(cb)
        })
      }
    }
  }

  class DeleteGroup extends ActionWithGroup {
    doAction() {
      return super.doAction()
        .then(() => this.remove())
    }

    remove() {
      if (cmdOpts._all['dry-run']) {
        console.log('Would remove directories:', )
        this.actionList.forEach(x => {
          console.log('  %s', x.src)
        })
        return null
      } else {
        return async.eachSeries(this.actionList, (x, cb) => {
          fs.remove(x.src)
          .then(() => {
            if (cmdOpts._all.verbose)
              console.log('removed %s', x.src)
            cb()
          })
          .catch(cb)
        })
      }
    }
  }

  class MergeGroup extends ActionWithTwoGroups {}

  function handleGroup(opt) {
    const act = Object.keys(opt)[0]
    const param = opt[act]
    let obj
    switch (act) {
      case 'remove-group':
        obj = new DeleteGroup(param)
        break;
      case 'rename-group':
        obj = new RenameGroup(...param.split(':'))
        break;
      case 'merge-group':
        obj = new MergeGroup(...param.split(':'))
        break;
    }
    return obj.doAction()
  }

  return handleGroup
}
